import mongoose, { Document } from "mongoose";
/**
 * API service types
 */
export declare enum ApiService {
    OPENAI = "openai",
    ZERION = "zerion",
    COINGECKO = "coingecko",
    DEFILLAMA = "defillama",
    AVALANCHE_RPC = "avalanche_rpc"
}
/**
 * API usage document interface
 */
export interface IApiUsage extends Document {
    walletAddress?: string;
    service: ApiService;
    endpoint: string;
    method: string;
    requestedAt: Date;
    responseStatus: number;
    responseTimeMs: number;
    tokensUsed?: number;
    costUsd?: number;
    error?: string;
    retries: number;
    metadata?: Record<string, any>;
}
/**
 * Export ApiUsage model
 */
export declare const ApiUsage: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=api-usage.schema.d.ts.map