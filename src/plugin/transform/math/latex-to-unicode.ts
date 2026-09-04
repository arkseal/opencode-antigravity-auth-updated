const SYMBOL_MAP: Record<string, string> = {
  // Arrows
  "\\to": "→",
  "\\rightarrow": "→",
  "\\longrightarrow": "→",
  "\\gets": "←",
  "\\leftarrow": "←",
  "\\longleftarrow": "←",
  "\\Rightarrow": "⇒",
  "\\implies": "⇒",
  "\\Longrightarrow": "⇒",
  "\\Leftarrow": "⇐",
  "\\impliedby": "⇐",
  "\\leftrightarrow": "⇔",
  "\\iff": "⇔",
  "\\Longleftrightarrow": "⇔",
  "\\uparrow": "↑",
  "\\downarrow": "↓",
  "\\updownarrow": "↕",
  "\\mapsto": "↦",

  // Comparisons and Relations
  "\\approx": "≈",
  "\\neq": "≠",
  "\\ne": "≠",
  "\\le": "≤",
  "\\leq": "≤",
  "\\ge": "≥",
  "\\geq": "≥",
  "\\equiv": "≡",
  "\\sim": "∼",
  "\\propto": "∝",
  "\\pm": "±",
  "\\mp": "∓",
  "\\times": "×",
  "\\cdot": "·",
  "\\div": "÷",

  // Set and Logic
  "\\in": "∈",
  "\\notin": "∉",
  "\\ni": "∋",
  "\\owns": "∋",
  "\\subset": "⊂",
  "\\supset": "⊃",
  "\\subseteq": "⊆",
  "\\supseteq": "⊇",
  "\\cup": "∪",
  "\\cap": "∩",
  "\\setminus": "\\",
  "\\emptyset": "∅",
  "\\varnothing": "∅",
  "\\forall": "∀",
  "\\exists": "∃",
  "\\nexists": "∄",
  "\\infty": "∞",
  "\\partial": "∂",
  "\\nabla": "∇",
  "\\sum": "∑",
  "\\prod": "∏",
  "\\int": "∫",
  "\\circ": "∘",
  "\\bullet": "•",
  "\\star": "⋆",
  "\\angle": "∠",

  // Greek Lowercase
  "\\alpha": "α",
  "\\beta": "β",
  "\\gamma": "γ",
  "\\delta": "δ",
  "\\epsilon": "ε",
  "\\varepsilon": "ε",
  "\\zeta": "ζ",
  "\\eta": "η",
  "\\theta": "θ",
  "\\iota": "ι",
  "\\kappa": "κ",
  "\\lambda": "λ",
  "\\mu": "μ",
  "\\nu": "ν",
  "\\xi": "ξ",
  "\\pi": "π",
  "\\rho": "ρ",
  "\\sigma": "σ",
  "\\tau": "τ",
  "\\upsilon": "υ",
  "\\phi": "φ",
  "\\varphi": "φ",
  "\\chi": "χ",
  "\\psi": "ψ",
  "\\omega": "ω",

  // Greek Uppercase
  "\\Gamma": "Γ",
  "\\Delta": "Δ",
  "\\Theta": "Θ",
  "\\Lambda": "Λ",
  "\\Xi": "Ξ",
  "\\Pi": "Π",
  "\\Sigma": "Σ",
  "\\Upsilon": "Υ",
  "\\Phi": "Φ",
  "\\Psi": "Ψ",
  "\\Omega": "Ω",
};

/**
 * Transforms an inner LaTeX expression (content inside $...$ or $$...$$) to Unicode.
 */
