/**
 * POST /api/auth/verify
 * Verify SIWE signature and create session
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, Session, User } from "@/../../infrastructure/mongodb";
import { verifySiweSignature, createSessionData } from "@/lib/auth/siwe";
import { getSession } from "@/lib/auth/session";
import { Logger } from "@avax-ledger/utils";
import { VerifySignatureRequestSchema } from "@avax-ledger/types";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = VerifySignatureRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.errors[0].message,
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    const { message, signature, address } = validation.data;

    // Connect to database
    await connectToDatabase();

    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: ([^\n]+)/);
    if (!nonceMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid message format: nonce not found",
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    const nonce = nonceMatch[1];

    // Find session with nonce
    const sessionWithNonce = await Session.findByNonce(nonce);
    if (!sessionWithNonce) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired nonce",
            statusCode: 401,
          },
        },
        { status: 401 }
      );
    }

    // Verify signature
    const verificationResult = await verifySiweSignature({
      message,
      signature,
      nonce,
    });

    if (!verificationResult.success) {
      Logger.warn("Signature verification failed", {
        address,
        error: verificationResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: verificationResult.error || "Signature verification failed",
            statusCode: 401,
          },
        },
        { status: 401 }
      );
    }

    // Verify address matches
    if (
      verificationResult.address?.toLowerCase() !== address.toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Address mismatch",
            statusCode: 401,
          },
        },
        { status: 401 }
      );
    }

    // Create or update user
    let user = await User.findOne({
      walletAddress: address.toLowerCase(),
    });

    if (!user) {
      user = await User.create({
        walletAddress: address.toLowerCase(),
        preferences: {
          notifications: true,
          riskTolerance: "medium",
          theme: "system",
        },
        stats: {
          totalInsightsGenerated: 0,
          lastLoginAt: new Date(),
        },
      });
    } else {
      await user.updateLastLogin();
    }

    // Create session
    const sessionData = createSessionData(
      address,
      verificationResult.chainId || 43114
    );

    const session = await getSession();
    session.address = sessionData.address;
    session.chainId = sessionData.chainId;
    session.issuedAt = sessionData.issuedAt;
    session.expiresAt = sessionData.expiresAt;
    await session.save();

    // Store session in database
    const sessionId = randomBytes(32).toString("hex");
    await Session.create({
      sessionId,
      walletAddress: address.toLowerCase(),
      issuedAt: new Date(sessionData.issuedAt),
      expiresAt: new Date(sessionData.expiresAt),
      lastAccessedAt: new Date(),
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Clean up nonce session
    await sessionWithNonce.deleteOne();

    Logger.auth("login", address, {
      chainId: verificationResult.chainId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        user: {
          address: user.walletAddress,
          createdAt: user.createdAt.toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.error("Failed to verify signature", error as Error, {
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify signature",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

