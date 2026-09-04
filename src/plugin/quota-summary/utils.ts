export function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    const remainingHours = totalHours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (totalHours > 0) {
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}h ${remainingMinutes}m`;
  }
  return `${totalMinutes}m`;
}

export function shortEmail(email: string): string {
  const atIndex = email.indexOf("@");
  return atIndex === -1 ? email : email.slice(0, atIndex);
}

export function progressBar(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round(clamped / 10);
  return `[${"█".repeat(filled)}${"░".repeat(10 - filled)}] ${clamped}%`;
}

export function miniProgressBar(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  let filled = Math.round(clamped / 20);
  if (clamped > 0 && filled === 0) filled = 1;
  if (clamped < 100 && filled === 5) filled = 4;
  return `[${"█".repeat(filled)}${"░".repeat(5 - filled)}] ${clamped}%`;
}

export function formatBucketLabel(bucket: { displayName?: string; bucketId?: string }): string {
  const raw = bucket.displayName || bucket.bucketId || "";
  const cleaned = raw.replace(/\s+Limit(\s+Remaining)?$/i, "").trim();
  if (cleaned.toLowerCase() === "five hour") {
    return "5-Hour";
  }
  return cleaned;
}

export function extractProjectId(project: unknown): string | undefined {
  if (!project) return undefined;
  if (typeof project === "string") return project;
  if (typeof project === "object" && "id" in project && typeof (project as { id?: unknown }).id === "string") {
    return (project as { id: string }).id;
  }
  return undefined;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
