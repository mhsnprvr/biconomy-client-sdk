import { UserOperationStruct } from "@alchemy/aa-core";
import { Hex } from "viem";

export type Bundlerconfig = {
  bundlerUrl: string;
  entryPointAddress?: string;
  chainId: number;
  // eslint-disable-next-line no-unused-vars
  userOpReceiptIntervals?: { [key in number]?: number };
  userOpWaitForTxHashIntervals?: { [key in number]?: number };
  userOpReceiptMaxDurationIntervals?: { [key in number]?: number };
  userOpWaitForTxHashMaxDurationIntervals?: { [key in number]?: number };
};

export type UserOpReceipt = {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: number;
  paymaster: string;
  actualGasCost: Hex;
  actualGasUsed: Hex;
  success: "true" | "false";
  reason: string;
  logs: Array<any>; // The logs generated by this UserOperation (not including logs of other UserOperations in the same bundle)
  receipt: any; // TODO: define receipt type
};

// review
export type UserOpStatus = {
  state: string; // for now // could be an enum
  transactionHash?: string;
  userOperationReceipt?: UserOpReceipt;
};

export type SimulationType = "validation" | "validation_and_execution";

// Converted to JsonRpcResponse with strict type
export type GetUserOperationReceiptResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpReceipt;
  error?: JsonRpcError;
};

export type GetUserOperationStatusResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpStatus;
  error?: JsonRpcError;
};

// Converted to JsonRpcResponse with strict type
export type SendUserOpResponse = {
  jsonrpc: string;
  id: number;
  result: string;
  error?: JsonRpcError;
};

export type UserOpResponse = {
  userOpHash: string;
  wait(_confirmations?: number): Promise<UserOpReceipt>;
  // Review: waitForTxHash(): vs waitForTxHash?():
  waitForTxHash(): Promise<UserOpStatus>;
};

// Converted to JsonRpcResponse with strict type
export type EstimateUserOpGasResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpGasResponse;
  error?: JsonRpcError;
};

export type UserOpGasResponse = {
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

// Converted to JsonRpcResponse with strict type
export type GetUserOpByHashResponse = {
  jsonrpc: string;
  id: number;
  result: UserOpByHashResponse;
  error?: JsonRpcError;
};

export type UserOpByHashResponse = UserOperationStruct & {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  entryPoint: string;
};
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type JsonRpcError = {
  code: string;
  message: string;
  data: any;
};

export type GetGasFeeValuesResponse = {
  jsonrpc: string;
  id: number;
  result: GasFeeValues;
  error?: JsonRpcError;
};
export type GasFeeValues = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};
