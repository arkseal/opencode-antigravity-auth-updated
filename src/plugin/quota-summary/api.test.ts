import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  refreshAccessToken,
  loadCodeAssist,
  fetchAccountQuota,
  fetchUserQuotaSummary,
} from "./api";
import { GOOGLE_TOKEN_URL, CLOUDCODE_BASE_URL } from "./constants";

describe("Quota API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("refreshAccessToken", () => {
    it("should return access token on success", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "new-token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        ),
      );

      const token = await refreshAccessToken("refresh-token");
      expect(token).toBe("new-token");
      expect(global.fetch).toHaveBeenCalledWith(
        GOOGLE_TOKEN_URL,
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should throw error on failure", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Bad Request", { status: 400 }),
      );

      await expect(refreshAccessToken("bad-token")).rejects.toThrow("Token failed (400)");
    });
  });

  describe("loadCodeAssist", () => {
    it("should return project info on success", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ cloudaicompanionProject: { id: "test-project" } }),
          { status: 200 },
        ),
      );

      const result = await loadCodeAssist("access-token");
      expect(result.cloudaicompanionProject).toEqual({ id: "test-project" });
      expect(global.fetch).toHaveBeenCalledWith(
        `${CLOUDCODE_BASE_URL}/v1internal:loadCodeAssist`,
        expect.anything(),
      );
    });

    it("should throw error on failure", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Internal Server Error", { status: 500 }),
      );

      await expect(loadCodeAssist("token")).rejects.toThrow("loadCodeAssist failed (500)");
    });
  });

  describe("fetchUserQuotaSummary", () => {
    it("should return user quota summary info", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ groups: [] }), { status: 200 }),
      );

      const result = await fetchUserQuotaSummary("token", "project-id");
      expect(result.groups).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("retrieveUserQuotaSummary"),
        expect.objectContaining({
          body: JSON.stringify({ project: "project-id" }),
        }),
      );
    });

    it("should handle missing project id", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await fetchUserQuotaSummary("token");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("retrieveUserQuotaSummary"),
        expect.objectContaining({
          body: JSON.stringify({}),
        }),
      );
    });

    it("should throw error on failure", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response("Forbidden", { status: 403 }),
      );

      await expect(fetchUserQuotaSummary("token")).rejects.toThrow(
        "retrieveUserQuotaSummary failed (403)",
      );
    });
  });

  describe("fetchAccountQuota", () => {
    it("should return quota groups successfully", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: "mock-access-token" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ cloudaicompanionProject: "discovered-project" }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              groups: [
                {
                  displayName: "Chat Models Quota",
                  buckets: [
                    {
                      bucketId: "chat-bucket",
                      displayName: "Chat Limit",
                      window: "1d",
                      remainingFraction: 0.8,
                    },
                  ],
                },
              ],
            }),
            { status: 200 },
          ),
        );

      const account = {
        email: "test@example.com",
        refreshToken: "rt",
        rateLimitResetTimes: {},
      };

      const result = await fetchAccountQuota(account);

      expect(result.success).toBe(true);
      expect(result.email).toBe("test@example.com");
      expect(result.groups).toHaveLength(1);
      expect(result.groups?.[0]?.displayName).toBe("Chat Models Quota");
      expect(result.groups?.[0]?.buckets?.[0]?.remainingFraction).toBe(0.8);
    });

    it("should handle error during flow", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );

      const account = {
        email: "test@example.com",
        refreshToken: "rt",
        rateLimitResetTimes: {},
      };

      const result = await fetchAccountQuota(account);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Token failed (401)");
    });

    it("should use existing project id if provided", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: "mock-access-token" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ groups: [] }), { status: 200 }),
        );

      const account = {
        email: "test@example.com",
        refreshToken: "rt",
        projectId: "existing-project",
        rateLimitResetTimes: {},
      };

      await fetchAccountQuota(account);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("retrieveUserQuotaSummary"),
        expect.objectContaining({
          body: JSON.stringify({ project: "existing-project" }),
        }),
      );
    });
  });
});
