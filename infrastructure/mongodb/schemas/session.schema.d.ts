import mongoose, { Document } from "mongoose";
/**
 * Session document interface for authentication
 */
export interface ISession extends Document {
    sessionId: string;
    walletAddress: string;
    nonce?: string;
    nonceExpiresAt?: Date;
    issuedAt: Date;
    expiresAt: Date;
    lastAccessedAt: Date;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Export Session model
 */
export declare const Session: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=session.schema.d.ts.map