// FHEVM 类型定义 - 基于参考项目的类型

export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInputBuilder;
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, string | bigint | boolean>>;
  getPublicKey(): string;
  getPublicParams(size: number): string;
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
}

export interface EIP712Type {
  domain: any;
  types: any;
  message: any;
  primaryType: string;
}

export interface FhevmDecryptionSignatureType {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
}

export interface EncryptedInputBuilder {
  add32(value: number): EncryptedInputBuilder;
  add64(value: number | bigint): EncryptedInputBuilder;
  addBool(value: boolean): EncryptedInputBuilder;
  addAddress(value: string): EncryptedInputBuilder;
  encrypt(): Promise<{
    handles: string[] | Uint8Array[];
    inputProof: string | Uint8Array;
  }>;
}

export interface FhevmInstanceConfig {
  network: string | any;
  publicKey: string;
  publicParams: string;
  aclContractAddress: string;
  chainId: number;
  gatewayChainId?: number;
  inputVerifierContractAddress: string;
  kmsContractAddress: string;
  verifyingContractAddressDecryption?: string;
  verifyingContractAddressInputVerification?: string;
}

// Window 对象扩展
export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

export interface FhevmRelayerSDKType {
  initSDK(options?: FhevmInitSDKOptions): Promise<boolean>;
  createInstance(config: FhevmInstanceConfig): Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: string;
    chainId: number;
    gatewayChainId: number;
    inputVerifierContractAddress: string;
    kmsContractAddress: string;
    verifyingContractAddressDecryption: string;
    verifyingContractAddressInputVerification: string;
  };
  __initialized__?: boolean;
}

export interface FhevmInitSDKOptions {
  // SDK初始化选项
}

export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;

// 医疗记录相关类型
export interface MedicalRecordType {
  recordId: string;
  patientAddress: string;
  doctorAddress: string;
  recordType: number; // 0: DIAGNOSIS, 1: PRESCRIPTION, 2: LAB_RESULT, 3: TREATMENT, 4: SURGERY
  timestamp: number;
  severity: number; // 1-10
  isActive: boolean;
}

export interface DoctorAuthorizationType {
  doctorAddress: string;
  isAuthorized: boolean;
  authorizedAt: number;
  expiresAt: number;
}

export interface EncryptedMedicalData {
  recordId: string;
  encryptedData: string;
  accessProof: string;
}
