import { describe, it, expect } from "vitest";
import { formatQuotaReport } from "./formatter";
import type { AccountQuotaResult, StoredAccount } from "./types";

describe("Quota Formatter", () => {
  it("should handle empty results", () => {
    const output = formatQuotaReport([], []);
    expect(output).toBe("No quota information available.");
  });

  it("should format partial failures and errors cleanly", () => {
    const results: AccountQuotaResult[] = [
      {
        email: "success@test.com",
        success: true,
        groups: [
          {
            displayName: "Gemini Models",
            buckets: [
              {
                bucketId: "gemini-weekly",
                displayName: "Weekly Limit",
                window: "weekly",
                remainingFraction: 1.0,
                resetTime: new Date(Date.now() + 86400000).toISOString(),
              },
            ],
          },
        ],
      },
      {
        email: "fail@test.com",
        success: false,
        error: "Token failed (401)",
      },
    ];

    const accounts: StoredAccount[] = [
      { email: "success@test.com", refreshToken: "rt1" },
      { email: "fail@test.com", refreshToken: "fail_token" },
    ];

    const output = formatQuotaReport(results, accounts);
    expect(output).toContain("Errors: fail: Token failed (401)");
    expect(output).toContain("Weekly Limit        [██████████] 100%   Reset in");
    expect(output).toContain("Gemini Models");
  });

  it("should display local cache information", () => {
    const accounts: StoredAccount[] = [
      {
        email: "user@test.com",
        refreshToken: "rt",
        rateLimitResetTimes: {
          "gemini-antigravity:gemini-1.5-pro": Date.now() + 60000,
        },
      },
    ];

    const results: AccountQuotaResult[] = [
      {
        email: "user@test.com",
        success: true,
        groups: [
          {
            displayName: "Gemini Models",
            buckets: [
              {
                displayName: "Weekly Limit",
                remainingFraction: 1.0,
              },
            ],
          },
        ],
      },
    ];

    const output = formatQuotaReport(results, accounts);
    expect(output).toContain("## 💾 Local Cache");
    expect(output).toContain("### user");
    expect(output).toContain("gemini-1.5-pro");
    expect(output).toContain("WAIT");
    expect(output).toMatch(/\dm/);
  });

  it("should handle buckets with 'Limit Remaining' in displayName", () => {
    const results: AccountQuotaResult[] = [
      {
        email: "test@example.com",
        success: true,
        groups: [
          {
            displayName: "Gemini Models",
            buckets: [
              {
                bucketId: "gemini-weekly",
                displayName: "Weekly Limit Remaining",
                remainingFraction: 0.94,
                resetTime: new Date(Date.now() + 86400000).toISOString(),
              },
              {
                bucketId: "gemini-5h",
                displayName: "Five Hour Limit Remaining",
                remainingFraction: 1.0,
              },
            ],
          },
        ],
      },
    ];

    const accounts: StoredAccount[] = [
      { email: "test@example.com", refreshToken: "rt" },
    ];

    const output = formatQuotaReport(results, accounts);
    expect(output).toContain("Weekly Limit");
    expect(output).toContain("Five Hour Limit");
    expect(output).toContain("94%");
    expect(output).toContain("100%");
  });

  it("should correctly display partial quota percentage and reset duration", () => {
    const resetWeekly = new Date(Date.now() + 6 * 24 * 3600 * 1000 + 9 * 3600 * 1000).toISOString();
    const reset5h = new Date(Date.now() + 3 * 3600 * 1000 + 13 * 60 * 1000).toISOString();

    const results: AccountQuotaResult[] = [
      {
        email: "test@example.com",
        success: true,
        groups: [
          {
            displayName: "Gemini Models",
            buckets: [
              {
                bucketId: "gemini-weekly",
                displayName: "Weekly Limit",
                remainingFraction: 0.94,
                resetTime: resetWeekly,
              },
              {
                bucketId: "gemini-5h",
                displayName: "Five Hour Limit",
                remainingFraction: 0.64,
                resetTime: reset5h,
              },
            ],
          },
        ],
      },
    ];

    const accounts: StoredAccount[] = [
      { email: "test@example.com", refreshToken: "rt" },
    ];

    const output = formatQuotaReport(results, accounts);
    expect(output).toContain("94%");
    expect(output).toContain("64%");
    expect(output).toMatch(/6d \d+h/);
    expect(output).toMatch(/3h \d+m/);
  });
});
