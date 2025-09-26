import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { Button } from "./ui/button";

interface WalletConnectButtonProps {
  onSuccess: (address: string) => void;
  onError: (error: string) => void;
}

export function WalletConnectButton({
  onSuccess,
  onError,
}: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasTriggeredLogin, setHasTriggeredLogin] = useState(false);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasTriggeredLogin(false);
      setIsLoggingIn(false);
    }
  }, [isConnected]);

  // Auto-trigger login when wallet connects
  useEffect(() => {
    if (isConnected && address && !hasTriggeredLogin && !isLoggingIn) {
      setHasTriggeredLogin(true);
      setIsLoggingIn(true);

      // Auto-login with wallet address
      setTimeout(() => {
        try {
          onSuccess(address);
        } catch (error) {
          setIsLoggingIn(false);
          onError(error instanceof Error ? error.message : "Login failed");
        }
      }, 100);
    }
  }, [
    isConnected,
    address,
    hasTriggeredLogin,
    isLoggingIn,
    onSuccess,
    onError,
  ]);

  return (
    <div className="w-full">
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, openChainModal, mounted }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button
                      onClick={openConnectModal}
                      type="button"
                      variant="outline"
                      className="w-full gap-3"
                      size="lg"
                    >
                      <Wallet size={16} />
                      Connect Wallet
                    </Button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <Button
                      onClick={openChainModal}
                      type="button"
                      variant="destructive"
                      className="w-full gap-3"
                      size="lg"
                    >
                      Wrong network
                    </Button>
                  );
                }

                // Show logging in state
                if (isLoggingIn) {
                  return (
                    <Button
                      disabled
                      type="button"
                      className="w-full gap-3 opacity-75 cursor-not-allowed"
                      size="lg"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Logging in...
                    </Button>
                  );
                }

                // Connected and logged in - shouldn't normally see this
                return (
                  <Button
                    disabled
                    type="button"
                    className="w-full gap-3 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    ✓ Connected as {account.displayName}
                  </Button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
