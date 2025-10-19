/**
 * Base HTTP client with retry logic and error handling
 */

import { Logger } from "@avax-ledger/utils";

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Simple in-memory cache
 */
class MemoryCache {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  set(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const cache = new MemoryCache();

/**
 * Base API client with retry and caching
 */
export class BaseApiClient {
  constructor(
    protected baseUrl: string,
    protected serviceName: string,
    protected apiKey?: string,
    protected retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {}

  /**
   * Generate cache key
   */
  protected getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params) : "";
    return `${this.serviceName}:${endpoint}:${paramsStr}`;
  }

  /**
   * Sleep utility for retry delays
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  protected getRetryDelay(attempt: number): number {
    const delay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Check if error is retryable
   */
  protected isRetryableError(error: any, statusCode?: number): boolean {
    // Retry on network errors
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      return true;
    }

    // Retry on 5xx server errors and 429 rate limit
    if (statusCode && (statusCode >= 500 || statusCode === 429)) {
      return true;
    }

    return false;
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheConfig?: CacheConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this.getCacheKey(endpoint, options.body as any);

    // Check cache first
    if (cacheConfig?.enabled) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        Logger.debug(`Cache hit for ${this.serviceName}: ${endpoint}`);
        return cached;
      }
    }

    // Add API key to headers if provided
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        const duration = Date.now() - startTime;

        // Log the request
        Logger.externalApi(
          this.serviceName,
          endpoint,
          duration,
          response.ok,
          {
            statusCode: response.status,
            attempt: attempt + 1,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();

          // Check if we should retry
          if (
            attempt < this.retryConfig.maxRetries &&
            this.isRetryableError(null, response.status)
          ) {
            const delay = this.getRetryDelay(attempt);
            Logger.warn(
              `Retrying ${this.serviceName} request after ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`,
              {
                endpoint,
                statusCode: response.status,
              }
            );
            await this.sleep(delay);
            continue;
          }

          throw new Error(
            `${this.serviceName} API error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const data = await response.json();

        // Cache successful response
        if (cacheConfig?.enabled) {
          cache.set(cacheKey, data, cacheConfig.ttlSeconds);
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (
          attempt < this.retryConfig.maxRetries &&
          this.isRetryableError(error)
        ) {
          const delay = this.getRetryDelay(attempt);
          Logger.warn(
            `Retrying ${this.serviceName} request after ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`,
            {
              endpoint,
              error: (error as Error).message,
            }
          );
          await this.sleep(delay);
          continue;
        }

        // Max retries exceeded
        break;
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    Logger.error(
      `${this.serviceName} request failed after ${this.retryConfig.maxRetries} retries`,
      lastError!,
      {
        endpoint,
        duration,
      }
    );

    throw lastError;
  }

  /**
   * GET request
   */
  protected async get<T>(
    endpoint: string,
    cacheConfig?: CacheConfig
  ): Promise<T> {
    return this.requestWithRetry<T>(
      endpoint,
      { method: "GET" },
      cacheConfig
    );
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string,
    body: any,
    cacheConfig?: CacheConfig
  ): Promise<T> {
    return this.requestWithRetry<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      cacheConfig
    );
  }
}

export default BaseApiClient;

