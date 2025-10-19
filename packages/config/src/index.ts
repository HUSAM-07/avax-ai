import { z } from "zod";

/**
 * Environment variable schema with validation
 * Using Zod for runtime type safety and validation
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  MONGODB_URI: z.string().url("Invalid MongoDB URI"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),

  // Wallet Connect
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1, "WalletConnect Project ID is required"),

  // External API Keys
  ZERION_API_KEY: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),

  // Blockchain
  AVALANCHE_RPC_URL: z.string().url("Invalid Avalanche RPC URL"),
  NEXT_PUBLIC_AVALANCHE_CHAIN_ID: z.string().default("43114"),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL"),

  // Session
  SESSION_SECRET: z.string().min(32, "Session secret must be at least 32 characters"),

  // Optional: Redis
  REDIS_URL: z.string().url().optional(),

  // Optional: Sentry
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

/**
 * Parsed and validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      
      throw new Error(
        `Environment validation failed:\n${missingVars}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Validated environment configuration
 * Use this throughout the application instead of process.env
 */
export const env = validateEnv();

/**
 * Type-safe environment configuration object
 * Organized by domain for better developer experience
 */
export const config = {
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",

  database: {
    mongoUri: env.MONGODB_URI,
  },

  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
  },

  web3: {
    walletConnectProjectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    avalanche: {
      rpcUrl: env.AVALANCHE_RPC_URL,
      chainId: parseInt(env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID, 10),
    },
  },

  apis: {
    zerion: env.ZERION_API_KEY,
    coingecko: env.COINGECKO_API_KEY,
  },

  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    sessionSecret: env.SESSION_SECRET,
  },

  cache: {
    redisUrl: env.REDIS_URL,
  },

  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    publicSentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  },
} as const;

/**
 * Constants for the application
 */
export const constants = {
  // Avalanche C-Chain
  AVALANCHE_CHAIN_ID: 43114,
  AVALANCHE_CHAIN_NAME: "Avalanche C-Chain",
  AVALANCHE_NATIVE_CURRENCY: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },

  // API Rate Limits
  RATE_LIMITS: {
    INSIGHT_GENERATION: {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    PORTFOLIO_REFRESH: {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
    },
    API_DEFAULT: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // Cache TTLs (in seconds)
  CACHE_TTL: {
    PORTFOLIO: 300, // 5 minutes
    TOKEN_PRICE: 60, // 1 minute
    PROTOCOL_DATA: 600, // 10 minutes
    INSIGHT: 3600, // 1 hour
  },

  // OpenAI Configuration
  OPENAI: {
    MODEL: "gpt-4o-mini" as const,
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
  },

  // Insight Types
  INSIGHT_TYPES: {
    RISK_EXPOSURE: "RISK_EXPOSURE",
    REBALANCING: "REBALANCING",
    SENTIMENT_ALERT: "SENTIMENT_ALERT",
  } as const,

  // Database Collection Names
  COLLECTIONS: {
    USERS: "users",
    PORTFOLIO_SNAPSHOTS: "portfolio_snapshots",
    INSIGHTS: "insights",
    ALERTS: "alerts",
    API_USAGE: "api_usage",
    SESSIONS: "sessions",
  } as const,
} as const;

export default config;

