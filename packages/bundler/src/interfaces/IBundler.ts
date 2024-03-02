import { StateOverrideSet } from "@biconomy-devx/common";
import { UserOpResponse, UserOpGasResponse, UserOpReceipt, UserOpByHashResponse, UserOpStatus, SimulationType, GasFeeValues } from "../utils/Types";
import { UserOperationStruct } from "@alchemy/aa-core";

export interface IBundler {
  estimateUserOpGas(_userOp: Partial<UserOperationStruct>, stateOverrideSet?: StateOverrideSet): Promise<UserOpGasResponse>;
  sendUserOp(_userOp: UserOperationStruct, _simulationType?: SimulationType): Promise<UserOpResponse>;
  getUserOpReceipt(_userOpHash: string): Promise<UserOpReceipt>;
  getUserOpByHash(_userOpHash: string): Promise<UserOpByHashResponse>;
  getGasFeeValues(): Promise<GasFeeValues>;
  getUserOpStatus(_userOpHash: string): Promise<UserOpStatus>;
  getBundlerUrl(): string;
}
