import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Sailor Swift",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: false,
});
