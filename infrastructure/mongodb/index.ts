/**
 * MongoDB connection and model exports
 */

import mongoose from "mongoose";
import { config } from "@avax-ledger/config";

/**
 * MongoDB connection state
 */
let isConnected = false;

/**
 * Connect to MongoDB
 * Implements connection pooling and handles reconnection
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    };

    await mongoose.connect(config.database.mongoUri, options);

    isConnected = true;
    console.log("✓ MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
      isConnected = false;
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });

    return mongoose;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    isConnected = false;
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get database connection status
 */
export function getDatabaseStatus(): {
  connected: boolean;
  readyState: number;
  host?: string;
  name?: string;
} {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

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

