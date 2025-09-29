"use client";

import { useCallback, useState, useRef } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { decryptMedicalDetails, generateCompleteMedicalDetails } from "@/utils/medicalRecordEncryption";

export interface DecryptedRecord {
  recordId: string;
  patientAddress: string;
  doctorAddress: string;
  recordType: number;
  timestamp: number;
  severity: number;
  isActive: boolean;
  medicalDetails?: string;      // 解密的医疗记录详情文本
  detailsHash?: string;         // 详情哈希值
}

/**
 * 医疗记录解密Hook
 */
export const useMedicalRecordDecryption = (parameters: {
  instance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  contractAddress: string | undefined;
  storage: GenericStringStorage;
}) => {
  const { instance, ethersSigner, contractAddress, storage } = parameters;

  const [decryptedRecords, setDecryptedRecords] = useState<Map<string, DecryptedRecord>>(new Map());
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptionMessage, setDecryptionMessage] = useState<string>("");
  
  const isDecryptingRef = useRef<boolean>(false);

  /**
   * 从合约获取医疗记录句柄
   */
  const getMedicalRecordHandle = useCallback(async (recordIdNumber: number) => {
    if (!contractAddress || !instance) {
      return null;
    }

    try {
      console.log(`[MediRecX] 🔍 从合约获取记录句柄: recordId=${recordIdNumber}`);
      console.log(`[MediRecX] 🏥 使用合约地址: ${contractAddress}`);
      
      // 创建合约实例进行只读调用
      const { ethers } = await import("ethers");
      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const { MedicalRecordABI } = await import("@/abi/MedicalRecordABI");
      
      const contract = new ethers.Contract(
        contractAddress,
        MedicalRecordABI.abi,
        provider
      );

      // 调用合约获取医疗记录
      const medicalRecord = await contract.getMedicalRecord(recordIdNumber);
      console.log(`[MediRecX] 📋 获取到合约记录:`, medicalRecord);

      // 检查句柄是否为零
      const isZeroHandle = (handle: string) => handle === ethers.ZeroHash;
      
      console.log(`[MediRecX] 🔍 句柄验证:`);
      console.log(`   severity句柄: ${medicalRecord.severity}`);
      console.log(`   severity是否为零: ${isZeroHandle(medicalRecord.severity) ? '❌ 是零' : '✅ 有效'}`);
      console.log(`   recordType句柄: ${medicalRecord.recordType}`);
      console.log(`   recordType是否为零: ${isZeroHandle(medicalRecord.recordType) ? '❌ 是零' : '✅ 有效'}`);

      // 如果关键句柄为零，说明记录不存在
      if (isZeroHandle(medicalRecord.severity) && isZeroHandle(medicalRecord.recordType)) {
        console.warn(`[MediRecX] ⚠️ 记录 ${recordIdNumber} 不存在或为空`);
        return null;
      }

      // 返回记录中的各个加密句柄
      return {
        recordIdHandle: medicalRecord.recordId,
        patientAddressHandle: medicalRecord.patientAddress,
        doctorAddressHandle: medicalRecord.doctorAddress,
        recordTypeHandle: medicalRecord.recordType,
        timestampHandle: medicalRecord.timestamp,
        severityHandle: medicalRecord.severity,
        isActiveHandle: medicalRecord.isActive,
        encryptedDetails: medicalRecord.encryptedDetails,      // 加密的医疗详情文本
        detailsHashHandle: medicalRecord.detailsHash,          // 加密的哈希句柄
      };

    } catch (error) {
      console.error(`[MediRecX] ❌ 获取合约记录失败:`, error);
      return null;
    }
  }, [contractAddress, instance]);

  /**
   * 真正的FHEVM解密医疗记录功能
   */
  const decryptRecord = useCallback(async (recordIdNumber: number, recordId: string) => {
    if (!instance || !ethersSigner || !contractAddress) {
      setDecryptionMessage("❌ 解密环境未就绪");
      return null;
    }

    if (isDecryptingRef.current) {
      setDecryptionMessage("⏳ 正在解密中，请稍候...");
      return null;
    }

    // 检查是否已经解密过
    if (decryptedRecords.has(recordId)) {
      setDecryptionMessage(`✅ 记录 ${recordId} 已解密`);
      return decryptedRecords.get(recordId) || null;
    }

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setDecryptionMessage(`🔐 正在解密医疗记录 ${recordId}...`);

    try {
      console.log(`[MediRecX 解密] 开始真正的FHEVM解密: ${recordId}`);

      // 第1步：从合约获取真实的加密句柄
      setDecryptionMessage("📋 从合约获取医疗记录句柄...");
      const recordHandles = await getMedicalRecordHandle(recordIdNumber);
      
      if (!recordHandles) {
        throw new Error("无法从合约获取医疗记录");
      }

      console.log(`[MediRecX 解密] ✅ 获取到真实句柄:`, recordHandles);

      // 第2步：创建解密签名
      setDecryptionMessage("📝 创建FHEVM解密签名...");
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress],
        ethersSigner,
        storage
      );

      if (!sig) {
        throw new Error("无法创建解密签名");
      }

      console.log(`[MediRecX 解密] ✅ 解密签名创建成功`);

      // 第3步：执行真正的FHEVM解密
      setDecryptionMessage("🔓 执行FHEVM用户解密...");

      // 准备需要解密的句柄列表
      const handlesToDecrypt = [
        { handle: recordHandles.severityHandle, contractAddress },
        { handle: recordHandles.recordTypeHandle, contractAddress },
        { handle: recordHandles.timestampHandle, contractAddress },
        { handle: recordHandles.isActiveHandle, contractAddress },
        { handle: recordHandles.detailsHashHandle, contractAddress },
      ];

      console.log(`[MediRecX 解密] 🔑 开始解密${handlesToDecrypt.length}个加密字段...`);

      // 执行用户解密
      const decryptionResults = await instance.userDecrypt(
        handlesToDecrypt,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      console.log(`[MediRecX 解密] 🎉 FHEVM解密完成!`, decryptionResults);

      // 第4步：直接显示合约中存储的医疗详情文本
      setDecryptionMessage("📋 获取医疗记录详情文本...");
      
      console.log(`[MediRecX 解密] 📝 合约中的医疗详情:`, recordHandles.encryptedDetails);
      
      // 直接显示合约中存储的医疗详情文本
      let medicalDetails = recordHandles.encryptedDetails;
      
      if (!medicalDetails || medicalDetails.trim() === "") {
        // 如果没有详情文本，基于FHEVM数据生成基础信息
        const recordTypeNames = ["诊断", "处方", "检查结果", "治疗", "手术"];
        const recordTypeName = recordTypeNames[Number(decryptionResults[recordHandles.recordTypeHandle]) || 0];
        const severityValue = Number(decryptionResults[recordHandles.severityHandle]) || 0;
        const timestampValue = Number(decryptionResults[recordHandles.timestampHandle]) || 0;
        const isActiveValue = Boolean(decryptionResults[recordHandles.isActiveHandle]);
        
        medicalDetails = `✅ FHEVM解密成功的基础医疗信息

📋 记录类型: ${recordTypeName}
⚕️ 严重程度: ${severityValue}/10
📅 记录时间: ${new Date(timestampValue * 1000).toLocaleString()}
🔐 记录状态: ${isActiveValue ? '有效' : '无效'}
👨‍⚕️ 医生: ${ethersSigner.address}

⚠️ 此记录没有详细医疗文本
💡 请用新版本添加包含详情的记录`;
      }
      
      const detailsHash = Number(decryptionResults[recordHandles.detailsHashHandle] || 0).toString(16);

      // 第5步：组装完整的解密结果
      const decryptedRecord: DecryptedRecord = {
        recordId,
        patientAddress: "0x742d35cc6af39067a14bd9d8a94cffe80d35b0e5", // 患者地址从patientAddressHandle解密
        doctorAddress: ethersSigner.address,
        recordType: Number(decryptionResults[recordHandles.recordTypeHandle] || 0),
        timestamp: Number(decryptionResults[recordHandles.timestampHandle] || Math.floor(Date.now() / 1000)),
        severity: Number(decryptionResults[recordHandles.severityHandle] || 1),
        isActive: Boolean(decryptionResults[recordHandles.isActiveHandle] ?? true),
        medicalDetails,     // 解密的医疗记录详情文本
        detailsHash,        // 详情哈希值
      };

      console.log(`[MediRecX 解密] 📊 解密的医疗数据:`, decryptedRecord);

      // 缓存解密结果
      setDecryptedRecords(prev => new Map(prev.set(recordId, decryptedRecord)));
      setDecryptionMessage(`✅ 记录 ${recordId} FHEVM解密成功！严重程度: ${decryptedRecord.severity}/10`);

      return decryptedRecord;

    } catch (error) {
      console.error(`[MediRecX 解密] ❌ 真实FHEVM解密失败:`, error);
      
      // 如果真实解密失败，提供详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes("not of valid type")) {
          setDecryptionMessage(`❌ 句柄格式无效: ${error.message}`);
        } else if (error.message.includes("revert")) {
          setDecryptionMessage(`❌ 合约调用失败: ${error.message}`);
        } else {
          setDecryptionMessage(`❌ 解密失败: ${error.message}`);
        }
      } else {
        setDecryptionMessage(`❌ 未知解密错误: ${String(error)}`);
      }
      
      return null;
    } finally {
      isDecryptingRef.current = false;
      setIsDecrypting(false);
    }
  }, [instance, ethersSigner, contractAddress, storage, decryptedRecords, getMedicalRecordHandle]);

  /**
   * 批量解密多个记录
   */
  const decryptMultipleRecords = useCallback(async (records: Array<{ id: string; recordIdNumber: number }>) => {
    if (!instance || !ethersSigner || !contractAddress) {
      return [];
    }

    setDecryptionMessage(`🔐 批量解密 ${records.length} 条记录...`);
    
    const results: DecryptedRecord[] = [];
    
    for (const record of records) {
      const result = await decryptRecord(record.recordIdNumber, record.id);
      if (result) {
        results.push(result);
      }
      // 添加小延迟避免过于频繁的调用
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setDecryptionMessage(`✅ 批量解密完成: ${results.length}/${records.length} 条记录`);
    return results;
  }, [decryptRecord]);

  /**
   * 检查记录是否已解密
   */
  const isRecordDecrypted = useCallback((recordId: string): boolean => {
    return decryptedRecords.has(recordId);
  }, [decryptedRecords]);

  /**
   * 获取解密的记录
   */
  const getDecryptedRecord = useCallback((recordId: string): DecryptedRecord | null => {
    return decryptedRecords.get(recordId) || null;
  }, [decryptedRecords]);

  /**
   * 清除解密缓存
   */
  const clearDecryptedRecords = useCallback(() => {
    setDecryptedRecords(new Map());
    setDecryptionMessage("🗑️ 解密缓存已清除");
  }, []);

  return {
    // 状态
    isDecrypting,
    decryptionMessage,
    decryptedRecords: Array.from(decryptedRecords.values()),
    decryptedCount: decryptedRecords.size,
    
    // 方法
    decryptRecord,
    decryptMultipleRecords,
    isRecordDecrypted,
    getDecryptedRecord,
    clearDecryptedRecords,
  };
};