export function transformMathExpression(expr: string): string {
  let res = expr;

  // Replace styles: \text{foo}, \mathrm{foo}, \operatorname{foo}, \mathbf{foo}
  res = res.replace(/\\(?:text|mathrm|operatorname|mathbf|mathit)\{([^}]+)\}/g, "$1");

  // Replace complexity \mathcal{O} or \mathcal{o}
  res = res.replace(/\\mathcal\{([A-Za-z])\}/g, "$1");

  // Replace mapped symbols with word boundary / delimiter awareness
  for (const [cmd, symbol] of Object.entries(SYMBOL_MAP)) {
    const escaped = cmd.replace(/\\/g, "\\\\");
    // Match the command not followed immediately by another ascii letter
    const regex = new RegExp(`${escaped}(?![a-zA-Z])`, "g");
    res = res.replace(regex, symbol);
  }

  return res.trim();
}

/**
 * Checks if a $ occurrence looks like currency (e.g. $10, $5.99) or shell var ($VAR, ${VAR}).
 */
/**
 * Checks whether an expression inside $...$ has LaTeX commands or math operators.
 */
function hasMathIndicators(expr: string): boolean {
  // Contains LaTeX commands (e.g. \to, \times)
  if (/\\\w+/.test(expr)) return true;
  // Contains exponent or subscript syntax
  if (/[\^_{}]/.test(expr)) return true;
  // Contains math operators like +, -, =, <, >, *, / between alphanumeric or symbols
  if (/[a-zA-Z0-9]\s*[=+\-*/<>≤≥≠≈]\s*[a-zA-Z0-9]/.test(expr)) return true;
  return false;
}

/**
 * Checks if a $ occurrence looks like currency (e.g. $10, $5.99) or shell var ($VAR, ${VAR}).
 */
function isFalsePositiveDollar(text: string, index: number, inner: string): boolean {
  // Escaped \$
  if (index > 0 && text[index - 1] === "\\") return true;

  const nextChar = text[index + 1];
  if (!nextChar) return true;

  // Shell variable: ${VAR}
  if (nextChar === "{") return true;

  // Inner starts with space or ends with space: not valid LaTeX inline math
  if (inner.startsWith(" ") || inner.endsWith(" ")) return true;

  // Next char is digit: currency ($10, $5.99) unless it clearly has math indicators (e.g. $3 \times 4$)
  if (/[0-9]/.test(nextChar) && !hasMathIndicators(inner)) return true;

  // Pure uppercase multi-letter identifier without math operators or backslashes (e.g. $PATH$, $USER$)
  if (/^[A-Z_]{2,}$/.test(inner)) return true;

  // If closing dollar is followed immediately by digit (e.g. "$10 to $20")
  const closingDollarIndex = index + 1 + inner.length;
  const afterClosing = text[closingDollarIndex + 1];
  if (afterClosing && /[0-9]/.test(afterClosing) && !hasMathIndicators(inner)) return true;

  return false;
}

/**
 * Main function: transforms LaTeX math expressions in markdown text to Unicode.
 * Code blocks and inline code are protected.
 */
export function latexToUnicode(text: string): string {
  if (!text || !text.includes("$")) {
    return text;
  }

  // Tokenize text into code spans vs normal text
  const tokens: Array<{ type: "code" | "text"; content: string }> = [];
  let currentIndex = 0;

  // Match fenced code blocks (```...```) or inline code (`...`)
  const codeRegex = /(```[\s\S]*?```|`[^`\n]*`)/g;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      tokens.push({ type: "text", content: text.slice(currentIndex, match.index) });
    }
    tokens.push({ type: "code", content: match[0] });
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    tokens.push({ type: "text", content: text.slice(currentIndex) });
  }

  // Process text tokens
  return tokens
    .map((token) => {
      if (token.type === "code") {
        return token.content;
      }

      let content = token.content;

      // 1. Transform display math: $$ ... $$
      content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_match, inner) => {
        const transformed = transformMathExpression(inner);
        return `\n${transformed}\n`;
      });

      // 2. Transform inline math: $ ... $
      // Must not be currency or shell variable
      content = content.replace(/\$([^\$\n]+?)\$/g, (fullMatch, inner: string, offset: number) => {
        if (isFalsePositiveDollar(content, offset, inner)) {
          return fullMatch;
        }
        return transformMathExpression(inner);
      });

      return content;
    })
    .join("");
}
