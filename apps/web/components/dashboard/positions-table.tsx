/**
 * Positions Table - Shows all DeFi positions
 */

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLinkIcon } from "lucide-react";

interface Position {
  protocol: string;
  type: string;
  totalValueUsd: number;
  tokens: Array<{
    symbol: string;
    amount: number;
  }>;
  apr?: number;
  apy?: number;
}

interface PositionsTableProps {
  positions?: Position[];
  isLoading?: boolean;
}

export function PositionsTable({
  positions = [],
  isLoading = false,
}: PositionsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>DeFi Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out wallet positions
  const defiPositions = positions.filter((p) => p.protocol !== "Wallet");

  if (defiPositions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>DeFi Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No DeFi positions found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getPositionTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "STAKED":
        return "default";
      case "LENDING":
        return "secondary";
      case "LIQUIDITY":
        return "outline";
      case "FARMING":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DeFi Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            Your active DeFi positions across protocols
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Protocol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">APR/APY</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defiPositions.map((position, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {position.protocol}
                </TableCell>
                <TableCell>
                  <Badge variant={getPositionTypeColor(position.type)}>
                    {position.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {position.tokens.slice(0, 3).map((token, i) => (
                      <span
                        key={i}
                        className="text-xs text-muted-foreground"
                      >
                        {token.symbol}
                        {i < Math.min(position.tokens.length - 1, 2) && ","}
                      </span>
                    ))}
                    {position.tokens.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{position.tokens.length - 3} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(position.totalValueUsd)}
                </TableCell>
                <TableCell className="text-right">
                  {position.apr ? (
                    <span className="text-sm text-green-500">
                      {position.apr.toFixed(2)}% APR
                    </span>
                  ) : position.apy ? (
                    <span className="text-sm text-green-500">
                      {position.apy.toFixed(2)}% APY
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
                    title="View on protocol"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

