/**
 * Network Switcher - Help users switch to Avalanche C-Chain
 */

"use client";

import { useSwitchChain, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import { avalanche } from "@/lib/blockchain/avalanche";
import { toast } from "sonner";

export function NetworkSwitcher() {
  const { switchChain, isPending } = useSwitchChain();
  const chainId = useChainId();

  // Don't show if already on Avalanche
  if (chainId === avalanche.id) {
    return null;
  }

  async function handleSwitchNetwork() {
    try {
      await switchChain({ chainId: avalanche.id });
      toast.success("Switched to Avalanche C-Chain");
    } catch (error) {
      console.error("Failed to switch network:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to switch network"
      );
    }
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangleIcon className="size-4" />
      <AlertTitle>Wrong Network</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          Please switch to Avalanche C-Chain to use this application.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchNetwork}
          disabled={isPending}
        >
          {isPending ? "Switching..." : "Switch Network"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

