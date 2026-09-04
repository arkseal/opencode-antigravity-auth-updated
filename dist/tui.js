// src/tui.tsx
import { createComponent as _$createComponent } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { createSignal, For, Show, createRoot, onCleanup, onMount } from "solid-js";
import { existsSync, readFileSync } from "fs";

// src/plugin/quota-summary/constants.ts
import * as path from "path";
import * as os from "os";

// src/constants.ts
var ANTIGRAVITY_CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com";
var ANTIGRAVITY_CLIENT_SECRET = "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";
var ANTIGRAVITY_ENDPOINT_DAILY = "https://daily-cloudcode-pa.sandbox.googleapis.com";
var ANTIGRAVITY_ENDPOINT_PROD = "https://cloudcode-pa.googleapis.com";
var ANTIGRAVITY_ENDPOINT_FALLBACKS = [
  ANTIGRAVITY_ENDPOINT_DAILY,
  ANTIGRAVITY_ENDPOINT_PROD
];
var ANTIGRAVITY_VERSION_FALLBACK = "1.19.4";
var ANTIGRAVITY_VERSION = ANTIGRAVITY_VERSION_FALLBACK;
var ANTIGRAVITY_HEADERS = {
  "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Antigravity/${ANTIGRAVITY_VERSION} Chrome/138.0.7204.235 Electron/37.3.1 Safari/537.36`,
  "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
  "Client-Metadata": `{"ideType":"ANTIGRAVITY","platform":"${process.platform === "win32" ? "WINDOWS" : "MACOS"}","pluginType":"GEMINI"}`
};

// src/plugin/quota-summary/constants.ts
var opencodeConfigDir = process.env.OPENCODE_CONFIG_DIR;
var configBase = opencodeConfigDir ? opencodeConfigDir : path.join(os.homedir(), ".config", "opencode");
var commandBase = opencodeConfigDir ? opencodeConfigDir : path.join(os.homedir(), ".config", "opencode");
var COMMAND_DIR = path.join(commandBase, "command");
var COMMAND_FILE = path.join(COMMAND_DIR, "antigravity-quota.md");
var CLOUDCODE_BASE_URL = ANTIGRAVITY_ENDPOINT_PROD;
var ANTIGRAVITY_ENDPOINTS = ANTIGRAVITY_ENDPOINT_FALLBACKS || [
  "https://daily-cloudcode-pa.sandbox.googleapis.com",
  "https://autopush-cloudcode-pa.sandbox.googleapis.com",
  "https://cloudcode-pa.googleapis.com"
];
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var ANTIGRAVITY_CLIENT_ID2 = ANTIGRAVITY_CLIENT_ID;
var ANTIGRAVITY_CLIENT_SECRET2 = ANTIGRAVITY_CLIENT_SECRET;
var CLOUDCODE_METADATA = {
  ideType: "ANTIGRAVITY",
  platform: "PLATFORM_UNSPECIFIED",
  pluginType: "GEMINI"
};
var CONFIG_PATH = path.join(configBase, "antigravity-accounts.json");
var xdgData = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
var dataBase = opencodeConfigDir ? opencodeConfigDir : path.join(xdgData, "opencode");
var CONFIG_PATHS = Array.from(
  /* @__PURE__ */ new Set([CONFIG_PATH, path.join(dataBase, "antigravity-accounts.json")])
);

