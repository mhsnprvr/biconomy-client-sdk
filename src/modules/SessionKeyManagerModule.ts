import { MerkleTree } from "merkletreejs"
import {
  type Hex,
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  pad,
  parseAbi,
  parseAbiParameters,
  toBytes,
  toHex
} from "viem"
import { type SmartAccountSigner, convertSigner } from "../account"
import { BaseValidationModule } from "./BaseValidationModule.js"
import type {
  ISessionStorage,
  SessionLeafNode,
  SessionSearchParam,
  SessionStatus
} from "./interfaces/ISessionStorage.js"
import { SessionLocalStorage } from "./session-storage/SessionLocalStorage.js"
import { SessionMemoryStorage } from "./session-storage/SessionMemoryStorage.js"
import {
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION
} from "./utils/Constants.js"
import {
  type CreateSessionDataParams,
  type CreateSessionDataResponse,
  type ModuleInfo,
  type ModuleVersion,
  type SessionKeyManagerModuleConfig,
  StorageType
} from "./utils/Types.js"
import { generateRandomHex } from "./utils/Uid.js"

export class SessionKeyManagerModule extends BaseValidationModule {
  version: ModuleVersion = "V1_0_0"

  moduleAddress!: Hex

  merkleTree!: MerkleTree

  sessionStorageClient!: ISessionStorage

  readonly mockEcdsaSessionKeySig: Hex =
    "0x73c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b"

  /**
   * This constructor is private. Use the static create method to instantiate SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns An instance of SessionKeyManagerModule
   */
  private constructor(moduleConfig: SessionKeyManagerModuleConfig) {
    super(moduleConfig)
  }

  /**
   * Asynchronously creates and initializes an instance of SessionKeyManagerModule
   * @param moduleConfig The configuration for the module
   * @returns A Promise that resolves to an instance of SessionKeyManagerModule
   */
  public static async create(
    moduleConfig: SessionKeyManagerModuleConfig
  ): Promise<SessionKeyManagerModule> {
    // TODO: (Joe) stop doing things in a 'create' call after the instance has been created
    const instance = new SessionKeyManagerModule(moduleConfig)

    if (moduleConfig.moduleAddress) {
      instance.moduleAddress = moduleConfig.moduleAddress
    } else if (moduleConfig.version) {
      const moduleAddr = SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION[
        moduleConfig.version
      ] as Hex
      if (!moduleAddr) {
        throw new Error(`Invalid version ${moduleConfig.version}`)
      }
      instance.moduleAddress = moduleAddr
      instance.version = moduleConfig.version as ModuleVersion
    } else {
      instance.moduleAddress = DEFAULT_SESSION_KEY_MANAGER_MODULE
      // Note: in this case Version remains the default one
    }

    if (moduleConfig.sessionStorageClient) {
      instance.sessionStorageClient = moduleConfig.sessionStorageClient
    } else {
      switch (moduleConfig.storageType) {
        case StorageType.MEMORY_STORAGE:
          instance.sessionStorageClient = new SessionMemoryStorage(
            moduleConfig.smartAccountAddress
          )
          break
        case StorageType.LOCAL_STORAGE:
          instance.sessionStorageClient = new SessionLocalStorage(
            moduleConfig.smartAccountAddress
          )
          break
        default:
          instance.sessionStorageClient = new SessionLocalStorage(
            moduleConfig.smartAccountAddress
          )
      }
    }

    const existingSessionData =
      await instance.sessionStorageClient.getAllSessionData()
    const existingSessionDataLeafs = existingSessionData.map((sessionData) => {
      const leafDataHex = concat([
        pad(toHex(sessionData.validUntil), { size: 6 }),
        pad(toHex(sessionData.validAfter), { size: 6 }),
        pad(sessionData.sessionValidationModule, { size: 20 }),
        sessionData.sessionKeyData
      ])
      return keccak256(leafDataHex)
    })

    instance.merkleTree = new MerkleTree(existingSessionDataLeafs, keccak256, {
      sortPairs: true,
      hashLeaves: false
    })

    return instance
  }

