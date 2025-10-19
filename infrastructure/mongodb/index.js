"use strict";
/**
 * MongoDB connection and model exports
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = exports.ApiService = exports.ApiUsage = exports.Insight = exports.PortfolioSnapshot = exports.User = void 0;
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
exports.getDatabaseStatus = getDatabaseStatus;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("@avax-ledger/config");
/**
 * MongoDB connection state
 */
let isConnected = false;
/**
 * Connect to MongoDB
 * Implements connection pooling and handles reconnection
 */
async function connectToDatabase() {
    if (isConnected) {
        return mongoose_1.default;
    }
    try {
        const options = {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4
        };
        await mongoose_1.default.connect(config_1.config.database.mongoUri, options);
        isConnected = true;
        console.log("✓ MongoDB connected successfully");
        // Handle connection events
        mongoose_1.default.connection.on("error", (error) => {
            console.error("MongoDB connection error:", error);
            isConnected = false;
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected");
            isConnected = false;
        });
        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose_1.default.connection.close();
            console.log("MongoDB connection closed through app termination");
            process.exit(0);
        });
        return mongoose_1.default;
    }
    catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        isConnected = false;
        throw error;
    }
}
/**
 * Disconnect from MongoDB
 */
async function disconnectFromDatabase() {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose_1.default.connection.close();
        isConnected = false;
        console.log("MongoDB connection closed");
    }
    catch (error) {
        console.error("Error closing MongoDB connection:", error);
        throw error;
    }
}
/**
 * Check if database is connected
 */
function isDatabaseConnected() {
    return isConnected && mongoose_1.default.connection.readyState === 1;
}
/**
 * Get database connection status
 */
function getDatabaseStatus() {
    return {
        connected: isConnected,
        readyState: mongoose_1.default.connection.readyState,
        host: mongoose_1.default.connection.host,
        name: mongoose_1.default.connection.name,
    };
}
/**
 * Re-export all models
 */
var user_schema_1 = require("./schemas/user.schema");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_schema_1.User; } });
var portfolio_snapshot_schema_1 = require("./schemas/portfolio-snapshot.schema");
Object.defineProperty(exports, "PortfolioSnapshot", { enumerable: true, get: function () { return portfolio_snapshot_schema_1.PortfolioSnapshot; } });
var insight_schema_1 = require("./schemas/insight.schema");
Object.defineProperty(exports, "Insight", { enumerable: true, get: function () { return insight_schema_1.Insight; } });
var api_usage_schema_1 = require("./schemas/api-usage.schema");
Object.defineProperty(exports, "ApiUsage", { enumerable: true, get: function () { return api_usage_schema_1.ApiUsage; } });
Object.defineProperty(exports, "ApiService", { enumerable: true, get: function () { return api_usage_schema_1.ApiService; } });
var session_schema_1 = require("./schemas/session.schema");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return session_schema_1.Session; } });
