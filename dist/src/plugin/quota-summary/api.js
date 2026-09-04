import { GOOGLE_TOKEN_URL, ANTIGRAVITY_CLIENT_ID, ANTIGRAVITY_CLIENT_SECRET, CLOUDCODE_BASE_URL, CLOUDCODE_METADATA, ANTIGRAVITY_ENDPOINTS, } from "./constants.js";
import { extractProjectId, delay } from "./utils.js";
export async function refreshAccessToken(refreshToken) {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: ANTIGRAVITY_CLIENT_ID,
            client_secret: ANTIGRAVITY_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });
    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Token failed (${response.status})${errorText ? `: ${errorText}` : ""}`);
    }
    const data = (await response.json());
    return data.access_token;
}
export async function loadCodeAssist(accessToken) {
    const response = await fetch(`${CLOUDCODE_BASE_URL}/v1internal:loadCodeAssist`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "antigravity/windows/amd64",
        },
        body: JSON.stringify({ metadata: CLOUDCODE_METADATA }),
    });
    if (!response.ok) {
        throw new Error(`loadCodeAssist failed (${response.status})`);
    }
    return (await response.json());
}
export async function fetchUserQuotaSummary(accessToken, projectId) {
    const endpoints = ANTIGRAVITY_ENDPOINTS;
    let lastError = null;
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${endpoint}/v1internal:retrieveUserQuotaSummary`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    "User-Agent": "antigravity/windows/amd64",
                },
                body: JSON.stringify(projectId ? { project: projectId } : {}),
            });
            if (!response.ok) {
                throw new Error(`retrieveUserQuotaSummary failed (${response.status})`);
            }
            return (await response.json());
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
        }
    }
    throw lastError || new Error("All endpoints failed");
}
export async function fetchAccountQuota(account) {
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
            success: true,
        };
    }
    catch (err) {
        return {
            email: account.email,
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
export async function fetchAllAccountsQuota(accounts) {
    const results = [];
    for (const account of accounts) {
        const res = await fetchAccountQuota(account);
        results.push(res);
        await delay(100);
    }
    return results;
}
//# sourceMappingURL=api.js.map