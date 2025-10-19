"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Session schema
 */
const SessionSchema = new mongoose_1.Schema({
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
}, {
    timestamps: false,
    collection: "sessions",
});
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
SessionSchema.statics.findBySessionId = function (sessionId) {
    return this.findOne({ sessionId, expiresAt: { $gt: new Date() } }).exec();
};
SessionSchema.statics.findByNonce = function (nonce) {
    return this.findOne({
        nonce,
        nonceExpiresAt: { $gt: new Date() },
    }).exec();
};
SessionSchema.statics.deleteExpiredSessions = function () {
    return this.deleteMany({ expiresAt: { $lt: new Date() } }).exec();
};
SessionSchema.statics.deleteForWallet = function (walletAddress) {
    return this.deleteMany({ walletAddress: walletAddress.toLowerCase() }).exec();
};
/**
 * Export Session model
 */
exports.Session = mongoose_1.default.models.Session || mongoose_1.default.model("Session", SessionSchema);
