import mongoose, { Schema, Document } from "mongoose";

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
 * User schema definition
 */
const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Ethereum address!`,
      },
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      riskTolerance: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
    },
    stats: {
      totalInsightsGenerated: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastLoginAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

/**
 * Indexes for optimal query performance
 */
UserSchema.index({ walletAddress: 1 }, { unique: true });
UserSchema.index({ "stats.lastLoginAt": -1 });
UserSchema.index({ createdAt: -1 });

/**
 * Instance methods
 */
UserSchema.methods.updateLastLogin = function () {
  this.stats.lastLoginAt = new Date();
  return this.save();
};

UserSchema.methods.incrementInsightCount = function () {
  this.stats.totalInsightsGenerated += 1;
  return this.save();
};

/**
 * Export User model
 */
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

