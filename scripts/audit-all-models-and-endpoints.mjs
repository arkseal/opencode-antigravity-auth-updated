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

// 1. Refresh Token
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
  console.error("Token refresh failed:", tokenRes.status, await tokenRes.text())
  process.exit(1)
}

const { access_token } = await tokenRes.json()
console.log("Authenticated successfully. Project ID:", effectiveProjectId)

// 2. Audit Endpoints for core operations
const endpoints = [
  { name: "Daily Sandbox", url: "https://daily-cloudcode-pa.sandbox.googleapis.com" },
  { name: "Production", url: "https://cloudcode-pa.googleapis.com" },
]

console.log("\n==========================================")
console.log("1. AUDITING ROOT ENDPOINTS")
console.log("==========================================")

for (const ep of endpoints) {
  console.log(`\nTesting endpoint: ${ep.name} (${ep.url})`)

  // Test loadCodeAssist
  try {
    const res = await fetch(`${ep.url}/v1internal:loadCodeAssist`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "User-Agent": "google-api-nodejs-client/9.15.1",
        "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
        "Client-Metadata": JSON.stringify({ ideType: "ANTIGRAVITY", platform: "WINDOWS", pluginType: "GEMINI" }),
      },
      body: JSON.stringify({
        metadata: { ideType: "ANTIGRAVITY", platform: "WINDOWS", pluginType: "GEMINI" }
      }),
    })
    const body = await res.json().catch(() => ({}))
    console.log(`  loadCodeAssist: status=${res.status} ok=${res.ok} hasProject=${!!body.cloudaicompanionProject}`)
  } catch (err) {
    console.log(`  loadCodeAssist: error=${err.message}`)
  }

  // Test fetchAvailableModels
  try {
    const res = await fetch(`${ep.url}/v1internal:fetchAvailableModels`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "User-Agent": "antigravity/1.19.4 windows/amd64",
        "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
        "Client-Metadata": JSON.stringify({ ideType: "ANTIGRAVITY", platform: "WINDOWS", pluginType: "GEMINI" }),
      },
      body: JSON.stringify({ project: effectiveProjectId }),
    })
    const body = await res.json().catch(() => ({}))
    const count = Object.keys(body.models || {}).length
    console.log(`  fetchAvailableModels: status=${res.status} ok=${res.ok} modelCount=${count}`)
  } catch (err) {
    console.log(`  fetchAvailableModels: error=${err.message}`)
  }
}

// 3. Test every model defined in OPENCODE_MODEL_DEFINITIONS
const modelsToTest = [
  // Antigravity models (using Antigravity headers)
  { id: "antigravity-gemini-3.1-pro", style: "antigravity", variants: ["low", "high"] },
  { id: "antigravity-gemini-3-flash", style: "antigravity", variants: ["minimal", "low", "medium", "high"] },
  { id: "antigravity-gemini-3.5-flash", style: "antigravity", variants: ["minimal", "low", "medium", "high"] },
  { id: "antigravity-gemini-3.6-flash", style: "antigravity", variants: ["minimal", "low", "medium", "high"] },
  { id: "antigravity-gemini-3.7-flash", style: "antigravity", variants: ["minimal", "low", "medium", "high"] },
  { id: "antigravity-claude-sonnet-4-6", style: "antigravity", variants: [null] },
  { id: "antigravity-claude-opus-4-6-thinking", style: "antigravity", variants: ["low", "max"] },
  
  // Gemini CLI models (using Gemini CLI headers)
  { id: "gemini-2.5-flash", style: "gemini-cli", variants: [null] },
]

console.log("\n==========================================")
console.log("2. AUDITING ALL CONFIGURED MODELS")
console.log("==========================================")

// Dynamically import the compiled request transformer
const { prepareAntigravityRequest } = await import("../dist/src/plugin/request.js")

const results = []

for (const modelTest of modelsToTest) {
  for (const variant of modelTest.variants) {
    const fullModelName = variant ? `${modelTest.id}-${variant}` : modelTest.id
    const requestedUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fullModelName}:generateContent`
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: "Hello! Reply with 1 word." }]
        }
      ]
    }

    try {
      const prepared = prepareAntigravityRequest(
        requestedUrl,
        {
          method: "POST",
          body: JSON.stringify(requestBody)
        },
        access_token,
        effectiveProjectId,
        undefined,
        modelTest.style
      )

      const targetUrl = typeof prepared.request === "string" ? prepared.request : prepared.request.url

      // Test against the URL produced by prepareAntigravityRequest
      const res = await fetch(targetUrl, {
        method: prepared.init.method,
        headers: prepared.init.headers,
        body: prepared.init.body,
      })

      const text = await res.text()
      let parsed = null
      try { parsed = JSON.parse(text) } catch {}

      const success = res.ok && parsed && (parsed.candidates || parsed.response?.candidates)
      const errorMsg = !res.ok ? (parsed?.error?.message || text.slice(0, 150)) : (!success ? "Invalid response structure" : "")

      results.push({
        id: fullModelName,
        style: modelTest.style,
        targetUrl,
        effectiveModel: prepared.effectiveModel,
        status: res.status,
        success: !!success,
        error: errorMsg,
        sampleText: parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || parsed?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
      })

      const statusIcon = success ? "✅ PASS" : "❌ FAIL"
      console.log(`${statusIcon} [${modelTest.style}] ${fullModelName} -> effectiveModel=${prepared.effectiveModel} (status ${res.status})`)
      if (!success) {
        console.log(`     Error: ${errorMsg}`)
      } else {
        console.log(`     Response: "${results[results.length - 1].sampleText.slice(0, 50)}"`)
      }
    } catch (err) {
      console.log(`❌ EXCEPTION [${modelTest.style}] ${fullModelName}: ${err.message}`)
      results.push({
        id: fullModelName,
        style: modelTest.style,
        status: "EXCEPTION",
        success: false,
        error: err.message
      })
    }
  }
}

console.log("\n==========================================")
console.log("SUMMARY REPORT")
console.log("==========================================")
console.table(results.map(r => ({
  Model: r.id,
  HeaderStyle: r.style,
  EffectiveModel: r.effectiveModel,
  Status: r.status,
  Success: r.success ? "YES" : "NO",
  Error: r.error ? r.error.slice(0, 45) : ""
})))
