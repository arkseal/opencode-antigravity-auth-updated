export interface QuotaBucket {
    bucketId?: string;
    displayName?: string;
    window?: string;
    remainingFraction?: number;
    resetTime?: string;
}
export interface QuotaGroup {
    displayName?: string;
    buckets?: QuotaBucket[];
}
export interface RetrieveUserQuotaSummaryResponse {
    groups?: QuotaGroup[];
}
export interface AccountQuotaResult {
    email?: string;
    groups?: QuotaGroup[];
    success: boolean;
    error?: string;
}
export interface StoredAccount {
    email?: string;
    refreshToken?: string;
    projectId?: string;
    rateLimitResetTimes?: Record<string, number>;
    lastUsed?: number;
    enabled?: boolean;
}
//# sourceMappingURL=types.d.ts.map