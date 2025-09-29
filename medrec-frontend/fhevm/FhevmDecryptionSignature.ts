// 复制参考项目的真实FhevmDecryptionSignature实现
import { ethers } from "ethers";
import type {
  EIP712Type,
  FhevmDecryptionSignatureType,
  FhevmInstance,
} from "./fhevmTypes";
import { GenericStringStorage } from "./GenericStringStorage";

function _timestampNow(): number {
  return Math.floor(Date.now() / 1000);
}

class FhevmDecryptionSignatureStorageKey {
  #contractAddresses: `0x${string}`[];
  #userAddress: `0x${string}`;
  #publicKey: string | undefined;
  #key: string;

  constructor(
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ) {
    if (!ethers.isAddress(userAddress)) {
      throw new TypeError(`Invalid address ${userAddress}`);
    }

    const sortedContractAddresses = (
      contractAddresses as `0x${string}`[]
    ).sort();

    // 在Mock环境中简化EIP712创建
    let hash: string;
    try {
      if (instance.createEIP712) {
        const emptyEIP712 = instance.createEIP712(
          publicKey ?? ethers.ZeroAddress,
          sortedContractAddresses,
          0,
          0
        );

        hash = ethers.TypedDataEncoder.hash(
          emptyEIP712.domain,
          { UserDecryptRequestVerification: emptyEIP712.types.UserDecryptRequestVerification },
          emptyEIP712.message
        );
      } else {
        // Mock环境fallback
        hash = ethers.keccak256(
          ethers.toUtf8Bytes(`${userAddress}-${sortedContractAddresses.join(",")}`)
        );
      }
    } catch (e) {
      console.log("[MediRecX] EIP712创建失败，使用fallback hash");
      hash = ethers.keccak256(
        ethers.toUtf8Bytes(`${userAddress}-${sortedContractAddresses.join(",")}`)
      );
    }

    this.#contractAddresses = sortedContractAddresses;
    this.#userAddress = userAddress as `0x${string}`;
    this.#publicKey = publicKey;
    this.#key = `${userAddress}:${hash}`;
  }

  get contractAddresses(): `0x${string}`[] {
    return this.#contractAddresses;
  }

  get userAddress(): `0x${string}` {
    return this.#userAddress;
  }

  get publicKey(): string | undefined {
    return this.#publicKey;
  }

  get key(): string {
    return this.#key;
  }
}

export class FhevmDecryptionSignature {
  #publicKey: string;
  #privateKey: string;
  #signature: string;
  #startTimestamp: number; // Unix timestamp in seconds
  #durationDays: number;
  #userAddress: `0x${string}`;
  #contractAddresses: `0x${string}`[];
  #eip712: EIP712Type;

  private constructor(parameters: FhevmDecryptionSignatureType) {
    if (!FhevmDecryptionSignature.checkIs(parameters)) {
      throw new TypeError("Invalid FhevmDecryptionSignatureType");
    }
    this.#publicKey = parameters.publicKey;
    this.#privateKey = parameters.privateKey;
    this.#signature = parameters.signature;
    this.#startTimestamp = parameters.startTimestamp;
    this.#durationDays = parameters.durationDays;
    this.#userAddress = parameters.userAddress;
    this.#contractAddresses = parameters.contractAddresses;
    this.#eip712 = parameters.eip712;
  }

  public get privateKey() {
    return this.#privateKey;
  }

  public get publicKey() {
    return this.#publicKey;
  }

  public get signature() {
    return this.#signature;
  }

  public get contractAddresses() {
    return this.#contractAddresses;
  }

  public get startTimestamp() {
    return this.#startTimestamp;
  }

  public get durationDays() {
    return this.#durationDays;
  }

  public get userAddress() {
    return this.#userAddress;
  }

  static checkIs(s: unknown): s is FhevmDecryptionSignatureType {
    if (!s || typeof s !== "object") {
      return false;
    }
    if (!("publicKey" in s && typeof s.publicKey === "string")) {
      return false;
    }
    if (!("privateKey" in s && typeof s.privateKey === "string")) {
      return false;
    }
    if (!("signature" in s && typeof s.signature === "string")) {
      return false;
    }
    if (!("startTimestamp" in s && typeof s.startTimestamp === "number")) {
      return false;
    }
    if (!("durationDays" in s && typeof s.durationDays === "number")) {
      return false;
    }
    if (!("contractAddresses" in s && Array.isArray(s.contractAddresses))) {
      return false;
    }
    for (let i = 0; i < s.contractAddresses.length; ++i) {
      if (typeof s.contractAddresses[i] !== "string") return false;
      if (!s.contractAddresses[i].startsWith("0x")) return false;
    }
    if (
      !(
        "userAddress" in s &&
        typeof s.userAddress === "string" &&
        s.userAddress.startsWith("0x")
      )
    ) {
      return false;
    }
    if (!("eip712" in s && typeof s.eip712 === "object" && s.eip712 !== null)) {
      return false;
    }

    return true;
  }

