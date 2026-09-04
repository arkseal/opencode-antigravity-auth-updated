import * as path from "node:path";
import * as os from "node:os";
import { ANTIGRAVITY_CLIENT_ID as AUTH_CLIENT_ID, ANTIGRAVITY_CLIENT_SECRET as AUTH_CLIENT_SECRET, ANTIGRAVITY_ENDPOINT_PROD, ANTIGRAVITY_ENDPOINT_FALLBACKS, } from "../../constants.js";
export const opencodeConfigDir = process.env.OPENCODE_CONFIG_DIR;
const configBase = opencodeConfigDir
    ? opencodeConfigDir
    : path.join(os.homedir(), ".config", "opencode");
const commandBase = opencodeConfigDir
    ? opencodeConfigDir
    : path.join(os.homedir(), ".config", "opencode");
export const COMMAND_DIR = path.join(commandBase, "command");
export const COMMAND_FILE = path.join(COMMAND_DIR, "antigravity-quota.md");
export const CLOUDCODE_BASE_URL = ANTIGRAVITY_ENDPOINT_PROD;
export const ANTIGRAVITY_ENDPOINTS = ANTIGRAVITY_ENDPOINT_FALLBACKS || [
    "https://daily-cloudcode-pa.sandbox.googleapis.com",
    "https://autopush-cloudcode-pa.sandbox.googleapis.com",
    "https://cloudcode-pa.googleapis.com",
];
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const ANTIGRAVITY_CLIENT_ID = AUTH_CLIENT_ID;
export const ANTIGRAVITY_CLIENT_SECRET = AUTH_CLIENT_SECRET;
export const CLOUDCODE_METADATA = {
    ideType: "ANTIGRAVITY",
    platform: "PLATFORM_UNSPECIFIED",
    pluginType: "GEMINI",
};
export const CONFIG_PATH = path.join(configBase, "antigravity-accounts.json");
const xdgData = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
const dataBase = opencodeConfigDir
    ? opencodeConfigDir
    : path.join(xdgData, "opencode");
export const CONFIG_PATHS = Array.from(new Set([CONFIG_PATH, path.join(dataBase, "antigravity-accounts.json")]));
export const COMMAND_CONTENT = `---
description: "Display Antigravity quota across all configured accounts"
agent: general
---

Execute the antigravity_quota tool.
Show the output to the user exactly as returned by the tool.
`;
//# sourceMappingURL=constants.js.map