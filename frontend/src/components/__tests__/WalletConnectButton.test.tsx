import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { WalletConnectButton } from "../WalletConnectButton";
import * as wagmi from "wagmi";

// Mock wagmi
vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
}));

// Mock RainbowKit
vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: any) => {
      const mockProps = {
        account: null,
        chain: null,
        openConnectModal: vi.fn(),
        openChainModal: vi.fn(),
        mounted: true,
      };
      return children(mockProps);
    },
  },
}));

describe("WalletConnectButton", () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Connect Wallet button when not connected", () => {
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    render(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("should call onSuccess when wallet connects", async () => {
    const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Start disconnected
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    const { rerender } = render(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Simulate wallet connection
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any);

    rerender(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAddress);
    });
  });

  it("should reset state when wallet disconnects", async () => {
    const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Start connected
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any);

    const { rerender } = render(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Disconnect
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    rerender(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Should show Connect Wallet button again
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("should not trigger login twice for same connection", async () => {
    const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Start disconnected
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    const { rerender } = render(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Connect wallet
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as any);

    rerender(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAddress);
    });

    // Clear mock to reset call count
    const callCount = mockOnSuccess.mock.calls.length;

    // Rerender with same connection (simulates React re-render)
    rerender(
      <WalletConnectButton onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Give it time - if it calls again incorrectly, we'll catch it
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should still be the same call count (not called again)
    expect(mockOnSuccess).toHaveBeenCalledTimes(callCount);
  });
});
