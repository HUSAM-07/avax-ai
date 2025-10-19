/**
 * GET /api/auth/nonce
 * Generate a nonce for SIWE authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, Session } from "@/../../infrastructure/mongodb";
import { generateNonce } from "@/lib/auth/siwe";
import { Logger } from "@avax-ledger/utils";
import { GetNonceRequestSchema } from "@avax-ledger/types";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    // Validate input
    const validation = GetNonceRequestSchema.safeParse({ address });
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

    const { address: validatedAddress } = validation.data;

    // Connect to database
    await connectToDatabase();

    // Generate nonce
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store nonce in database
    await Session.create({
      sessionId: `nonce_${nonce}`,
      walletAddress: validatedAddress.toLowerCase(),
      nonce,
      nonceExpiresAt: expiresAt,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastAccessedAt: new Date(),
    });

    Logger.auth("verify", validatedAddress, {
      event: "nonce_generated",
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        nonce,
        expiresAt: expiresAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.error("Failed to generate nonce", error as Error, {
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate nonce",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

