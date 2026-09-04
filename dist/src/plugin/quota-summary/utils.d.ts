export declare function formatDuration(ms: number): string;
export declare function shortEmail(email: string): string;
export declare function progressBar(percent: number): string;
export declare function miniProgressBar(percent: number): string;
export declare function formatBucketLabel(bucket: {
    displayName?: string;
    bucketId?: string;
}): string;
export declare function extractProjectId(project: unknown): string | undefined;
export declare function delay(ms: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map