  static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      const startTimestamp = _timestampNow();
      const durationDays = 365;
      
      let eip712: EIP712Type;
      let signature: string;

      try {
        // 尝试使用真正的EIP712
        if (instance.createEIP712) {
          eip712 = instance.createEIP712(
            publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
          signature = await signer.signTypedData(
            eip712.domain,
            { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
            eip712.message
          );
        } else {
          throw new Error("EIP712 not supported in Mock");
        }
      } catch (e) {
        // Mock环境fallback
        console.log("[MediRecX] 使用Mock环境EIP712 fallback");
        eip712 = {
          domain: { name: "MediRecX", version: "1" },
          types: { UserDecryptRequestVerification: [] },
          message: {},
          primaryType: "UserDecryptRequestVerification"
        };
        signature = await signer.signMessage(`MediRecX-${userAddress}-${startTimestamp}`);
      }

      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      });
    } catch {
      return null;
    }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string }
  ): Promise<FhevmDecryptionSignature | null> {
    console.log("[MediRecX 解密签名] 开始加载或创建解密签名...");
    
    const userAddress = (await signer.getAddress()) as `0x${string}`;

    const cached: FhevmDecryptionSignature | null =
      await FhevmDecryptionSignature.loadFromGenericStringStorage(
        storage,
        instance,
        contractAddresses,
        userAddress,
        keyPair?.publicKey
      );

    if (cached && cached.isValid()) {
      console.log("[MediRecX 解密签名] ✅ 使用缓存的解密签名");
      return cached;
    }

    console.log("[MediRecX 解密签名] 🆕 创建新的解密签名...");

    // 生成或使用提供的密钥对
    const { publicKey, privateKey } = keyPair ?? (
      instance.generateKeypair ? instance.generateKeypair() : {
        publicKey: "0x" + Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(""),
        privateKey: "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("")
      }
    );

    const sig = await FhevmDecryptionSignature.new(
      instance,
      contractAddresses,
      publicKey,
      privateKey,
      signer
    );

    if (!sig) {
      return null;
    }

    await sig.saveToGenericStringStorage(
      storage,
      instance,
      Boolean(keyPair?.publicKey)
    );

    console.log("[MediRecX 解密签名] ✅ 解密签名创建并保存成功");
    return sig;
  }

  async saveToGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    withPublicKey: boolean
  ) {
    try {
      const value = JSON.stringify(this);

      const storageKey = new FhevmDecryptionSignatureStorageKey(
        instance,
        this.#contractAddresses,
        this.#userAddress,
        withPublicKey ? this.#publicKey : undefined
      );
      await storage.setItem(storageKey.key, value);
      console.log(`[MediRecX] 解密签名已保存! contracts=${this.#contractAddresses.length}`);
    } catch (e) {
      console.error(`[MediRecX] 保存解密签名失败!`, e);
    }
  }

  static async loadFromGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const storageKey = new FhevmDecryptionSignatureStorageKey(
        instance,
        contractAddresses,
        userAddress,
        publicKey
      );

      const result = await storage.getItem(storageKey.key);

      if (!result) {
        console.warn(`[MediRecX] 未找到缓存的解密签名! key=${storageKey.key}`);
        return null;
      }

      const kps = FhevmDecryptionSignature.fromJSON(result);
      if (!kps.isValid()) {
        console.warn(`[MediRecX] 缓存的解密签名已过期`);
        return null;
      }

      return kps;
    } catch (e) {
      console.error(`[MediRecX] 加载解密签名失败!`, e);
      return null;
    }
  }

  toJSON() {
    return {
      publicKey: this.#publicKey,
      privateKey: this.#privateKey,
      signature: this.#signature,
      startTimestamp: this.#startTimestamp,
      durationDays: this.#durationDays,
      userAddress: this.#userAddress,
      contractAddresses: this.#contractAddresses,
      eip712: this.#eip712,
    };
  }

  static fromJSON(json: unknown) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    return new FhevmDecryptionSignature(data);
  }

  isValid(): boolean {
    return (
      _timestampNow() < this.#startTimestamp + this.#durationDays * 24 * 60 * 60
    );
  }
}
