/**
 * Transforms an inner LaTeX expression (content inside $...$ or $$...$$) to Unicode.
 */
export declare function transformMathExpression(expr: string): string;
/**
 * Main function: transforms LaTeX math expressions in markdown text to Unicode.
 * Code blocks and inline code are protected.
 */
export declare function latexToUnicode(text: string): string;
//# sourceMappingURL=latex-to-unicode.d.ts.map