import { latexToUnicode } from "./latex-to-unicode.js";
const MAX_PENDING_MATH_CHARS = 300;
export class MathStreamBuffer {
    pending = "";
    /**
     * Appends incoming chunk, transforms completed math expressions,
     * and retains unclosed expressions in the buffer.
     */
    process(chunk) {
        const text = this.pending + chunk;
        this.pending = "";
        // If no dollar sign at all, emit everything
        if (!text.includes("$")) {
            return text;
        }
        // Safety guard: if pending buffer exceeds limits or contains double newline, flush
        if (text.length > MAX_PENDING_MATH_CHARS || text.includes("\n\n")) {
            return latexToUnicode(text);
        }
        // Scan for unclosed delimiter ($ or $$)
        let inCodeSpan = false;
        let inDisplayMath = false;
        let inInlineMath = false;
        let unclosedDelimiterIndex = -1;
        let i = 0;
        while (i < text.length) {
            // Check for code span
            if (text[i] === "`") {
                inCodeSpan = !inCodeSpan;
                i++;
                continue;
            }
            if (inCodeSpan) {
                i++;
                continue;
            }
            // Check escaped \$
            if (text[i] === "\\" && text[i + 1] === "$") {
                i += 2;
                continue;
            }
            // Check for display math $$
            if (text[i] === "$" && text[i + 1] === "$") {
                if (inDisplayMath) {
                    inDisplayMath = false;
                    unclosedDelimiterIndex = -1;
                    i += 2;
                    continue;
                }
                else if (!inInlineMath) {
                    inDisplayMath = true;
                    unclosedDelimiterIndex = i;
                    i += 2;
                    continue;
                }
            }
            // Check for inline math $
            if (text[i] === "$" && !inDisplayMath) {
                if (inInlineMath) {
                    // Check if this $ can be a closing delimiter (not preceded by space)
                    if (i > 0 && text[i - 1] !== " ") {
                        inInlineMath = false;
                        unclosedDelimiterIndex = -1;
                    }
                    i++;
                    continue;
                }
                else {
                    // Opening $: must not be followed by space or end of string with nothing
                    const nextChar = text[i + 1];
                    if (nextChar !== " ") {
                        inInlineMath = true;
                        unclosedDelimiterIndex = i;
                    }
                    i++;
                    continue;
                }
            }
            i++;
        }
        // If unclosed delimiter found, hold it in pending
        if ((inInlineMath || inDisplayMath) && unclosedDelimiterIndex !== -1) {
            const readyPart = text.slice(0, unclosedDelimiterIndex);
            this.pending = text.slice(unclosedDelimiterIndex);
            return latexToUnicode(readyPart);
        }
        return latexToUnicode(text);
    }
    /**
     * Flushes any remaining pending buffer.
     */
    flush() {
        if (!this.pending)
            return "";
        const remaining = this.pending;
        this.pending = "";
        return latexToUnicode(remaining);
    }
    /**
     * Returns true if there is unclosed text in the buffer.
     */
    hasPending() {
        return this.pending.length > 0;
    }
}
//# sourceMappingURL=stream-buffer.js.map