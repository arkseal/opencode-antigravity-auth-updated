import { describe, it, expect } from "vitest";
import { 
  formatDuration, 
  shortEmail, 
  progressBar, 
  miniProgressBar, 
  formatBucketLabel, 
  extractProjectId 
} from "./utils";

describe("Utils", () => {
  describe("formatDuration", () => {
    it("should format minutes correctly", () => {
      expect(formatDuration(60 * 1000)).toBe("1m");
      expect(formatDuration(59 * 60 * 1000)).toBe("59m");
    });

    it("should format hours and minutes correctly", () => {
      expect(formatDuration(60 * 60 * 1000)).toBe("1h 0m");
      expect(formatDuration(90 * 60 * 1000)).toBe("1h 30m");
    });

    it("should format days and hours correctly", () => {
      expect(formatDuration(24 * 60 * 60 * 1000)).toBe("1d 0h");
      expect(formatDuration(25 * 60 * 60 * 1000)).toBe("1d 1h");
    });

    it("should handle negative inputs by taking absolute value", () => {
      expect(formatDuration(-60 * 1000)).toBe("1m");
    });
  });

  describe("shortEmail", () => {
    it("should extract username from email", () => {
      expect(shortEmail("user@example.com")).toBe("user");
      expect(shortEmail("john.doe@gmail.com")).toBe("john.doe");
    });

    it("should return full string if no @ present", () => {
      expect(shortEmail("localuser")).toBe("localuser");
    });
  });

  describe("progressBar", () => {
    it("should render 0%", () => {
      expect(progressBar(0)).toBe("[░░░░░░░░░░] 0%");
    });

    it("should render 50%", () => {
      expect(progressBar(50)).toBe("[█████░░░░░] 50%");
    });

    it("should render 100%", () => {
      expect(progressBar(100)).toBe("[██████████] 100%");
    });

    it("should round to nearest block", () => {
      expect(progressBar(14)).toBe("[█░░░░░░░░░] 14%");
      expect(progressBar(16)).toBe("[██░░░░░░░░] 16%");
    });
  });

  describe("miniProgressBar", () => {
    it("should render 0%", () => {
      expect(miniProgressBar(0)).toBe("[░░░░░] 0%");
    });

    it("should render 50%", () => {
      expect(miniProgressBar(50)).toBe("[███░░] 50%");
    });

    it("should render 100%", () => {
      expect(miniProgressBar(100)).toBe("[█████] 100%");
    });

    it("should not show 5 full blocks for partial quota below 100%", () => {
      expect(miniProgressBar(94)).toBe("[████░] 94%");
      expect(miniProgressBar(99)).toBe("[████░] 99%");
    });

    it("should show at least 1 block for small positive quota", () => {
      expect(miniProgressBar(1)).toBe("[█░░░░] 1%");
    });
  });

  describe("formatBucketLabel", () => {
    it("should format Weekly Limit Remaining as Weekly", () => {
      expect(formatBucketLabel({ displayName: "Weekly Limit Remaining", bucketId: "gemini-weekly" })).toBe("Weekly");
    });

    it("should format Five Hour Limit Remaining as 5-Hour", () => {
      expect(formatBucketLabel({ displayName: "Five Hour Limit Remaining", bucketId: "gemini-5h" })).toBe("5-Hour");
    });

    it("should format Weekly Limit as Weekly", () => {
      expect(formatBucketLabel({ displayName: "Weekly Limit", bucketId: "3p-weekly" })).toBe("Weekly");
    });

    it("should format Five Hour Limit as 5-Hour", () => {
      expect(formatBucketLabel({ displayName: "Five Hour Limit", bucketId: "3p-5h" })).toBe("5-Hour");
    });

    it("should format generic limit suffixes cleanly", () => {
      expect(formatBucketLabel({ displayName: "Chat Limit Remaining" })).toBe("Chat");
      expect(formatBucketLabel({ displayName: "Code Limit" })).toBe("Code");
    });
  });

  describe("extractProjectId", () => {
    it("should return string input as is", () => {
      expect(extractProjectId("my-project")).toBe("my-project");
    });

    it("should extract id from object", () => {
      expect(extractProjectId({ id: "obj-project" })).toBe("obj-project");
    });

    it("should return undefined for invalid inputs", () => {
      expect(extractProjectId(null)).toBeUndefined();
      expect(extractProjectId({})).toBeUndefined();
      expect(extractProjectId(123)).toBeUndefined();
    });
  });
});
