//////////////////////////////////////////////////////////////////////////
//
// ⚠️ 警告!!
// 始终使用动态导入此文件，以避免将整个FHEVM MOCK库
// 包含在最终的生产bundle中!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  console.log("[MediRecX Mock] 创建Mock FHEVM实例...");
  console.log(`[MediRecX Mock] RPC URL: ${parameters.rpcUrl}`);
  console.log(`[MediRecX Mock] Chain ID: ${parameters.chainId}`);
  console.log(`[MediRecX Mock] ACL Address: ${parameters.metadata.ACLAddress}`);
  
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  const instance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption:
      "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification:
      "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });
  
  console.log("[MediRecX Mock] ✅ Mock FHEVM实例创建成功！");
  return instance as any; // 类型兼容性处理
};
