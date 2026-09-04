import { describe, it, expect } from "vitest";
import { MathStreamBuffer } from "./stream-buffer";

describe("MathStreamBuffer", () => {
  it("passes plain text through immediately", () => {
    const buffer = new MathStreamBuffer();
    expect(buffer.process("Hello world! ")).toBe("Hello world! ");
    expect(buffer.process("Next sentence.")).toBe("Next sentence.");
    expect(buffer.flush()).toBe("");
  });

  it("handles math contained entirely within a single chunk", () => {
    const buffer = new MathStreamBuffer();
    expect(buffer.process("Result: $a \\to b$ done.")).toBe("Result: a → b done.");
    expect(buffer.flush()).toBe("");
  });

  it("buffers partial math split across multiple chunks", () => {
    const buffer = new MathStreamBuffer();
    // Chunk 1 has opening $ and partial macro
    const out1 = buffer.process("Let $x \\");
    expect(out1).toBe("Let ");
    expect(buffer.hasPending()).toBe(true);

    // Chunk 2 completes the expression
    const out2 = buffer.process("to y$ be mapped.");
    expect(out2).toBe("x → y be mapped.");
    expect(buffer.hasPending()).toBe(false);
    expect(buffer.flush()).toBe("");
  });

  it("flushes unclosed $ when stream finishes", () => {
    const buffer = new MathStreamBuffer();
    const out1 = buffer.process("Check $variable");
    expect(out1).toBe("Check ");
    expect(buffer.hasPending()).toBe(true);
    expect(buffer.flush()).toBe("$variable");
  });

  it("safely flushes unclosed $ when safety limits (length or newlines) are exceeded", () => {
    const buffer = new MathStreamBuffer();
    const out1 = buffer.process("Unclosed $start\n\nNew paragraph");
    // Exceeded double newline -> flushes as-is
    expect(out1).toContain("$start\n\nNew paragraph");
    expect(buffer.hasPending()).toBe(false);
  });
});
