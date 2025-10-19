/**
 * GET /api/auth/session
 * Get current session information
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { Logger } from "@avax-ledger/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        address: user.address,
        chainId: user.chainId,
        expiresAt: new Date(user.expiresAt).toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.error("Failed to get session", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get session",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

