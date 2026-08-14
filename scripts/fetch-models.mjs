import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
const CLIENT_SECRET = "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"

const accountsPath = join(homedir(), ".config", "opencode", "antigravity-accounts.json")
const raw = JSON.parse(readFileSync(accountsPath, "utf-8"))
const account = raw.accounts?.[0]
if (!account?.refreshToken) {
  console.error("No account or refreshToken found in", accountsPath)
  process.exit(1)
}

const refreshToken = account.refreshToken
const effectiveProjectId = account.managedProjectId || account.projectId
if (!effectiveProjectId) {
  console.error("No projectId found in account")
  process.exit(1)
}

// Step 1: Exchange refresh token for access token
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
})

if (!tokenRes.ok) {
  const err = await tokenRes.text()
  console.error("Token refresh failed:", tokenRes.status, err)
  process.exit(1)
}

const { access_token } = await tokenRes.json()
console.log("Got access token:", access_token.slice(0, 20) + "...")

// Step 2: Call fetchAvailableModels on both endpoints
for (const endpoint of [
  "https://cloudcode-pa.googleapis.com",
  "https://daily-cloudcode-pa.sandbox.googleapis.com",
]) {
  console.log(`\n--- ${endpoint} ---`)
  const res = await fetch(`${endpoint}/v1internal:fetchAvailableModels`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      "User-Agent": "antigravity/1.15.8 windows/amd64",
      "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
      "Client-Metadata": JSON.stringify({ ideType: "ANTIGRAVITY", platform: "WINDOWS", pluginType: "GEMINI" }),
    },
    body: JSON.stringify({ project: effectiveProjectId }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Failed:", res.status, err.slice(0, 300))
    continue
  }

  const data = await res.json()
  const models = data.models ?? {}
  const keys = Object.keys(models)
  console.log(`Found ${keys.length} models:`)
  for (const key of keys) {
    const m = models[key]
    console.log(`  ${key} -> modelName=${m.modelName ?? "(none)"} display=${m.displayName ?? "(none)"}`)
  }
}
