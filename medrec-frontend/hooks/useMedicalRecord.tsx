"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { MedicalRecordABI } from "@/abi/MedicalRecordABI";
import { MedicalRecordAddresses } from "@/abi/MedicalRecordAddresses";
import { MEDICAL_RECORD_TYPES, MEDICAL_RECORD_TYPE_NAMES } from "@/fhevm/internal/constants";
import { encryptMedicalDetails, generateSampleMedicalDetails } from "@/utils/medicalRecordEncryption";

// 类型定义
export interface MedicalRecordInfo {
  abi: typeof MedicalRecordABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
}

export interface EncryptedMedicalRecord {
  recordId: string;
  patientAddress: string;
  doctorAddress: string;
  recordType: string;
  timestamp: string;
  severity: string;
  isActive: string;
}

/**
 * 根据chainId获取MedicalRecord合约信息
 */
function getMedicalRecordByChainId(chainId: number | undefined): MedicalRecordInfo {
  if (!chainId) {
    return { abi: MedicalRecordABI.abi };
  }

  const entry = MedicalRecordAddresses[chainId.toString() as keyof typeof MedicalRecordAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: MedicalRecordABI.abi, chainId };
  }

  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: MedicalRecordABI.abi,
  };
}

/**
 * MediRecX医疗记录管理Hook
 */
