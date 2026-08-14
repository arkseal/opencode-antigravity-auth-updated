import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com";
const CLIENT_SECRET = "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";

const accountsPath = join(homedir(), ".config", "opencode", "antigravity-accounts.json");
let raw;
try {
  raw = JSON.parse(readFileSync(accountsPath, "utf-8"));
} catch (err) {
  console.error("Failed to read accounts file from", accountsPath, err);
  process.exit(1);
}

const account = raw.accounts?.[0];
if (!account?.refreshToken) {
  console.error("No account or refreshToken found in", accountsPath);
  process.exit(1);
}

const refreshToken = account.refreshToken;
const effectiveProjectId = account.managedProjectId || account.projectId;
if (!effectiveProjectId) {
  console.error("No projectId found in account");
  process.exit(1);
}

// Refresh access token
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});

if (!tokenRes.ok) {
  const err = await tokenRes.text();
  console.error("Token refresh failed:", tokenRes.status, err);
  process.exit(1);
}

const { access_token } = await tokenRes.json();
console.log("🔑 Authenticated successfully (access token: " + access_token.slice(0, 15) + "...)");

const FLASH_MODELS = [
  // Gemini 3.5 Flash
  { name: "Gemini 3.5 Flash (Low)", model: "gemini-3.5-flash-low", thinkingLevel: "low" },
  { name: "Gemini 3.5 Flash (Medium)", model: "gemini-3.5-flash-low", thinkingLevel: "medium" },
  { name: "Gemini 3.5 Flash (High)", model: "gemini-3-flash-agent", thinkingLevel: "high" },

  // Gemini 3.6 Flash
  { name: "Gemini 3.6 Flash (Low)", model: "gemini-3.6-flash-low", thinkingLevel: "low" },
  { name: "Gemini 3.6 Flash (Medium)", model: "gemini-3.6-flash-medium", thinkingLevel: "medium" },
  { name: "Gemini 3.6 Flash (High)", model: "gemini-3.6-flash-high", thinkingLevel: "high" },
  { name: "Gemini 3.6 Flash (Tiered)", model: "gemini-3.6-flash-tiered", thinkingLevel: "medium" },

  // Gemini 3.7 Flash
  { name: "Gemini 3.7 Flash (Minimal)", model: "gemini-3.7-flash-tiered", thinkingLevel: "minimal" },
  { name: "Gemini 3.7 Flash (Low)", model: "gemini-3.7-flash-tiered", thinkingLevel: "low" },
  { name: "Gemini 3.7 Flash (Medium)", model: "gemini-3.7-flash-tiered", thinkingLevel: "medium" },
  { name: "Gemini 3.7 Flash (High)", model: "gemini-3.7-flash-tiered", thinkingLevel: "high" },
];

const ENDPOINTS = [
  { label: "Production", url: "https://cloudcode-pa.googleapis.com" },
  { label: "Daily Sandbox", url: "https://daily-cloudcode-pa.sandbox.googleapis.com" },
];

async function testEndpointModel(endpointUrl, item) {
  const payload = {
    project: effectiveProjectId,
    model: item.model,
    request: {
      contents: [
        {
          role: "user",
          parts: [{ text: "Respond with one word: HELLO" }],
        },
      ],
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: item.thinkingLevel,
          includeThoughts: true,
        },
      },
    },
  };

  const start = Date.now();
  try {
    const res = await fetch(`${endpointUrl}/v1internal:generateContent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "User-Agent": "antigravity/1.19.4 windows/amd64",
        "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
        "Client-Metadata": JSON.stringify({ ideType: "ANTIGRAVITY", platform: "WINDOWS", pluginType: "GEMINI" }),
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const text = data?.response?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join(" ") || "No text";
      return { success: true, status: res.status, elapsed, text: text.slice(0, 60).replace(/\n/g, " ") };
    } else {
      const errText = await res.text().catch(() => "");
      return { success: false, status: res.status, elapsed, error: errText.slice(0, 150).replace(/\n/g, " ") };
    }
  } catch (err) {
    return { success: false, status: 0, elapsed: Date.now() - start, error: err.message };
  }
}

console.log("\n🧪 Testing Antigravity Flash Endpoints (3.5 Flash, 3.6 Flash, 3.7 Flash)");
console.log("=========================================================================");

for (const ep of ENDPOINTS) {
  console.log(`\n📍 ${ep.label} (${ep.url})`);
  console.log("-".repeat(70));

  for (const item of FLASH_MODELS) {
    process.stdout.write(`  Testing ${item.name.padEnd(30)} [${item.model}] ... `);
    const res = await testEndpointModel(ep.url, item);
    if (res.success) {
      console.log(`✅ OK (${res.status}, ${res.elapsed}ms) -> "${res.text}"`);
    } else {
      console.log(`❌ FAIL (${res.status}, ${res.elapsed}ms) -> ${res.error}`);
    }
  }
}
console.log("\nDone.\n");
