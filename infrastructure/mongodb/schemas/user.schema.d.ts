import mongoose, { Document } from "mongoose";
/**
 * User preferences interface
 */
export interface IUserPreferences {
    notifications: boolean;
    riskTolerance: "low" | "medium" | "high";
    theme: "light" | "dark" | "system";
}
/**
 * User document interface
 */
export interface IUser extends Document {
    walletAddress: string;
    preferences: IUserPreferences;
    stats: {
        totalInsightsGenerated: number;
        lastLoginAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Export User model
 */
export declare const User: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=user.schema.d.ts.map