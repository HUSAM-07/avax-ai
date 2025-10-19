/**
 * Structured logging utility using Winston
 * Provides consistent logging across the application
 */

import winston from "winston";
import { config } from "@avax-ledger/config";

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

/**
 * Custom log metadata interface
 */
export interface LogMetadata {
  requestId?: string;
  walletAddress?: string;
  userId?: string;
  service?: string;
  endpoint?: string;
  duration?: number;
  error?: Error | string;
  [key: string]: any;
}

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    config.isDev
      ? winston.format.combine(winston.format.colorize(), winston.format.simple())
      : winston.format.json()
  );

  return winston.createLogger({
    level: config.isDev ? "debug" : "info",
    format: logFormat,
    defaultMeta: {
      service: "avax-ledger",
      environment: config.env,
    },
    transports: [
      new winston.transports.Console({
        format: config.isDev
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const metaStr = Object.keys(meta).length
                  ? `\n${JSON.stringify(meta, null, 2)}`
                  : "";
                return `${timestamp} [${level}]: ${message}${metaStr}`;
              })
            )
          : winston.format.json(),
      }),
    ],
  });
};

/**
 * Logger instance
 */
const logger = createLogger();

/**
 * Logger utility class with convenience methods
 */
export class Logger {
  /**
   * Log informational message
   */
  static info(message: string, meta?: LogMetadata): void {
    logger.info(message, meta);
  }

  /**
   * Log warning message
   */
  static warn(message: string, meta?: LogMetadata): void {
    logger.warn(message, meta);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | string, meta?: LogMetadata): void {
    if (error instanceof Error) {
      logger.error(message, {
        ...meta,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      });
    } else if (typeof error === "string") {
      logger.error(message, { ...meta, error });
    } else {
      logger.error(message, meta);
    }
  }

  /**
   * Log debug message (development only)
   */
  static debug(message: string, meta?: LogMetadata): void {
    logger.debug(message, meta);
  }

  /**
   * Log API request
   */
  static apiRequest(
    method: string,
    url: string,
    meta?: Omit<LogMetadata, "endpoint">
  ): void {
    logger.info(`API Request: ${method} ${url}`, {
      ...meta,
      endpoint: url,
      method,
    });
  }

  /**
   * Log API response
   */
  static apiResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: Omit<LogMetadata, "endpoint" | "duration">
  ): void {
    const level = statusCode >= 400 ? "error" : statusCode >= 300 ? "warn" : "info";
    logger.log(level, `API Response: ${method} ${url} - ${statusCode}`, {
      ...meta,
      endpoint: url,
      method,
      statusCode,
      duration,
    });
  }

  /**
   * Log external API call
   */
  static externalApi(
    service: string,
    endpoint: string,
    duration: number,
    success: boolean,
    meta?: LogMetadata
  ): void {
    const message = `External API: ${service} - ${endpoint} ${success ? "✓" : "✗"}`;
    logger.info(message, {
      ...meta,
      service,
      endpoint,
      duration,
      success,
    });
  }

  /**
   * Log database operation
   */
  static database(
    operation: string,
    collection: string,
    duration: number,
    meta?: LogMetadata
  ): void {
    logger.debug(`DB Operation: ${operation} on ${collection}`, {
      ...meta,
      operation,
      collection,
      duration,
    });
  }

  /**
   * Log authentication event
   */
  static auth(
    event: "login" | "logout" | "verify" | "failed",
    walletAddress: string,
    meta?: Omit<LogMetadata, "walletAddress">
  ): void {
    logger.info(`Auth Event: ${event} - ${walletAddress}`, {
      ...meta,
      event,
      walletAddress,
    });
  }

  /**
   * Log insight generation
   */
  static insight(
    event: "start" | "complete" | "failed",
    type: string,
    walletAddress: string,
    meta?: LogMetadata
  ): void {
    const level = event === "failed" ? "error" : "info";
    logger.log(level, `Insight ${event}: ${type} for ${walletAddress}`, {
      ...meta,
      event,
      type,
      walletAddress,
    });
  }

  /**
   * Log cost/usage metrics
   */
  static cost(
    service: string,
    operation: string,
    cost: number,
    meta?: LogMetadata
  ): void {
    logger.info(`Cost: ${service} - ${operation} - $${cost.toFixed(4)}`, {
      ...meta,
      service,
      operation,
      cost,
    });
  }
}

/**
 * Create child logger with default metadata
 */
export function createChildLogger(defaultMeta: LogMetadata): typeof Logger {
  return {
    info: (message, meta) => Logger.info(message, { ...defaultMeta, ...meta }),
    warn: (message, meta) => Logger.warn(message, { ...defaultMeta, ...meta }),
    error: (message, error, meta) =>
      Logger.error(message, error, { ...defaultMeta, ...meta }),
    debug: (message, meta) => Logger.debug(message, { ...defaultMeta, ...meta }),
    apiRequest: (method, url, meta) =>
      Logger.apiRequest(method, url, { ...defaultMeta, ...meta }),
    apiResponse: (method, url, statusCode, duration, meta) =>
      Logger.apiResponse(method, url, statusCode, duration, {
        ...defaultMeta,
        ...meta,
      }),
    externalApi: (service, endpoint, duration, success, meta) =>
      Logger.externalApi(service, endpoint, duration, success, {
        ...defaultMeta,
        ...meta,
      }),
    database: (operation, collection, duration, meta) =>
      Logger.database(operation, collection, duration, { ...defaultMeta, ...meta }),
    auth: (event, walletAddress, meta) =>
      Logger.auth(event, walletAddress, { ...defaultMeta, ...meta }),
    insight: (event, type, walletAddress, meta) =>
      Logger.insight(event, type, walletAddress, { ...defaultMeta, ...meta }),
    cost: (service, operation, cost, meta) =>
      Logger.cost(service, operation, cost, { ...defaultMeta, ...meta }),
  };
}

export default Logger;

