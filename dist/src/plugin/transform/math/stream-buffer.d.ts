export declare class MathStreamBuffer {
    private pending;
    /**
     * Appends incoming chunk, transforms completed math expressions,
     * and retains unclosed expressions in the buffer.
     */
    process(chunk: string): string;
    /**
     * Flushes any remaining pending buffer.
     */
    flush(): string;
    /**
     * Returns true if there is unclosed text in the buffer.
     */
    hasPending(): boolean;
}
//# sourceMappingURL=stream-buffer.d.ts.map