import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import { ensureQuotaCommandInstalled } from "./command";
import { COMMAND_FILE } from "./constants";

describe("Quota Command Installer", () => {
  it("should ensure command file exists", async () => {
    const success = await ensureQuotaCommandInstalled();
    expect(success).toBe(true);
    expect(fs.existsSync(COMMAND_FILE)).toBe(true);
  });
});
