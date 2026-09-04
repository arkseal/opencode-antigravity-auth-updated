import { processImageData } from "../../image-saver.js";
import { getFormatMath } from "../../config/index.js";
import { latexToUnicode, MathStreamBuffer } from "../../transform/math/index.js";
/**
 * Simple string hash for thinking deduplication.
 * Uses DJB2-like algorithm.
 */
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return (hash >>> 0).toString(16);
}
export function createThoughtBuffer() {
    const buffer = new Map();
    return {
        get: (index) => buffer.get(index),
        set: (index, text) => buffer.set(index, text),
        clear: () => buffer.clear(),
    };
}
export function transformStreamingPayload(payload, transformThinkingParts) {
    return payload
        .split('\n')
        .map((line) => {
        if (!line.startsWith('data:')) {
            return line;
        }
        const json = line.slice(5).trim();
        if (!json) {
            return line;
        }
        try {
            const parsed = JSON.parse(json);
            if (parsed.response !== undefined) {
                const transformed = transformThinkingParts
                    ? transformThinkingParts(parsed.response)
                    : parsed.response;
                return `data: ${JSON.stringify(transformed)}`;
            }
        }
        catch (_) { }
        return line;
    })
        .join('\n');
}
export function deduplicateThinkingText(response, sentBuffer, displayedThinkingHashes, mathBuffers, formatMath) {
    if (!response || typeof response !== 'object')
        return response;
    const shouldFormatMath = formatMath ?? getFormatMath();
    const resp = response;
    if (Array.isArray(resp.candidates)) {
        const newCandidates = resp.candidates.map((candidate, index) => {
            const cand = candidate;
            if (!cand?.content)
                return candidate;
            const content = cand.content;
            if (!Array.isArray(content.parts))
                return candidate;
            const newParts = content.parts.map((part) => {
                const p = part;
                // Handle image data - save to disk and return file path
                if (p.inlineData) {
                    const inlineData = p.inlineData;
                    const result = processImageData({
                        mimeType: inlineData.mimeType,
                        data: inlineData.data,
                    });
                    if (result) {
                        return { text: result };
                    }
                }
                if (p.thought === true || p.type === 'thinking') {
                    const fullText = (p.text || p.thinking || '');
                    if (displayedThinkingHashes) {
                        const hash = hashString(fullText);
                        if (displayedThinkingHashes.has(hash)) {
                            sentBuffer.set(index, fullText);
                            return null;
                        }
                        displayedThinkingHashes.add(hash);
                    }
                    const sentText = sentBuffer.get(index) ?? '';
                    if (fullText.startsWith(sentText)) {
                        const delta = fullText.slice(sentText.length);
                        sentBuffer.set(index, fullText);
                        if (delta) {
                            return { ...p, text: delta, thinking: delta };
                        }
                        return null;
                    }
                    sentBuffer.set(index, fullText);
                    return part;
                }
                // Regular text parts: transform LaTeX math to Unicode if enabled
                if (typeof p.text === 'string' && shouldFormatMath) {
                    if (mathBuffers) {
                        let mathBuf = mathBuffers.get(index);
                        if (!mathBuf) {
                            mathBuf = new MathStreamBuffer();
                            mathBuffers.set(index, mathBuf);
                        }
                        const transformedText = mathBuf.process(p.text);
                        return { ...p, text: transformedText };
                    }
                    else {
                        return { ...p, text: latexToUnicode(p.text) };
                    }
                }
                return part;
            });
            const filteredParts = newParts.filter((p) => p !== null);
            return {
                ...cand,
                content: { ...content, parts: filteredParts },
            };
        });
        return { ...resp, candidates: newCandidates };
    }
    if (Array.isArray(resp.content)) {
        let thinkingIndex = 0;
        const newContent = resp.content.map((block) => {
            const b = block;
            if (b?.type === 'thinking') {
                const fullText = (b.thinking || b.text || '');
                if (displayedThinkingHashes) {
                    const hash = hashString(fullText);
                    if (displayedThinkingHashes.has(hash)) {
                        sentBuffer.set(thinkingIndex, fullText);
                        thinkingIndex++;
                        return null;
                    }
                    displayedThinkingHashes.add(hash);
                }
                const sentText = sentBuffer.get(thinkingIndex) ?? '';
                if (fullText.startsWith(sentText)) {
                    const delta = fullText.slice(sentText.length);
                    sentBuffer.set(thinkingIndex, fullText);
                    thinkingIndex++;
                    if (delta) {
                        return { ...b, thinking: delta, text: delta };
                    }
                    return null;
                }
                sentBuffer.set(thinkingIndex, fullText);
                thinkingIndex++;
                return block;
            }
            // Regular text block in Anthropic content array
            if (b && typeof b === 'object' && typeof b.text === 'string' && shouldFormatMath) {
                const CLAUDE_KEY = 0;
                if (mathBuffers) {
                    let mathBuf = mathBuffers.get(CLAUDE_KEY);
                    if (!mathBuf) {
                        mathBuf = new MathStreamBuffer();
                        mathBuffers.set(CLAUDE_KEY, mathBuf);
                    }
                    const transformedText = mathBuf.process(b.text);
                    return { ...b, text: transformedText };
                }
                else {
                    return { ...b, text: latexToUnicode(b.text) };
                }
            }
            return block;
        });
        const filteredContent = newContent.filter((b) => b !== null);
        return { ...resp, content: filteredContent };
    }
    return response;
}
export function transformSseLine(line, signatureStore, thoughtBuffer, sentThinkingBuffer, callbacks, options, debugState) {
    if (!line.startsWith('data:')) {
        return line;
    }
    const json = line.slice(5).trim();
    if (!json) {
        return line;
    }
    try {
        const parsed = JSON.parse(json);
        if (parsed.response !== undefined) {
            if (options.cacheSignatures && options.signatureSessionKey) {
                cacheThinkingSignaturesFromResponse(parsed.response, options.signatureSessionKey, signatureStore, thoughtBuffer, callbacks.onCacheSignature);
            }
            let response = deduplicateThinkingText(parsed.response, sentThinkingBuffer, options.displayedThinkingHashes, options.mathBuffers, options.formatMath);
            if (options.debugText && callbacks.onInjectDebug && !debugState.injected) {
                response = callbacks.onInjectDebug(response, options.debugText);
                debugState.injected = true;
            }
            // Note: onInjectSyntheticThinking removed - keep_thinking now uses debugText path
            const transformed = callbacks.transformThinkingParts
                ? callbacks.transformThinkingParts(response)
                : response;
            return `data: ${JSON.stringify(transformed)}`;
        }
    }
    catch (_) { }
    return line;
}
export function cacheThinkingSignaturesFromResponse(response, signatureSessionKey, signatureStore, thoughtBuffer, onCacheSignature) {
    if (!response || typeof response !== 'object')
        return;
    const resp = response;
    if (Array.isArray(resp.candidates)) {
        resp.candidates.forEach((candidate, index) => {
            const cand = candidate;
            if (!cand?.content)
                return;
            const content = cand.content;
            if (!Array.isArray(content.parts))
                return;
            content.parts.forEach((part) => {
                const p = part;
                if (p.thought === true || p.type === 'thinking') {
                    const text = (p.text || p.thinking || '');
                    if (text) {
                        const current = thoughtBuffer.get(index) ?? '';
                        thoughtBuffer.set(index, current + text);
                    }
                }
                if (p.thoughtSignature) {
                    const fullText = thoughtBuffer.get(index) ?? '';
                    if (fullText) {
                        const signature = p.thoughtSignature;
                        onCacheSignature?.(signatureSessionKey, fullText, signature);
                        signatureStore.set(signatureSessionKey, { text: fullText, signature });
                    }
                }
            });
        });
    }
    if (Array.isArray(resp.content)) {
        // Use thoughtBuffer to accumulate thinking text across SSE events
        // Claude streams thinking content and signature in separate events
        const CLAUDE_BUFFER_KEY = 0; // Use index 0 for Claude's single-stream content
        resp.content.forEach((block) => {
            const b = block;
            if (b?.type === 'thinking') {
                const text = (b.thinking || b.text || '');
                if (text) {
                    const current = thoughtBuffer.get(CLAUDE_BUFFER_KEY) ?? '';
                    thoughtBuffer.set(CLAUDE_BUFFER_KEY, current + text);
                }
            }
            if (b?.signature) {
                const fullText = thoughtBuffer.get(CLAUDE_BUFFER_KEY) ?? '';
                if (fullText) {
                    const signature = b.signature;
                    onCacheSignature?.(signatureSessionKey, fullText, signature);
                    signatureStore.set(signatureSessionKey, { text: fullText, signature });
                }
            }
        });
    }
}
export function createStreamingTransformer(signatureStore, callbacks, options = {}) {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';
    const thoughtBuffer = createThoughtBuffer();
    const sentThinkingBuffer = createThoughtBuffer();
    const mathBuffers = options.mathBuffers ?? new Map();
    const effectiveOptions = {
        ...options,
        mathBuffers,
    };
    const debugState = { injected: false };
    let hasSeenUsageMetadata = false;
    return new TransformStream({
        transform(chunk, controller) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                // Quick check for usage metadata presence in the raw line
                if (line.includes('usageMetadata')) {
                    hasSeenUsageMetadata = true;
                }
                const transformedLine = transformSseLine(line, signatureStore, thoughtBuffer, sentThinkingBuffer, callbacks, effectiveOptions, debugState);
                controller.enqueue(encoder.encode(transformedLine + '\n'));
            }
        },
        flush(controller) {
            buffer += decoder.decode();
            if (buffer) {
                if (buffer.includes('usageMetadata')) {
                    hasSeenUsageMetadata = true;
                }
                const transformedLine = transformSseLine(buffer, signatureStore, thoughtBuffer, sentThinkingBuffer, callbacks, effectiveOptions, debugState);
                controller.enqueue(encoder.encode(transformedLine));
            }
            // Flush any pending math expressions
            for (const [candIdx, mathBuf] of mathBuffers.entries()) {
                const remaining = mathBuf.flush();
                if (remaining) {
                    const flushPayload = {
                        response: {
                            candidates: [
                                {
                                    index: candIdx,
                                    content: {
                                        parts: [{ text: remaining }],
                                    },
                                },
                            ],
                        },
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(flushPayload)}\n\n`));
                }
            }
            // Inject synthetic usage metadata if missing (fixes "Context % used: 0%" issue)
            if (!hasSeenUsageMetadata) {
                const syntheticUsage = {
                    response: {
                        usageMetadata: {
                            promptTokenCount: 0,
                            candidatesTokenCount: 0,
                            totalTokenCount: 0,
                        }
                    }
                };
                controller.enqueue(encoder.encode(`\ndata: ${JSON.stringify(syntheticUsage)}\n\n`));
            }
        },
    });
}
//# sourceMappingURL=transformer.js.map