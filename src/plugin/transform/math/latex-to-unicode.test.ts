import { describe, it, expect } from "vitest";
import { latexToUnicode } from "./latex-to-unicode";

describe("latexToUnicode - symbols and guards", () => {
  it("converts arrow macros inside $...$", () => {
    expect(latexToUnicode("Step 1 $\\to$ Step 2")).toBe("Step 1 → Step 2");
    expect(latexToUnicode("$A \\Rightarrow B$")).toBe("A ⇒ B");
    expect(latexToUnicode("$A \\leftrightarrow B$")).toBe("A ⇔ B");
    expect(latexToUnicode("$\\uparrow$ and $\\downarrow$")).toBe("↑ and ↓");
  });

  it("converts comparison, set, and relational symbols", () => {
    expect(latexToUnicode("$x \\approx y$")).toBe("x ≈ y");
    expect(latexToUnicode("$a \\neq b$")).toBe("a ≠ b");
    expect(latexToUnicode("$x \\le y \\ge z$")).toBe("x ≤ y ≥ z");
    expect(latexToUnicode("$x \\in S$")).toBe("x ∈ S");
    expect(latexToUnicode("$A \\subset B$")).toBe("A ⊂ B");
    expect(latexToUnicode("$\\pm 5$")).toBe("± 5");
    expect(latexToUnicode("$3 \\times 4 \\div 2$")).toBe("3 × 4 ÷ 2");
    expect(latexToUnicode("$\\infty$")).toBe("∞");
  });

  it("converts Greek letters", () => {
    expect(latexToUnicode("$\\alpha + \\beta = \\gamma$")).toBe("α + β = γ");
    expect(latexToUnicode("$\\Delta t$")).toBe("Δ t");
    expect(latexToUnicode("$\\lambda \\mu \\pi$")).toBe("λ μ π");
  });

  it("simplifies complexity and style wrappers", () => {
    expect(latexToUnicode("$\\mathcal{O}(n)$")).toBe("O(n)");
    expect(latexToUnicode("$\\text{Total}$")).toBe("Total");
    expect(latexToUnicode("$\\mathrm{id}$")).toBe("id");
  });

  it("preserves currency amounts", () => {
    expect(latexToUnicode("Costs $10 or $5.99, max $1,000.")).toBe("Costs $10 or $5.99, max $1,000.");
  });

  it("preserves shell variables and env expansions", () => {
    expect(latexToUnicode("echo $VAR and ${FOO}")).toBe("echo $VAR and ${FOO}");
    expect(latexToUnicode("PID is $$ in bash")).toBe("PID is $$ in bash");
  });

  it("preserves inline code and fenced code blocks", () => {
    expect(latexToUnicode("Use `$\\to$` for arrow")).toBe("Use `$\\to$` for arrow");
    const codeBlock = "```bash\nexport FOO=$BAR\n```";
    expect(latexToUnicode(codeBlock)).toBe(codeBlock);
  });
});

describe("latexToUnicode - structural transformations", () => {
  it("converts powers and superscripts", () => {
    expect(latexToUnicode("$x^2 + y^2 = z^2$")).toBe("x² + y² = z²");
    expect(latexToUnicode("$2^{n}$")).toBe("2ⁿ");
    expect(latexToUnicode("$x^{-1}$")).toBe("x⁻¹");
    expect(latexToUnicode("$O(n^2)$")).toBe("O(n²)");
  });

  it("converts subscripts", () => {
    expect(latexToUnicode("$x_1 + x_2$")).toBe("x₁ + x₂");
    expect(latexToUnicode("$a_i \\le b_j$")).toBe("aᵢ ≤ bⱼ");
    expect(latexToUnicode("$a_{n+1}$")).toBe("aₙ₊₁");
  });

  it("converts fractions", () => {
    expect(latexToUnicode("$\\frac{1}{2}$")).toBe("1/2");
    expect(latexToUnicode("$\\frac{a+b}{c}$")).toBe("(a+b)/c");
    expect(latexToUnicode("$\\frac{x}{y}$")).toBe("x/y");
  });

  it("converts square roots and nth roots", () => {
    expect(latexToUnicode("$\\sqrt{x}$")).toBe("√(x)");
    expect(latexToUnicode("$\\sqrt{a^2 + b^2}$")).toBe("√(a² + b²)");
    expect(latexToUnicode("$\\sqrt[3]{8}$")).toBe("∛(8)");
  });

  it("formats display block equations", () => {
    const input = "$$E = mc^2$$";
    expect(latexToUnicode(input)).toBe("\nE = mc²\n");
  });
});
