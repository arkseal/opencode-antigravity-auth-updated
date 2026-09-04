import { jsx as _jsx, jsxs as _jsxs } from "@opentui/solid/jsx-runtime";
import { createSignal, For, Show, createRoot, onCleanup, onMount } from "solid-js";
import { existsSync, readFileSync } from "node:fs";
import { CONFIG_PATHS } from "./plugin/quota-summary/constants.js";
import { fetchAccountQuota } from "./plugin/quota-summary/api.js";
import { formatBucketLabel, formatDuration, miniProgressBar, shortEmail } from "./plugin/quota-summary/utils.js";
const TUI_PLUGIN_ID = "antigravity-quota.tui";
function getResetTimeString(bucket, now) {
    if (!bucket)
        return "Ready";
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
        if (loading())
            return;
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
            // Assign default emails if missing
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    };
    // Run on mount
    onMount(() => {
        updateQuota();
        const fetchInterval = setInterval(updateQuota, 5 * 60 * 1000); // every 5 minutes
        const tickInterval = setInterval(() => setNow(Date.now()), 10 * 1000); // tick countdown every 10 seconds
        onCleanup(() => {
            clearInterval(fetchInterval);
            clearInterval(tickInterval);
        });
    });
    return (_jsxs("box", { flexDirection: "column", paddingLeft: 1, paddingRight: 1, children: [_jsxs("box", { flexDirection: "row", children: [_jsx("text", { fg: props.theme.text, children: "\u2601\uFE0F Quota Status" }), _jsx("text", { fg: props.theme.textMuted, children: " " }), _jsx("text", { fg: loading() ? props.theme.textMuted : props.theme.accent, selectable: false, onMouseDown: updateQuota, children: loading() ? "[Updating...]" : "[Refresh]" })] }), _jsx(Show, { when: error(), children: _jsx("text", { fg: props.theme.error, children: `Error: ${error()}` }) }), _jsx(Show, { when: !loading() && quotaResults().length === 0 && !error(), children: _jsx("text", { fg: props.theme.textMuted, children: "No accounts configured." }) }), _jsx(For, { each: quotaResults(), children: (result) => {
                    const emailStr = shortEmail(result.email || "account");
                    return (_jsxs("box", { flexDirection: "column", marginTop: 1, children: [_jsx("text", { fg: props.theme.accent, children: emailStr }), _jsx(Show, { when: !result.success, children: _jsx("text", { fg: props.theme.error, children: ` ✕ ${result.error || "error"}` }) }), _jsx(Show, { when: result.success, children: _jsx(For, { each: result.groups || [], children: (group) => (_jsxs("box", { flexDirection: "column", paddingLeft: 1, marginTop: 1, children: [_jsx("text", { fg: props.theme.text, children: group.displayName }), _jsx("box", { flexDirection: "column", paddingLeft: 1, children: _jsx(For, { each: group.buckets || [], children: (bucket) => {
                                                        const percent = Math.round((bucket.remainingFraction ?? 0) * 100);
                                                        const resetStr = getResetTimeString(bucket, now());
                                                        const label = formatBucketLabel(bucket);
                                                        return (_jsx("text", { fg: props.theme.textMuted, children: `${label}: ${miniProgressBar(percent)} (${resetStr})` }));
                                                    } }) })] })) }) })] }));
                } })] }));
}
function initializeTui(api, _disposeRoot) {
    api.slots.register({
        order: 100,
        slots: {
            sidebar_content(ctx) {
                return _jsx(SidebarQuota, { api: api, theme: ctx.theme.current });
            },
        },
    });
}
const tui = async (api) => {
    createRoot((disposeRoot) => initializeTui(api, disposeRoot));
};
const plugin = {
    id: TUI_PLUGIN_ID,
    tui,
};
export default plugin;
//# sourceMappingURL=tui.js.map