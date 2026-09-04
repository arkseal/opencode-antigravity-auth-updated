/** @jsxImportSource @opentui/solid */
import type { 
  TuiPlugin, 
  TuiPluginApi, 
  TuiPluginModule, 
  TuiSlotContext, 
  TuiThemeCurrent 
} from "@opencode-ai/plugin/tui";
import { createSignal, For, Show, createRoot, onCleanup, onMount } from "solid-js";
import { existsSync, readFileSync } from "node:fs";
import { CONFIG_PATHS } from "./plugin/quota-summary/constants";
import type { AccountQuotaResult, QuotaBucket, StoredAccount } from "./plugin/quota-summary/types";
import { fetchAccountQuota } from "./plugin/quota-summary/api";
import { formatBucketLabel, formatDuration, miniProgressBar, shortEmail } from "./plugin/quota-summary/utils";

const TUI_PLUGIN_ID = "antigravity-quota.tui";

function getResetTimeString(bucket: QuotaBucket | undefined, now: number): string {
  if (!bucket) return "Ready";
  const frac = bucket.remainingFraction ?? 0;
  const percent = Math.round(frac * 100);
  if (percent < 100 && bucket.resetTime) {
    const remainingMs = new Date(bucket.resetTime).getTime() - now;
    return remainingMs > 0 ? formatDuration(remainingMs) : "Ready";
  }
  return "Ready";
}

function SidebarQuota(props: {
  api: TuiPluginApi;
  theme: TuiThemeCurrent;
}) {
  const [quotaResults, setQuotaResults] = createSignal<AccountQuotaResult[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [now, setNow] = createSignal(Date.now());

  const updateQuota = async () => {
    if (loading()) return;
    setLoading(true);
    setError(null);
    try {
      let configPath: string | null = null;
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
      const data = JSON.parse(content) as { accounts?: StoredAccount[] };
      const accounts = data.accounts || [];

      // Assign default emails if missing
      accounts.forEach((acc, index) => {
        if (!acc.email) {
          acc.email = `account-${index + 1}`;
        }
      });

      const results: AccountQuotaResult[] = [];
      for (const acc of accounts) {
        results.push(await fetchAccountQuota(acc));
      }
      setQuotaResults(results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
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

  return (
    <box flexDirection="column" paddingLeft={1} paddingRight={1}>
      <box flexDirection="row">
        <text fg={props.theme.text}>☁️ Quota Status</text>
        <text fg={props.theme.textMuted}> </text>
        <text
          fg={loading() ? props.theme.textMuted : props.theme.accent}
          selectable={false}
          onMouseDown={updateQuota}
        >
          {loading() ? "[Updating...]" : "[Refresh]"}
        </text>
      </box>
      
      <Show when={error()}>
        <text fg={props.theme.error}>{`Error: ${error()}`}</text>
      </Show>

      <Show when={!loading() && quotaResults().length === 0 && !error()}>
        <text fg={props.theme.textMuted}>No accounts configured.</text>
      </Show>

      <For each={quotaResults()}>
        {(result) => {
          const emailStr = shortEmail(result.email || "account");

          return (
            <box flexDirection="column" marginTop={1}>
              <text fg={props.theme.accent}>{emailStr}</text>
              <Show when={!result.success}>
                <text fg={props.theme.error}>{` ✕ ${result.error || "error"}`}</text>
              </Show>
              <Show when={result.success}>
                <For each={result.groups || []}>
                  {(group) => (
                    <box flexDirection="column" paddingLeft={1} marginTop={1}>
                      <text fg={props.theme.text}>{group.displayName}</text>
                      <box flexDirection="column" paddingLeft={1}>
                        <For each={group.buckets || []}>
                          {(bucket) => {
                            const percent = Math.round((bucket.remainingFraction ?? 0) * 100);
                            const resetStr = getResetTimeString(bucket, now());
                            const label = formatBucketLabel(bucket);

                            return (
                              <text fg={props.theme.textMuted}>
                                {`${label}: ${miniProgressBar(percent)} (${resetStr})`}
                              </text>
                            );
                          }}
                        </For>
                      </box>
                    </box>
                  )}
                </For>
              </Show>
            </box>
          );
        }}
      </For>
    </box>
  );
}

function initializeTui(api: TuiPluginApi, _disposeRoot: () => void) {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(ctx: TuiSlotContext & { theme: { current: TuiThemeCurrent } }) {
        return <SidebarQuota api={api} theme={ctx.theme.current} />;
      },
    },
  });
}

const tui: TuiPlugin = async (api: TuiPluginApi) => {
  createRoot((disposeRoot) => initializeTui(api, disposeRoot));
};

const plugin: TuiPluginModule = {
  id: TUI_PLUGIN_ID,
  tui,
};

export default plugin;
