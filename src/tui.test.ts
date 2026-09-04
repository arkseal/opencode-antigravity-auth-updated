import { describe, it, expect } from "vitest";
import tuiPlugin from "./tui";

describe("TUI Plugin Module", () => {
  it("should have correct ID and tui function", () => {
    expect(tuiPlugin.id).toBe("antigravity-quota.tui");
    expect(typeof tuiPlugin.tui).toBe("function");
  });

  it("built dist/tui.js should have correct ID and tui function", async () => {
    const distModule = await import("../dist/tui.js");
    expect(distModule.default.id).toBe("antigravity-quota.tui");
    expect(typeof distModule.default.tui).toBe("function");
  });
});
