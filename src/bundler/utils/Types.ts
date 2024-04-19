import type { Chain, Hex } from "viem"
import type { UserOperationStruct } from "../../account"

export type Bundlerconfig = {
  bundlerUrl: string
  entryPointAddress?: string
  chainId?: number
  // eslint-disable-next-line no-unused-vars
  userOpReceiptIntervals?: { [key in number]?: number }
  userOpWaitForTxHashIntervals?: { [key in number]?: number }
  userOpReceiptMaxDurationIntervals?: { [key in number]?: number }
  userOpWaitForTxHashMaxDurationIntervals?: { [key in number]?: number }
  /** Can be used to optionally override the chain with a custom chain if it doesn't already exist in viems list of supported chains */
  viemChain?: Chain
}
export type BundlerConfigWithChainId = Bundlerconfig & { chainId: number }

export type UserOpReceipt = {
  /* The request hash of the UserOperation. */
  userOpHash: string
  /* The entry point address used for the UserOperation. */
  entryPoint: string
  /* The paymaster used for this UserOperation (or empty). */
  paymaster: string
  /* The actual amount paid (by account or paymaster) for this UserOperation. */
  actualGasCost: Hex
  /* The total gas used by this UserOperation (including preVerification, creation, validation, and execution). */
  actualGasUsed: Hex
  /* Indicates whether the execution completed without reverting. */
  success: "true" | "false"
  /* In case of revert, this is the revert reason. */
  reason: string
  /* The logs generated by this UserOperation (not including logs of other UserOperations in the same bundle). */
  logs: Array<any> // The logs generated by this UserOperation (not including logs of other UserOperations in the same bundle)
  /* The TransactionReceipt object for the entire bundle, not only for this UserOperation. */
  receipt: any
}

// review
export type UserOpStatus = {
  state: string // for now // could be an enum
  transactionHash?: string
  userOperationReceipt?: UserOpReceipt
}

// Converted to JsonRpcResponse with strict type
export type GetUserOperationReceiptResponse = {
  jsonrpc: string
  id: number
  result: UserOpReceipt
  error?: JsonRpcError
}

export type GetUserOperationStatusResponse = {
  jsonrpc: string
  id: number
  result: UserOpStatus
  error?: JsonRpcError
}

// Converted to JsonRpcResponse with strict type
export type SendUserOpResponse = {
  jsonrpc: string
  id: number
  result: string
  error?: JsonRpcError
}

export type UserOpResponse = {
  userOpHash: string
  wait(_confirmations?: number): Promise<UserOpReceipt>
  // Review: waitForTxHash(): vs waitForTxHash?():
  waitForTxHash(): Promise<UserOpStatus>
}

// Converted to JsonRpcResponse with strict type
export type EstimateUserOpGasResponse = {
  jsonrpc: string
  id: number
  result: UserOpGasResponse
  error?: JsonRpcError
}

export type UserOpGasResponse = {
  preVerificationGas: string
  verificationGasLimit: string
  callGasLimit: string
  maxPriorityFeePerGas: string
  maxFeePerGas: string
}

// Converted to JsonRpcResponse with strict type
export type GetUserOpByHashResponse = {
  jsonrpc: string
  id: number
  result: UserOpByHashResponse
  error?: JsonRpcError
}

export type UserOpByHashResponse = UserOperationStruct & {
  transactionHash: string
  blockNumber: number
  blockHash: string
  entryPoint: string
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcError = {
  code: string
  message: string
  data: any
}

export type GetGasFeeValuesResponse = {
  jsonrpc: string
  id: number
  result: GasFeeValues
  error?: JsonRpcError
}
export type GasFeeValues = {
  maxPriorityFeePerGas: string
  maxFeePerGas: string
}