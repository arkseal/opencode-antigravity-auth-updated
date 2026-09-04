import type { AccountQuotaResult, StoredAccount } from "./types";
import { shortEmail, progressBar, formatDuration } from "./utils";

export function formatQuotaReport(
  results: AccountQuotaResult[],
  accounts: StoredAccount[],
): string {
  const parts: string[] = [];

  // Collect errors
  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    const errorList = failed
      .map((f, i) => `${f.email ? shortEmail(f.email) : `account-${i + 1}`}: ${f.error}`)
      .join(", ");
    parts.push(`Errors: ${errorList}`);
    parts.push("");
  }

  // Collect all successful groups across accounts
  const successful = results.filter((r) => r.success && r.groups && r.groups.length > 0);

  if (successful.length === 0) {
    parts.push("No quota information available.");
  } else {
    parts.push("## ☁️ Quota Status");
    parts.push("");

    // Find all unique group names across all accounts
    const groupNames = new Set<string>();
    for (const r of successful) {
      for (const g of r.groups || []) {
        if (g.displayName) groupNames.add(g.displayName);
      }
    }

    for (const groupName of groupNames) {
      parts.push(`### ${groupName}`);
      parts.push("");

      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        if (!acc) continue;
        const res = results[i];
        const name = acc.email ? shortEmail(acc.email) : `Account ${i + 1}`;

        if (!res || !res.success) {
          parts.push(`- **${name}**: Failed to load quota`);
          continue;
        }

        const group = res.groups?.find((g) => g.displayName === groupName);
        if (!group || !group.buckets || group.buckets.length === 0) {
          continue;
        }

        parts.push(`- **${name}**:`);
        for (const b of group.buckets) {
          const label =
            (b.displayName || b.bucketId || "Limit")
              .replace(/\s+Limit(\s+Remaining)?$/i, "")
              .trim() + " Limit";
          const frac = b.remainingFraction ?? 0;
          const pct = Math.round(frac * 100);
          const bar = progressBar(pct);

          let resetInfo = "Ready";
          if (b.resetTime) {
            const diff = new Date(b.resetTime).getTime() - Date.now();
            if (diff > 0) {
              resetInfo = `Reset in ${formatDuration(diff)}`;
            }
          }

          parts.push(`  - \`${label.padEnd(19)} ${bar}   ${resetInfo}\``);
        }
      }
      parts.push("");
    }
  }

  // Local Cache Status
  const now = Date.now();
  const accountsWithCache = accounts.filter(
    (a) => a.rateLimitResetTimes && Object.keys(a.rateLimitResetTimes).length > 0,
  );

  if (accountsWithCache.length > 0) {
    parts.push("## 💾 Local Cache");
    parts.push("");

    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      if (!a) continue;
      const name = a.email ? shortEmail(a.email) : `Account ${i + 1}`;
      const cacheEntries = Object.entries(a.rateLimitResetTimes || {});

      if (cacheEntries.length === 0) continue;

      parts.push(`### ${name}`);
      parts.push("");
      parts.push("| Model | Status | Wait Time | Reset Time |");
      parts.push("| :--- | :--- | :--- | :--- |");

      for (const [model, resetAt] of cacheEntries) {
        const diff = resetAt - now;
        const isRateLimited = diff > 0;
        const status = isRateLimited ? "🔴 WAIT" : "🟢 READY";
        const wait = isRateLimited ? formatDuration(diff) : "Ready";
        const resetFormatted = isRateLimited ? new Date(resetAt).toLocaleTimeString() : "-";
        parts.push(`| \`${model}\` | ${status} | ${wait} | ${resetFormatted} |`);
      }
      parts.push("");
    }
  }

  return parts.join("\n").trim();
}
