/**
 * Session management using iron-session
 */

import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionConfig, SessionData } from "./siwe";

/**
 * Get session from request
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionConfig);
}

/**
 * Get authenticated user from session
 */
export async function getAuthenticatedUser(): Promise<SessionData | null> {
  const session = await getSession();
  
  if (!session || !session.address) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt && session.expiresAt < Date.now()) {
    return null;
  }

  return {
    address: session.address,
    chainId: session.chainId,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
  };
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<SessionData> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

