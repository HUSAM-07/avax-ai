/**
 * Sign-In with Ethereum (SIWE) authentication utilities
 */

import { SiweMessage } from "siwe";
import { randomBytes } from "crypto";
import { config } from "@avax-ledger/config";

/**
 * Generate cryptographically secure nonce
 */
export function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

/**
 * Generate SIWE message for signing
 */
export function generateSiweMessage(params: {
  address: string;
  chainId: number;
  nonce: string;
  domain: string;
  uri: string;
}): string {
  const { address, chainId, nonce, domain, uri } = params;

  const siweMessage = new SiweMessage({
    domain,
    address,
    statement: "Sign in to Avax Ledger with your wallet",
    uri,
    version: "1",
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
  });

  return siweMessage.prepareMessage();
}

/**
 * Verify SIWE signature
 */
export async function verifySiweSignature(params: {
  message: string;
  signature: string;
  nonce: string;
}): Promise<{
  success: boolean;
  address?: string;
  chainId?: number;
  error?: string;
}> {
  const { message, signature, nonce } = params;

  try {
    const siweMessage = new SiweMessage(message);

    // Verify nonce matches
    if (siweMessage.nonce !== nonce) {
      return {
        success: false,
        error: "Nonce mismatch",
      };
    }

    // Verify signature
    const { success, data, error } = await siweMessage.verify({ signature });

    if (!success || error) {
      return {
        success: false,
        error: error?.message || "Signature verification failed",
      };
    }

    // Check expiration
    if (data.expirationTime && new Date(data.expirationTime) < new Date()) {
      return {
        success: false,
        error: "Message expired",
      };
    }

    return {
      success: true,
      address: data.address,
      chainId: data.chainId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Session configuration
 */
export const sessionConfig = {
  cookieName: "avax_ledger_session",
  password: config.app.sessionSecret,
  cookieOptions: {
    secure: config.isProd,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  },
};

/**
 * Session data interface
 */
export interface SessionData {
  address: string;
  chainId: number;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Create session data
 */
export function createSessionData(address: string, chainId: number): SessionData {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + sessionConfig.cookieOptions.maxAge * 1000;

  return {
    address: address.toLowerCase(),
    chainId,
    issuedAt,
    expiresAt,
  };
}

/**
 * Validate session data
 */
export function validateSession(session: SessionData | null | undefined): boolean {
  if (!session) {
    return false;
  }

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    return false;
  }

  // Check if address is valid
  if (!/^0x[a-fA-F0-9]{40}$/.test(session.address)) {
    return false;
  }

  return true;
}

/**
 * Extract domain from request
 */
export function extractDomain(host: string): string {
  // Remove port if present
  return host.split(":")[0];
}

