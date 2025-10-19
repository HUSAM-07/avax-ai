import mongoose, { Schema, Document } from "mongoose";

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
 * Session schema
 */
const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    nonce: {
      type: String,
      index: true,
    },
    nonceExpiresAt: {
      type: Date,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastAccessedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: false,
    collection: "sessions",
  }
);

/**
 * Indexes
 */
SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ walletAddress: 1, expiresAt: -1 });
SessionSchema.index({ nonce: 1 }, { sparse: true });

// TTL index: automatically delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Instance methods
 */
SessionSchema.methods.updateLastAccessed = function () {
  this.lastAccessedAt = new Date();
  return this.save();
};

SessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

SessionSchema.methods.isNonceValid = function () {
  return this.nonce && this.nonceExpiresAt && this.nonceExpiresAt > new Date();
};

/**
 * Static methods
 */
SessionSchema.statics.findBySessionId = function (sessionId: string) {
  return this.findOne({ sessionId, expiresAt: { $gt: new Date() } }).exec();
};

SessionSchema.statics.findByNonce = function (nonce: string) {
  return this.findOne({
    nonce,
    nonceExpiresAt: { $gt: new Date() },
  }).exec();
};

SessionSchema.statics.deleteExpiredSessions = function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } }).exec();
};

SessionSchema.statics.deleteForWallet = function (walletAddress: string) {
  return this.deleteMany({ walletAddress: walletAddress.toLowerCase() }).exec();
};

/**
 * Export Session model
 */
export const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

