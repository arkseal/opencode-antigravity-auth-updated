import * as fs from "node:fs";
import { COMMAND_DIR, COMMAND_FILE, COMMAND_CONTENT } from "./constants.js";
export async function ensureQuotaCommandInstalled() {
    try {
        if (!fs.existsSync(COMMAND_DIR)) {
            await fs.promises.mkdir(COMMAND_DIR, { recursive: true });
        }
        let shouldWrite = true;
        if (fs.existsSync(COMMAND_FILE)) {
            const existing = await fs.promises.readFile(COMMAND_FILE, "utf-8").catch(() => "");
            if (existing === COMMAND_CONTENT) {
                shouldWrite = false;
            }
        }
        if (shouldWrite) {
            await fs.promises.writeFile(COMMAND_FILE, COMMAND_CONTENT, "utf-8");
        }
        return true;
    }
    catch {
        // Best-effort install: don't fail startup if file write fails (e.g. read-only filesystem)
        return false;
    }
}
//# sourceMappingURL=command.js.map