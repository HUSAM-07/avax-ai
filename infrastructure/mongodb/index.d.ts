/**
 * MongoDB connection and model exports
 */
import mongoose from "mongoose";
/**
 * Connect to MongoDB
 * Implements connection pooling and handles reconnection
 */
export declare function connectToDatabase(): Promise<typeof mongoose>;
/**
 * Disconnect from MongoDB
 */
export declare function disconnectFromDatabase(): Promise<void>;
/**
 * Check if database is connected
 */
export declare function isDatabaseConnected(): boolean;
/**
 * Get database connection status
 */
export declare function getDatabaseStatus(): {
    connected: boolean;
    readyState: number;
    host?: string;
    name?: string;
};
/**
 * Re-export all models
 */
export { User } from "./schemas/user.schema";
export { PortfolioSnapshot } from "./schemas/portfolio-snapshot.schema";
export { Insight } from "./schemas/insight.schema";
export { ApiUsage, ApiService } from "./schemas/api-usage.schema";
export { Session } from "./schemas/session.schema";
/**
 * Re-export types
 */
export type { IUser, IUserPreferences } from "./schemas/user.schema";
export type { IPortfolioSnapshot } from "./schemas/portfolio-snapshot.schema";
export type { IInsight } from "./schemas/insight.schema";
export type { IApiUsage } from "./schemas/api-usage.schema";
export type { ISession } from "./schemas/session.schema";
//# sourceMappingURL=index.d.ts.map