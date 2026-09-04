import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "node:path";
import * as os from "node:os";

describe("Quota Summary Constants", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENCODE_CONFIG_DIR;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should use default paths when OPENCODE_CONFIG_DIR is NOT set", async () => {
    delete process.env.OPENCODE_CONFIG_DIR;
    const constants = await import("./constants");
    const expectedConfigBase = path.join(os.homedir(), ".config", "opencode");

    expect(constants.CONFIG_PATH).toBe(path.join(expectedConfigBase, "antigravity-accounts.json"));
    expect(constants.COMMAND_DIR).toBe(path.join(expectedConfigBase, "command"));
  });

  it("should use OPENCODE_CONFIG_DIR when it IS set", async () => {
    const customDir = "/tmp/custom-opencode-config";
    process.env.OPENCODE_CONFIG_DIR = customDir;

    const constants = await import("./constants");

    expect(constants.CONFIG_PATH).toBe(path.join(customDir, "antigravity-accounts.json"));
    expect(constants.COMMAND_DIR).toBe(path.join(customDir, "command"));
    expect(constants.CONFIG_PATHS).toContain(path.join(customDir, "antigravity-accounts.json"));
    expect(constants.CONFIG_PATHS.length).toBe(1);
  });
});
