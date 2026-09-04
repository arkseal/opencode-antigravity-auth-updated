import type { RetrieveUserQuotaSummaryResponse, AccountQuotaResult, StoredAccount } from "./types";
export declare function refreshAccessToken(refreshToken: string): Promise<string>;
export declare function loadCodeAssist(accessToken: string): Promise<{
    cloudaicompanionProject?: {
        id?: string;
    } | string;
}>;
export declare function fetchUserQuotaSummary(accessToken: string, projectId?: string): Promise<RetrieveUserQuotaSummaryResponse>;
export declare function fetchAccountQuota(account: StoredAccount): Promise<AccountQuotaResult>;
export declare function fetchAllAccountsQuota(accounts: StoredAccount[]): Promise<AccountQuotaResult[]>;
//# sourceMappingURL=api.d.ts.map