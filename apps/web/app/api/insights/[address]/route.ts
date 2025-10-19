/**
 * GET /api/insights/[address]
 * Fetch insights for a wallet
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, Insight } from "@/../../infrastructure/mongodb";
import { Logger } from "@avax-ledger/utils";
import { InsightType, PaginationParamsSchema } from "@avax-ledger/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();
  const { address } = await params;

  try {
    const { searchParams } = new URL(request.url);

    // Validate pagination
    const paginationValidation = PaginationParamsSchema.safeParse({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
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

    const { page, limit } = paginationValidation.data;

    // Parse filters
    const type = searchParams.get("type") as InsightType | null;
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
      status: "COMPLETED",
      dismissedAt: null,
    };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Count total
    const total = await Insight.countDocuments(query);

    // Fetch insights
    const skip = (page - 1) * limit;
    const insights = await Insight.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    const duration = Date.now() - startTime;

    Logger.apiResponse("GET", `/api/insights/${address}`, 200, duration, {
      walletAddress: address,
      page,
      total,
    });

    return NextResponse.json({
      success: true,
      data: insights,
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

    Logger.error("Failed to fetch insights", error as Error, {
      walletAddress: address,
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch insights",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