export const useMedicalRecord = (parameters: {
  instance: FhevmInstance | undefined;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  userAddress?: string;
}) => {
  const {
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    userAddress,
  } = parameters;

  // 状态管理
  const [totalRecords, setTotalRecords] = useState<string | undefined>(undefined);
  const [userRecords, setUserRecords] = useState<EncryptedMedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<Error | undefined>(undefined);

  // 引用
  const contractRef = useRef<MedicalRecordInfo | undefined>(undefined);
  const isLoadingRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // 合约信息
  const contract = useMemo(() => {
    const c = getMedicalRecordByChainId(chainId);
    contractRef.current = c;

    if (!c.address) {
      setMessage(`MedicalRecord合约未在chainId=${chainId}上部署`);
    } else {
      setMessage("");
    }

    return c;
  }, [chainId]);

  // 检查是否已部署
  const isDeployed = useMemo(() => {
    if (!contract) return undefined;
    return Boolean(contract.address) && contract.address !== ethers.ZeroAddress;
  }, [contract]);

  // 检查是否可以执行操作
  const canInteract = useMemo(() => {
    return contract.address && instance && ethersSigner && !isLoading && !isSubmitting;
  }, [contract.address, instance, ethersSigner, isLoading, isSubmitting]);

  /**
   * 获取总记录数
   */
  const getTotalRecords = useCallback(async () => {
    if (!canInteract || !ethersReadonlyProvider) return;

    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("获取总记录数...");

    try {
      const contractInstance = new ethers.Contract(
        contract.address!,
        contract.abi,
        ethersReadonlyProvider
      );

      const total = await contractInstance.getTotalRecords();
      console.log(`[MediRecX Hook] 总记录数（加密）: ${total}`);
      
      setTotalRecords(total.toString());
      setMessage(`成功获取总记录数（加密状态）`);
      
    } catch (err) {
      console.error("获取总记录数失败:", err);
      setMessage(`获取总记录数失败: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [canInteract, ethersReadonlyProvider, contract.address, contract.abi]);

  /**
   * 添加医疗记录
   */
  const addMedicalRecord = useCallback(async (params: {
    patientAddress: string;
    recordType: keyof typeof MEDICAL_RECORD_TYPES;
    severity: number; // 1-10
    medicalDetails?: string; // 真实的医疗详情文本
  }) => {
    if (!canInteract) {
      setMessage("无法添加记录：请检查连接状态");
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage("正在添加医疗记录...");

    try {
      const { patientAddress, recordType, severity } = params;

      // 基本验证输入
      if (!patientAddress.startsWith('0x') || patientAddress.length !== 42) {
        throw new Error("无效的患者地址");
      }
      if (severity < 1 || severity > 10) {
        throw new Error("严重程度必须在1-10之间");
      }

      // 创建加密输入
      const input = instance!.createEncryptedInput(
        contract.address!,
        ethersSigner!.address
      );

      console.log(`[MediRecX Hook] 准备加密输入...`);
      console.log(`  患者地址: ${patientAddress}`);
      console.log(`  记录类型: ${recordType} (${MEDICAL_RECORD_TYPES[recordType]})`);
      console.log(`  严重程度: ${severity}`);

      // 直接使用用户输入的真实医疗详情文本（不加密）
      const medicalDetailsText = params.medicalDetails || `医生未填写详细信息`;

      console.log(`[MediRecX Hook] 📝 存储真实医疗详情:`, medicalDetailsText.slice(0, 100) + "...");

      // 计算详情文本的简单哈希（用于验证）
      const { ethers } = await import("ethers");
      const detailsHash = ethers.keccak256(ethers.toUtf8Bytes(medicalDetailsText));
      const detailsHashNumber = parseInt(detailsHash.slice(2, 18), 16);

      setMessage("准备FHEVM加密数据...");

      // 添加FHEVM加密数据
      input.addAddress(patientAddress);
      input.add32(MEDICAL_RECORD_TYPES[recordType]);
      input.add32(severity);
      input.add64(detailsHashNumber); // 详情哈希的数字形式

          // 执行FHEVM加密（可能需要一些时间）
          setMessage("正在FHEVM加密数据...");
          const enc = await input.encrypt();

          console.log(`[MediRecX Hook] FHEVM数据加密完成`);

          // 处理类型兼容性
          const handles = enc.handles.map(h => typeof h === 'string' ? h : `0x${Buffer.from(h).toString('hex')}`);
          const inputProof = typeof enc.inputProof === 'string' ? enc.inputProof : `0x${Buffer.from(enc.inputProof).toString('hex')}`;

          // 调用智能合约
          const contractInstance = new ethers.Contract(
            contract.address!,
            contract.abi,
            ethersSigner!
          );

          setMessage("正在提交交易...");
          const tx = await contractInstance.addMedicalRecord(
            patientAddress,    // patientPlainAddr - 明文患者地址
            handles[0],        // patientAddr - 加密患者地址
            handles[1],        // recordTypeInput - 加密记录类型
            handles[2],        // severityInput - 加密严重程度
            medicalDetailsText, // encryptedDetails - 直接存储明文医疗详情（Demo环境）
            handles[3],        // detailsHashInput - 加密的详情哈希
            inputProof,        // patientProof
            inputProof,        // recordTypeProof
            inputProof,        // severityProof
            inputProof         // hashProof
          );

      console.log(`[MediRecX Hook] 交易已提交: ${tx.hash}`);
      setMessage(`等待交易确认: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[MediRecX Hook] 交易确认成功: ${receipt?.status}`);

      setMessage(`✅ 医疗记录添加成功！交易哈希: ${tx.hash}`);

      // 触发记录添加事件（供其他组件监听）
      window.dispatchEvent(new CustomEvent('medicalRecordAdded', {
        detail: {
          id: `record_${Date.now()}`,
          patientAddress: params.patientAddress,
          doctorAddress: ethersSigner!.address,
          recordType: MEDICAL_RECORD_TYPE_NAMES[MEDICAL_RECORD_TYPES[params.recordType]],
          severity: params.severity,
          timestamp: new Date().toISOString(),
          txHash: tx.hash,
          isOnChain: true
        }
      }));

      // 刷新总记录数
      setTimeout(() => getTotalRecords(), 2000);

    } catch (err) {
      console.error("添加医疗记录失败:", err);
      setMessage(`❌ 添加记录失败: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [canInteract, instance, ethersSigner, contract.address, contract.abi]);

  /**
   * 授权医生访问
   */
  const authorizeDoctorAccess = useCallback(async (params: {
    doctorAddress: string;
    expirationDays: number;
  }) => {
    if (!canInteract) {
      setMessage("无法授权访问：请检查连接状态");
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage("正在授权医生访问...");

    try {
      const { doctorAddress, expirationDays } = params;

      // 验证输入
      if (!ethers.isAddress(doctorAddress)) {
        throw new Error("无效的医生地址");
      }

      // 计算过期时间戳
      const expirationTimestamp = Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60);

      // 创建加密输入
      const input = instance!.createEncryptedInput(
        contract.address!,
        ethersSigner!.address
      );

      input.addAddress(doctorAddress);
      input.add64(expirationTimestamp);

      console.log(`[MediRecX Hook] 准备授权...`);
      console.log(`  医生地址: ${doctorAddress}`);
      console.log(`  过期时间: ${new Date(expirationTimestamp * 1000).toLocaleString()}`);

        setMessage("正在加密授权数据...");
        const enc = await input.encrypt();

        // 处理类型兼容性
        const handles = enc.handles.map(h => typeof h === 'string' ? h : `0x${Buffer.from(h).toString('hex')}`);
        const inputProof = typeof enc.inputProof === 'string' ? enc.inputProof : `0x${Buffer.from(enc.inputProof).toString('hex')}`;

        // 调用智能合约
        const contractInstance = new ethers.Contract(
          contract.address!,
          contract.abi,
          ethersSigner!
        );

        setMessage("正在提交授权交易...");
        const tx = await contractInstance.authorizeDoctorAccess(
          handles[0], // doctorAddress
          handles[1], // expirationTime
          inputProof, // doctorProof
          inputProof  // expirationProof
        );

      console.log(`[MediRecX Hook] 授权交易已提交: ${tx.hash}`);
      setMessage(`等待授权交易确认: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[MediRecX Hook] 授权交易确认成功: ${receipt?.status}`);

      setMessage(`✅ 医生访问授权成功！交易哈希: ${tx.hash}`);

      // 触发授权事件
      window.dispatchEvent(new CustomEvent('doctorAuthorized', {
        detail: {
          id: `auth_${Date.now()}`,
          patientAddress: ethersSigner!.address,
          doctorAddress: params.doctorAddress,
          authorizedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000).toISOString(),
          txHash: tx.hash,
          isActive: true
        }
      }));

    } catch (err) {
      console.error("授权医生访问失败:", err);
      setMessage(`❌ 授权失败: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [canInteract, instance, ethersSigner, contract.address, contract.abi]);

  /**
   * 生成随机记录ID
   */
  const generateRandomRecordId = useCallback(async () => {
    if (!canInteract) return;

    try {
      setMessage("正在生成随机记录ID...");
      
      const contractInstance = new ethers.Contract(
        contract.address!,
        contract.abi,
        ethersSigner!
      );

      const tx = await contractInstance.generateRandomRecordId();
      const receipt = await tx.wait();
      
      setMessage(`✅ 随机记录ID生成成功！交易: ${tx.hash}`);
      
    } catch (err) {
      console.error("生成随机记录ID失败:", err);
      setMessage(`❌ 生成失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [canInteract, ethersSigner, contract.address, contract.abi]);

  // 自动获取总记录数（仅在初次连接时执行）
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  useEffect(() => {
    if (isDeployed && canInteract && !hasInitialLoad && !isLoading && !isSubmitting) {
      const timer = setTimeout(() => {
        getTotalRecords();
        setHasInitialLoad(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeployed, canInteract, hasInitialLoad]);

  return {
    // 合约信息
    contractAddress: contract.address,
    contractChainId: contract.chainId,
    contractChainName: contract.chainName,
    isDeployed,
    
    // 数据
    totalRecords,
    userRecords,
    
    // 状态
    isLoading,
    isSubmitting,
    canInteract,
    message,
    error,
    
    // 方法
    getTotalRecords,
    addMedicalRecord,
    authorizeDoctorAccess,
    revokeDoctorAccess: async (params: { doctorAddress: string }) => {
      if (!canInteract || !instance || !ethersSigner) {
        throw new Error("Cannot revoke authorization: Please check connection status");
      }

      setIsSubmitting(true);
      setError(undefined);

      try {
        console.log(`[MediRecX] 🚫 Revoking doctor access: ${params.doctorAddress}`);
        
        // 创建加密输入
        const encryptedInputs = instance.createEncryptedInput(contract.address!, userAddress!);
        encryptedInputs.addAddress(params.doctorAddress);
        
        const { handles, inputProof } = await encryptedInputs.encrypt();
        
        const contractInstance = new ethers.Contract(
          contract.address!,
          contract.abi,
          ethersSigner
        );

        setMessage("Submitting revocation transaction...");
        const tx = await contractInstance.revokeDoctorAccess(
          handles[0], // doctorAddress
          inputProof   // doctorProof
        );
        
        setMessage("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        
        console.log(`[MediRecX] ✅ Doctor access revoked! Gas used: ${receipt.gasUsed}`);
        setMessage("Doctor access has been successfully revoked!");
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('doctorDeauthorized', {
          detail: {
            doctorAddress: params.doctorAddress,
            txHash: tx.hash
          }
        }));
        
        return receipt;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Revoke authorization failed';
        console.error(`[MediRecX] ❌ Revoke authorization failed:`, error);
        setError(new Error(errorMessage));
        setMessage(`Revoke authorization failed: ${errorMessage}`);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    generateRandomRecordId,
  };
};
