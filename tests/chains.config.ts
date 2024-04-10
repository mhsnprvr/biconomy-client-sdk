import { localhost, Chain, polygonAmoy } from "viem/chains";
import { baseSepolia, optimism } from "viem/chains";
import { config } from "dotenv";

config();

export type SupportedTestChain = "ganache" | "baseSepolia" | "optimism" | "amoy";
type BaseChainConfig = {
  chainId: number;
  entryPointAddress: string;
  bundlerUrl: string;
  paymasterUrl?: string;
  viemChain: Chain;
  biconomyPaymasterApiKey?: string;
  deploymentCost: number;
  nftAddress: string;
};
export const CHAIN_CONFIG: Record<SupportedTestChain, BaseChainConfig> = {
  ganache: { // No useful bundler or paymaster tests for ganache
    chainId: 1337,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/1/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    viemChain: localhost,
    deploymentCost: 100000000000000000,
    nftAddress: "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e",
  },
  baseSepolia: {
    chainId: 84532,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/84532/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/84532/" + process.env.E2E_BICO_PAYMASTER_KEY_BASE!,
    viemChain: baseSepolia,
    biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_BASE!,
    deploymentCost: 100000000000000000,
    nftAddress: "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e",
  },
  optimism: {
    chainId: 10,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/10/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/10/" + process.env.E2E_BICO_PAYMASTER_KEY_OP!,
    viemChain: optimism,
    biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_OP!,
    deploymentCost: 100000000000000000,
    nftAddress: "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e",
  },
  amoy: {
    chainId: 80002,
    entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    bundlerUrl: "https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/80002/" + process.env.E2E_BICO_PAYMASTER_KEY_AMOY!,
    viemChain: polygonAmoy,
    biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_AMOY!,
    deploymentCost: 100000000000000000,
    nftAddress: "0x80047F96E43a97Aef76DcD7B4114ACbd25bB3432",
  }
};
export const E2E_TEST_CHAINS = [CHAIN_CONFIG.baseSepolia, CHAIN_CONFIG.optimism];
export const UNIT_TEST_CHAIN = CHAIN_CONFIG.ganache;

export default CHAIN_CONFIG;