  /**
   * Method to create session data for any module. The session data is used to create a leaf in the merkle tree
   * @param leavesData The data of one or more leaves to be used to create session data
   * @returns The session data
   */
  createSessionData = async (
    leavesData: CreateSessionDataParams[]
  ): Promise<CreateSessionDataResponse> => {
    const sessionKeyManagerModuleABI = parseAbi([
      "function setMerkleRoot(bytes32 _merkleRoot)"
    ])

    const leavesToAdd: Buffer[] = []
    const sessionIDInfo: string[] = []

    for (const leafData of leavesData) {
      const leafDataHex = concat([
        pad(toHex(leafData.validUntil), { size: 6 }),
        pad(toHex(leafData.validAfter), { size: 6 }),
        pad(leafData.sessionValidationModule, { size: 20 }),
        leafData.sessionKeyData
      ])

      const generatedSessionId =
        leafData.preferredSessionId ?? generateRandomHex()

      // TODO: verify this, might not be buffer
      leavesToAdd.push(keccak256(leafDataHex) as unknown as Buffer)
      sessionIDInfo.push(generatedSessionId)

      const sessionLeafNode = {
        ...leafData,
        sessionID: generatedSessionId,
        status: "PENDING" as SessionStatus
      }

      await this.sessionStorageClient.addSessionData(sessionLeafNode)
    }

    this.merkleTree.addLeaves(leavesToAdd)

    const leaves = this.merkleTree.getLeaves()

    const newMerkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: false
    })

    this.merkleTree = newMerkleTree

    const setMerkleRootData = encodeFunctionData({
      abi: sessionKeyManagerModuleABI,
      functionName: "setMerkleRoot",
      args: [this.merkleTree.getHexRoot() as Hex]
    })

    await this.sessionStorageClient.setMerkleRoot(this.merkleTree.getHexRoot())
    return {
      data: setMerkleRootData,
      sessionIDInfo: sessionIDInfo
    }
  }

  /**
   * This method is used to sign the user operation using the session signer
   * @param userOp The user operation to be signed
   * @param sessionSigner The signer to be used to sign the user operation
   * @returns The signature of the user operation
   */
  async signUserOpHash(userOpHash: string, params?: ModuleInfo): Promise<Hex> {
    if (!params?.sessionSigner) {
      throw new Error("Session signer is not provided.")
    }
    const { signer: sessionSigner } = await convertSigner(
      params.sessionSigner,
      false
    )

    // Use the sessionSigner to sign the user operation
    const signature = await sessionSigner.signMessage({
      raw: toBytes(userOpHash)
    })

    const sessionSignerData = await this.getLeafInfo(params)

    const leafDataHex = concat([
      pad(toHex(sessionSignerData.validUntil), { size: 6 }),
      pad(toHex(sessionSignerData.validAfter), { size: 6 }),
      pad(sessionSignerData.sessionValidationModule, { size: 20 }),
      sessionSignerData.sessionKeyData
    ])

    // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
    let paddedSignature: Hex = encodeAbiParameters(
      parseAbiParameters("uint48, uint48, address, bytes, bytes32[], bytes"),
      [
        sessionSignerData.validUntil,
        sessionSignerData.validAfter,
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        this.merkleTree.getHexProof(keccak256(leafDataHex)) as Hex[],
        signature
      ]
    )

    if (params?.additionalSessionData) {
      paddedSignature += params.additionalSessionData
    }

    return paddedSignature as Hex
  }

  private async getLeafInfo(params: ModuleInfo): Promise<SessionLeafNode> {
    if (!params?.sessionSigner) {
      throw new Error("Session signer is not provided.")
    }
    const { signer: sessionSigner } = await convertSigner(
      params.sessionSigner,
      false
    )
    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let sessionSignerData
    if (params?.sessionID) {
      sessionSignerData = await this.sessionStorageClient.getSessionData({
        sessionID: params.sessionID
      })
    } else if (params?.sessionValidationModule) {
      sessionSignerData = await this.sessionStorageClient.getSessionData({
        sessionValidationModule: params.sessionValidationModule,
        sessionPublicKey: await sessionSigner.getAddress()
      })
    } else {
      throw new Error(
        "sessionID or sessionValidationModule should be provided."
      )
    }

    return sessionSignerData
  }

  /**
   * Update the session data pending state to active
   * @param param The search param to find the session data
   * @param status The status to be updated
   * @returns
   */
  async updateSessionStatus(
    param: SessionSearchParam,
    status: SessionStatus
  ): Promise<void> {
    this.sessionStorageClient.updateSessionStatus(param, status)
  }

  /**
   * @remarks This method is used to clear all the pending sessions
   * @returns
   */
  async clearPendingSessions(): Promise<void> {
    this.sessionStorageClient.clearPendingSessions()
  }

  /**
   * @returns SessionKeyManagerModule address
   */
  getAddress(): Hex {
    return this.moduleAddress
  }

  /**
   * @remarks This is the version of the module contract
   */
  async getSigner(): Promise<SmartAccountSigner> {
    throw new Error("Method not implemented.")
  }

  /**
   * @remarks This is the dummy signature for the module, used in buildUserOp for bundler estimation
   * @returns Dummy signature
   */
  async getDummySignature(params?: ModuleInfo): Promise<Hex> {
    if (!params) {
      throw new Error("Session signer is not provided.")
    }
    const sessionSignerData = await this.getLeafInfo(params)
    const leafDataHex = concat([
      pad(toHex(sessionSignerData.validUntil), { size: 6 }),
      pad(toHex(sessionSignerData.validAfter), { size: 6 }),
      pad(sessionSignerData.sessionValidationModule, { size: 20 }),
      sessionSignerData.sessionKeyData
    ])

    // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
    let paddedSignature: Hex = encodeAbiParameters(
      parseAbiParameters("uint48, uint48, address, bytes, bytes32[], bytes"),
      [
        sessionSignerData.validUntil,
        sessionSignerData.validAfter,
        sessionSignerData.sessionValidationModule,
        sessionSignerData.sessionKeyData,
        this.merkleTree.getHexProof(keccak256(leafDataHex)) as Hex[],
        this.mockEcdsaSessionKeySig
      ]
    )
    if (params?.additionalSessionData) {
      paddedSignature += params.additionalSessionData
    }

    const dummySig = encodeAbiParameters(
      parseAbiParameters(["bytes, address"]),
      [paddedSignature as Hex, this.getAddress()]
    )

    return dummySig
  }

  /**
   * @remarks Other modules may need additional attributes to build init data
   */
  async getInitData(): Promise<Hex> {
    throw new Error("Method not implemented.")
  }

  /**
   * @remarks This Module dont have knowledge of signer. So, this method is not implemented
   */
  async signMessage(_message: Uint8Array | string): Promise<string> {
    throw new Error("Method not implemented.")
  }
}
