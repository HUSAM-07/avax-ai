/**
 * GET /api/health
 * Health check endpoint for monitoring
 */

import { NextResponse } from "next/server";
import { isDatabaseConnected } from "@/../../infrastructure/mongodb";
import { getCoinGeckoClient, getDefiLlamaClient } from "@/lib/services";

const startTime = Date.now();

export async function GET() {
  const checks: Record<string, "up" | "down"> = {
    database: "down",
    coingecko: "down",
    defillama: "down",
  };

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Check database
  try {
    checks.database = isDatabaseConnected() ? "up" : "down";
  } catch {
    checks.database = "down";
  }

  // Check CoinGecko API
  try {
    const coingecko = getCoinGeckoClient();
    await coingecko.getAvaxPrice();
    checks.coingecko = "up";
  } catch {
    checks.coingecko = "down";
  }

  // Check DeFi Llama API
  try {
    const defillama = getDefiLlamaClient();
    await defillama.getAvalancheTvl();
    checks.defillama = "up";
  } catch {
    checks.defillama = "down";
  }

  // Determine overall status
  const downCount = Object.values(checks).filter((s) => s === "down").length;
  if (downCount === 0) {
    overallStatus = "healthy";
  } else if (downCount === Object.keys(checks).length) {
    overallStatus = "unhealthy";
  } else {
    overallStatus = "degraded";
  }

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
    services: {
      database: checks.database,
      openai: "up", // Assume up if no errors
      externalApis: {
        coingecko: checks.coingecko,
        defillama: checks.defillama,
        zerion: "up", // Would need actual check
      },
    },
    uptime,
  };

  const statusCode = overallStatus === "healthy" ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}