// src/plugin/quota-summary/utils.ts
function formatDuration(ms) {
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1e3);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  if (days > 0) {
    const remainingHours = totalHours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (totalHours > 0) {
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}h ${remainingMinutes}m`;
  }
  return `${totalMinutes}m`;
}
function shortEmail(email) {
  const atIndex = email.indexOf("@");
  return atIndex === -1 ? email : email.slice(0, atIndex);
}
function miniProgressBar(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  let filled = Math.round(clamped / 20);
  if (clamped > 0 && filled === 0) filled = 1;
  if (clamped < 100 && filled === 5) filled = 4;
  return `[${"\u2588".repeat(filled)}${"\u2591".repeat(5 - filled)}] ${clamped}%`;
}
function formatBucketLabel(bucket) {
  const raw = bucket.displayName || bucket.bucketId || "";
  const cleaned = raw.replace(/\s+Limit(\s+Remaining)?$/i, "").trim();
  if (cleaned.toLowerCase() === "five hour") {
    return "5-Hour";
  }
  return cleaned;
}
function extractProjectId(project) {
  if (!project) return void 0;
  if (typeof project === "string") return project;
  if (typeof project === "object" && "id" in project && typeof project.id === "string") {
    return project.id;
  }
  return void 0;
}

// src/plugin/quota-summary/api.ts
async function refreshAccessToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ANTIGRAVITY_CLIENT_ID2,
      client_secret: ANTIGRAVITY_CLIENT_SECRET2,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Token failed (${response.status})${errorText ? `: ${errorText}` : ""}`);
  }
  const data = await response.json();
  return data.access_token;
}
async function loadCodeAssist(accessToken) {
  const response = await fetch(`${CLOUDCODE_BASE_URL}/v1internal:loadCodeAssist`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": "antigravity/windows/amd64"
    },
    body: JSON.stringify({ metadata: CLOUDCODE_METADATA })
  });
  if (!response.ok) {
    throw new Error(`loadCodeAssist failed (${response.status})`);
  }
  return await response.json();
}
async function fetchUserQuotaSummary(accessToken, projectId) {
  const endpoints = ANTIGRAVITY_ENDPOINTS;
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}/v1internal:retrieveUserQuotaSummary`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": "antigravity/windows/amd64"
        },
        body: JSON.stringify(projectId ? { project: projectId } : {})
      });
      if (!response.ok) {
        throw new Error(`retrieveUserQuotaSummary failed (${response.status})`);
      }
      return await response.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError || new Error("All endpoints failed");
}
async function fetchAccountQuota(account) {
  try {
    if (!account.refreshToken) {
      return { email: account.email, success: false, error: "No refresh token" };
    }
    const accessToken = await refreshAccessToken(account.refreshToken);
    let projectId = account.projectId;
    if (!projectId) {
      const ca = await loadCodeAssist(accessToken);
      projectId = extractProjectId(ca.cloudaicompanionProject);
    }
    const quota = await fetchUserQuotaSummary(accessToken, projectId);
    return {
      email: account.email,
      groups: quota.groups || [],
      success: true
    };
  } catch (err) {
    return {
      email: account.email,
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// src/tui.tsx
var TUI_PLUGIN_ID = "antigravity-quota.tui";
function getResetTimeString(bucket, now) {
  if (!bucket) return "Ready";
  const frac = bucket.remainingFraction ?? 0;
  const percent = Math.round(frac * 100);
  if (percent < 100 && bucket.resetTime) {
    const remainingMs = new Date(bucket.resetTime).getTime() - now;
    return remainingMs > 0 ? formatDuration(remainingMs) : "Ready";
  }
  return "Ready";
}
function SidebarQuota(props) {
  const [quotaResults, setQuotaResults] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [now, setNow] = createSignal(Date.now());
  const updateQuota = async () => {
    if (loading()) return;
    setLoading(true);
    setError(null);
    try {
      let configPath = null;
      for (const p of CONFIG_PATHS) {
        if (existsSync(p)) {
          configPath = p;
          break;
        }
      }
      if (!configPath) {
        throw new Error("Configuration file not found.");
      }
      const content = readFileSync(configPath, "utf-8");
      const data = JSON.parse(content);
      const accounts = data.accounts || [];
      accounts.forEach((acc, index) => {
        if (!acc.email) {
          acc.email = `account-${index + 1}`;
        }
      });
      const results = [];
      for (const acc of accounts) {
        results.push(await fetchAccountQuota(acc));
      }
      setQuotaResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  onMount(() => {
    updateQuota();
    const fetchInterval = setInterval(updateQuota, 5 * 60 * 1e3);
    const tickInterval = setInterval(() => setNow(Date.now()), 10 * 1e3);
    onCleanup(() => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    });
  });
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("text"), _el$5 = _$createElement("text"), _el$7 = _$createElement("text");
    _$insertNode(_el$, _el$2);
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "paddingLeft", 1);
    _$setProp(_el$, "paddingRight", 1);
    _$insertNode(_el$2, _el$3);
    _$insertNode(_el$2, _el$5);
    _$insertNode(_el$2, _el$7);
    _$setProp(_el$2, "flexDirection", "row");
    _$insertNode(_el$3, _$createTextNode(`\u2601\uFE0F Quota Status`));
    _$insertNode(_el$5, _$createTextNode(` `));
    _$setProp(_el$7, "selectable", false);
    _$setProp(_el$7, "onMouseDown", updateQuota);
    _$insert(_el$7, () => loading() ? "[Updating...]" : "[Refresh]");
    _$insert(_el$, _$createComponent(Show, {
      get when() {
        return error();
      },
      get children() {
        var _el$8 = _$createElement("text");
        _$insert(_el$8, () => `Error: ${error()}`);
        _$effect((_$p) => _$setProp(_el$8, "fg", props.theme.error, _$p));
        return _el$8;
      }
    }), null);
    _$insert(_el$, _$createComponent(Show, {
      get when() {
        return _$memo(() => !!(!loading() && quotaResults().length === 0))() && !error();
      },
      get children() {
        var _el$9 = _$createElement("text");
        _$insertNode(_el$9, _$createTextNode(`No accounts configured.`));
        _$effect((_$p) => _$setProp(_el$9, "fg", props.theme.textMuted, _$p));
        return _el$9;
      }
    }), null);
    _$insert(_el$, _$createComponent(For, {
      get each() {
        return quotaResults();
      },
      children: (result) => {
        const emailStr = shortEmail(result.email || "account");
        return (() => {
          var _el$1 = _$createElement("box"), _el$10 = _$createElement("text");
          _$insertNode(_el$1, _el$10);
          _$setProp(_el$1, "flexDirection", "column");
          _$setProp(_el$1, "marginTop", 1);
          _$insert(_el$10, emailStr);
          _$insert(_el$1, _$createComponent(Show, {
            get when() {
              return !result.success;
            },
            get children() {
              var _el$11 = _$createElement("text");
              _$insert(_el$11, () => ` \u2715 ${result.error || "error"}`);
              _$effect((_$p) => _$setProp(_el$11, "fg", props.theme.error, _$p));
              return _el$11;
            }
          }), null);
          _$insert(_el$1, _$createComponent(Show, {
            get when() {
              return result.success;
            },
            get children() {
              return _$createComponent(For, {
                get each() {
                  return result.groups || [];
                },
                children: (group) => (() => {
                  var _el$12 = _$createElement("box"), _el$13 = _$createElement("text"), _el$14 = _$createElement("box");
                  _$insertNode(_el$12, _el$13);
                  _$insertNode(_el$12, _el$14);
                  _$setProp(_el$12, "flexDirection", "column");
                  _$setProp(_el$12, "paddingLeft", 1);
                  _$setProp(_el$12, "marginTop", 1);
                  _$insert(_el$13, () => group.displayName);
                  _$setProp(_el$14, "flexDirection", "column");
                  _$setProp(_el$14, "paddingLeft", 1);
                  _$insert(_el$14, _$createComponent(For, {
                    get each() {
                      return group.buckets || [];
                    },
                    children: (bucket) => {
                      const percent = Math.round((bucket.remainingFraction ?? 0) * 100);
                      const resetStr = getResetTimeString(bucket, now());
                      const label = formatBucketLabel(bucket);
                      return (() => {
                        var _el$15 = _$createElement("text");
                        _$insert(_el$15, () => `${label}: ${miniProgressBar(percent)} (${resetStr})`);
                        _$effect((_$p) => _$setProp(_el$15, "fg", props.theme.textMuted, _$p));
                        return _el$15;
                      })();
                    }
                  }));
                  _$effect((_$p) => _$setProp(_el$13, "fg", props.theme.text, _$p));
                  return _el$12;
                })()
              });
            }
          }), null);
          _$effect((_$p) => _$setProp(_el$10, "fg", props.theme.accent, _$p));
          return _el$1;
        })();
      }
    }), null);
    _$effect((_p$) => {
      var _v$ = props.theme.text, _v$2 = props.theme.textMuted, _v$3 = loading() ? props.theme.textMuted : props.theme.accent;
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "fg", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$5, "fg", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$7, "fg", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
function initializeTui(api, _disposeRoot) {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(ctx) {
        return _$createComponent(SidebarQuota, {
          api,
          get theme() {
            return ctx.theme.current;
          }
        });
      }
    }
  });
}
var tui = async (api) => {
  createRoot((disposeRoot) => initializeTui(api, disposeRoot));
};
var plugin = {
  id: TUI_PLUGIN_ID,
  tui
};
var tui_default = plugin;
export {
  tui_default as default
};
