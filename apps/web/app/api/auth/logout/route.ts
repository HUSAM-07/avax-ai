/**
 * POST /api/auth/logout
 * Logout and destroy session
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Logger } from "@avax-ledger/utils";
import { connectToDatabase, Session } from "@/../../infrastructure/mongodb";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getSession();

    const address = session.address;

    // Clear session
    session.destroy();

    // Delete sessions from database
    if (address) {
      await connectToDatabase();
      await Session.deleteForWallet(address);

      Logger.auth("logout", address, {
        duration: Date.now() - startTime,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.error("Failed to logout", error as Error, {
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to logout",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

