# Removed Models & Endpoints Audit

This document records models and endpoints removed from `opencode-antigravity-auth-updated` following live verification against Google Antigravity and Cloud Code backend APIs.

---

## Removed Endpoints

| Endpoint | Reason & Status | Replacement |
| :--- | :--- | :--- |
| `https://autopush-cloudcode-pa.sandbox.googleapis.com` (`ANTIGRAVITY_ENDPOINT_AUTOPUSH`) | **HTTP 403 (License Error)**: Google returns `#3501: You do not have a valid license of this product` on all calls with standard Antigravity OAuth tokens. | Removed from `ANTIGRAVITY_ENDPOINT_FALLBACKS` and `ANTIGRAVITY_LOAD_ENDPOINTS`. Active fallback order is now: `daily-cloudcode-pa.sandbox.googleapis.com` → `cloudcode-pa.googleapis.com`. |

---

## Removed Models

The following models were removed from `OPENCODE_MODEL_DEFINITIONS` and active routing to eliminate dead entries, 404/500 errors, and bloated configuration:

| Model ID | Header Style | Status / Live Audit Result | Reason & Recommended Alternative |
| :--- | :--- | :--- | :--- |
| `antigravity-gemini-3-pro` | `antigravity` | **HTTP 500 (Unknown Error)** | Gemini 3.0 Pro base endpoints have been deprecated and removed on Google's backend. Use `antigravity-gemini-3.1-pro` instead. |
| `gemini-3-pro-preview` | `gemini-cli` | **HTTP 404 (Not Found)** | Not served on Cloud Code or Gemini CLI headers. Use `antigravity-gemini-3.1-pro`. |
| `gemini-3-flash-preview` | `gemini-cli` | **HTTP 404 (Not Found)** | Legacy preview model name. Use `antigravity-gemini-3-flash`. |
| `gemini-3.5-flash` | `gemini-cli` | **HTTP 404 (Not Found)** | Gemini 3.5 Flash requires Antigravity client metadata and backend routing (`gemini-3.5-flash-low` / `gemini-3-flash-agent`). Use `antigravity-gemini-3.5-flash`. |
| `gemini-3.6-flash` | `gemini-cli` | **HTTP 404 (Not Found)** | Gemini 3.6 Flash requires Antigravity client metadata and backend routing. Use `antigravity-gemini-3.6-flash`. |
| `gemini-3.7-flash` | `gemini-cli` | **HTTP 404 (Not Found)** | Gemini 3.7 Flash requires Antigravity client metadata and backend routing (`gemini-3.7-flash-tiered`). Use `antigravity-gemini-3.7-flash`. |
| `gemini-3.1-pro` | `gemini-cli` | **HTTP 404 (Not Found)** | Bare `gemini-3.1-pro` without Antigravity headers returns 404. Use `antigravity-gemini-3.1-pro`. |
| `gemini-3.1-pro-preview-customtools` | `gemini-cli` | **HTTP 404 (Not Found)** | Deprecated preview endpoint. Use `antigravity-gemini-3.1-pro`. |
| `gemini-2.5-pro` | `gemini-cli` / `antigravity` | **HTTP 503 (No Capacity)** | Persistent capacity exhaustion (`No capacity available for model gemini-2.5-pro on the server`). Use `antigravity-gemini-3.1-pro` or `antigravity-gemini-3.7-flash`. |

---

## Active & Verified Working Models

| Model ID | Available Thinking Tiers | Backend Target | Description |
| :--- | :--- | :--- | :--- |
| `antigravity-gemini-3.1-pro` | `low`, `high` | `gemini-3.1-pro-low` / `gemini-pro-agent` | Gemini 3.1 Pro flagship reasoning |
| `antigravity-gemini-3-flash` | `minimal`, `low`, `medium`, `high` | `gemini-3-flash` | Gemini 3 Flash fast reasoning |
| `antigravity-gemini-3.5-flash` | `minimal`, `low`, `medium`, `high` | `gemini-3.5-flash-low` / `gemini-3-flash-agent` | Gemini 3.5 Flash |
| `antigravity-gemini-3.6-flash` | `minimal`, `low`, `medium`, `high` | `gemini-3.6-flash-low` / `gemini-3.6-flash-medium` / `gemini-3.6-flash-high` | Gemini 3.6 Flash |
| `antigravity-gemini-3.7-flash` | `minimal`, `low`, `medium`, `high` | `gemini-3.7-flash-tiered` | Gemini 3.7 Flash |
| `antigravity-claude-sonnet-4-6` | — | `claude-sonnet-4-6` | Claude Sonnet 4.6 |
| `antigravity-claude-opus-4-6-thinking` | `low` (8k), `max` (32k) | `claude-opus-4-6-thinking` | Claude Opus 4.6 Extended Thinking |
| `gemini-2.5-flash` | — | `gemini-2.5-flash` | Gemini 2.5 Flash |
