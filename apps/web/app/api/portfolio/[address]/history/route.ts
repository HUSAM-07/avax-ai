/**
 * GET /api/portfolio/[address]/history
 * Fetch historical portfolio snapshots
 */

import { NextRequest, NextResponse } from "next/server";
import {
  connectToDatabase,
  PortfolioSnapshot,
} from "@/../../infrastructure/mongodb";
import { Logger } from "@avax-ledger/utils";
import { ChainId, PaginationParamsSchema } from "@avax-ledger/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();
  const { address } = await params;

  try {
    const { searchParams } = new URL(request.url);

    // Validate pagination params
    const paginationValidation = PaginationParamsSchema.safeParse({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "30"),
      sortBy: searchParams.get("sort_by") || "timestamp",
      sortOrder: searchParams.get("sort_order") || "desc",
    });

    if (!paginationValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: paginationValidation.error.errors[0].message,
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    const { page, limit, sortOrder } = paginationValidation.data;

    // Parse date filters
    const startDate = searchParams.get("start_date")
      ? new Date(searchParams.get("start_date")!)
      : undefined;
    const endDate = searchParams.get("end_date")
      ? new Date(searchParams.get("end_date")!)
      : undefined;

    await connectToDatabase();

    // Build query
    const query: any = {
      walletAddress: address.toLowerCase(),
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    // Count total documents
    const total = await PortfolioSnapshot.countDocuments(query);

    // Fetch paginated results
    const skip = (page - 1) * limit;
    const snapshots = await PortfolioSnapshot.find(query)
      .sort({ timestamp: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .select("totalValueUsd tokenCount timestamp")
      .lean();

    const totalPages = Math.ceil(total / limit);

    const duration = Date.now() - startTime;

    Logger.apiResponse(
      "GET",
      `/api/portfolio/${address}/history`,
      200,
      duration,
      {
        walletAddress: address,
        page,
        total,
      }
    );

    return NextResponse.json({
      success: true,
      data: snapshots.map((s) => ({
        timestamp: s.timestamp,
        totalValueUsd: s.totalValueUsd,
        tokenCount: s.tokenCount,
        positionCount: (s as any).positions?.length || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    Logger.error("Failed to fetch portfolio history", error as Error, {
      walletAddress: address,
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch portfolio history",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

