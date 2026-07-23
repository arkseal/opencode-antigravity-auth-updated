import type { PluginClient } from "./types";
import type { AccountMetadataV3 } from "./storage";
import type { AccountManager } from "./accounts";
export type QuotaGroup = "claude" | "gemini-pro" | "gemini-flash";
export interface QuotaGroupSummary {
    remainingFraction?: number;
    resetTime?: string;
    modelCount: number;
}
export interface QuotaSummary {
    groups: Partial<Record<QuotaGroup, QuotaGroupSummary>>;
    modelCount: number;
    error?: string;
}
export interface GeminiCliQuotaModel {
    modelId: string;
    remainingFraction: number;
    resetTime?: string;
}
export interface GeminiCliQuotaSummary {
    models: GeminiCliQuotaModel[];
    error?: string;
}
export type AccountQuotaStatus = "ok" | "disabled" | "error";
export interface AccountQuotaResult {
    index: number;
    email?: string;
    refreshToken?: string;
    status: AccountQuotaStatus;
    error?: string;
    disabled?: boolean;
    quota?: QuotaSummary;
    geminiCliQuota?: GeminiCliQuotaSummary;
    updatedAccount?: AccountMetadataV3;
}
export interface FetchAvailableModelsResponse {
    models?: Record<string, FetchAvailableModelEntry>;
}
export interface FetchAvailableModelEntry {
    quotaInfo?: {
        remainingFraction?: number;
        resetTime?: string;
    };
    displayName?: string;
    modelName?: string;
}
declare function aggregateQuota(models?: Record<string, FetchAvailableModelEntry>): QuotaSummary;
export declare function fetchAvailableModels(accessToken: string, projectId: string): Promise<FetchAvailableModelsResponse>;
export declare function checkAccountsQuota(accounts: AccountMetadataV3[], client: PluginClient, providerId?: string): Promise<AccountQuotaResult[]>;
/**
 * Proactively refreshes quotas for all accounts in the background.
 * Updates the account manager with new quota data.
 */
export declare function triggerAsyncQuotaRefreshForAll(accountManager: AccountManager, client: PluginClient, providerId: string): Promise<void>;
export declare const __testExports: {
    aggregateQuota: typeof aggregateQuota;
};
export {};
//# sourceMappingURL=quota.d.ts.map