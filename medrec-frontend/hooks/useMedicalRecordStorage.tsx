"use client";

import { useState, useCallback, useEffect } from "react";
import { GenericStringStorage, IndexedDBStorage } from "@/fhevm/GenericStringStorage";

export interface StoredMedicalRecord {
  id: string;
  patientAddress: string;
  doctorAddress: string;
  recordType: string;
  severity: number;
  timestamp: string;
  txHash?: string;
  encryptedHandle?: string;
  isOnChain: boolean;
  notes?: string;
}

export interface StoredAuthorization {
  id: string;
  patientAddress: string;
  doctorAddress: string;
  authorizedAt: string;
  expiresAt: string;
  txHash?: string;
  isActive: boolean;
}

/**
 * 医疗记录本地存储管理Hook
 * 用于在链上数据和本地显示之间建立桥梁
 */
export const useMedicalRecordStorage = () => {
  const [storage] = useState<GenericStringStorage>(() => new IndexedDBStorage());
  const [records, setRecords] = useState<StoredMedicalRecord[]>([]);
  const [authorizations, setAuthorizations] = useState<StoredAuthorization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 加载存储的医疗记录
   */
  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedRecords = await storage.getItem("medrec-records");
      const storedAuths = await storage.getItem("medrec-authorizations");

      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }
      
      if (storedAuths) {
        setAuthorizations(JSON.parse(storedAuths));
      }

      console.log("[MediRecX Storage] ✅ 本地记录加载完成");
    } catch (error) {
      console.error("[MediRecX Storage] ❌ 加载记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  /**
   * 保存医疗记录
   */
  const saveRecord = useCallback(async (record: StoredMedicalRecord) => {
    try {
      const updatedRecords = [...records, record];
      setRecords(updatedRecords);
      await storage.setItem("medrec-records", JSON.stringify(updatedRecords));
      
      console.log(`[MediRecX Storage] ✅ 记录已保存: ${record.id}`);
      return true;
    } catch (error) {
      console.error("[MediRecX Storage] ❌ 保存记录失败:", error);
      return false;
    }
  }, [records, storage]);

  /**
   * 更新医疗记录
   */
  const updateRecord = useCallback(async (recordId: string, updates: Partial<StoredMedicalRecord>) => {
    try {
      const updatedRecords = records.map(record => 
        record.id === recordId ? { ...record, ...updates } : record
      );
      setRecords(updatedRecords);
      await storage.setItem("medrec-records", JSON.stringify(updatedRecords));
      
      console.log(`[MediRecX Storage] ✅ 记录已更新: ${recordId}`);
      return true;
    } catch (error) {
      console.error("[MediRecX Storage] ❌ 更新记录失败:", error);
      return false;
    }
  }, [records, storage]);

  /**
   * 保存授权信息
   */
  const saveAuthorization = useCallback(async (auth: StoredAuthorization) => {
    try {
      const updatedAuths = [...authorizations, auth];
      setAuthorizations(updatedAuths);
      await storage.setItem("medrec-authorizations", JSON.stringify(updatedAuths));
      
      console.log(`[MediRecX Storage] ✅ 授权已保存: ${auth.id}`);
      return true;
    } catch (error) {
      console.error("[MediRecX Storage] ❌ 保存授权失败:", error);
      return false;
    }
  }, [authorizations, storage]);

  /**
   * 获取用户的医疗记录
   */
  const getUserRecords = useCallback((userAddress: string, role: 'patient' | 'doctor') => {
    if (role === 'patient') {
      return records.filter(record => 
        record.patientAddress.toLowerCase() === userAddress.toLowerCase()
      );
    } else {
      return records.filter(record => 
        record.doctorAddress.toLowerCase() === userAddress.toLowerCase()
      );
    }
  }, [records]);

  /**
   * 获取用户的授权信息
   */
  const getUserAuthorizations = useCallback((userAddress: string, role: 'patient' | 'doctor') => {
    if (role === 'patient') {
      return authorizations.filter(auth => 
        auth.patientAddress.toLowerCase() === userAddress.toLowerCase()
      );
    } else {
      return authorizations.filter(auth => 
        auth.doctorAddress.toLowerCase() === userAddress.toLowerCase()
      );
    }
  }, [authorizations]);

  /**
   * 检查医生是否有权限查看患者记录
   */
  const checkDoctorPermission = useCallback((doctorAddress: string, patientAddress: string): boolean => {
    const auth = authorizations.find(auth => 
      auth.doctorAddress.toLowerCase() === doctorAddress.toLowerCase() &&
      auth.patientAddress.toLowerCase() === patientAddress.toLowerCase() &&
      auth.isActive &&
      new Date(auth.expiresAt) > new Date()
    );
    
    return Boolean(auth);
  }, [authorizations]);

  /**
   * 获取统计数据
   */
  const getAnalytics = useCallback((userAddress: string, role: 'patient' | 'doctor') => {
    const userRecords = getUserRecords(userAddress, role);
    const userAuths = getUserAuthorizations(userAddress, role);

    // 记录类型统计
    const typeStats = userRecords.reduce((acc, record) => {
      acc[record.recordType] = (acc[record.recordType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 严重程度统计
    const severityStats = {
      mild: userRecords.filter(r => r.severity <= 3).length,
      moderate: userRecords.filter(r => r.severity >= 4 && r.severity <= 6).length,
      severe: userRecords.filter(r => r.severity >= 7 && r.severity <= 8).length,
      critical: userRecords.filter(r => r.severity >= 9).length,
    };

    // 时间趋势
    const monthlyStats = userRecords.reduce((acc, record) => {
      const month = new Date(record.timestamp).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRecords: userRecords.length,
      totalAuthorizations: userAuths.length,
      activeAuthorizations: userAuths.filter(a => a.isActive && new Date(a.expiresAt) > new Date()).length,
      onChainRecords: userRecords.filter(r => r.isOnChain).length,
      typeStats,
      severityStats,
      monthlyStats,
      averageSeverity: userRecords.length > 0 
        ? Math.round(userRecords.reduce((sum, r) => sum + r.severity, 0) / userRecords.length * 10) / 10
        : 0,
    };
  }, [getUserRecords, getUserAuthorizations]);

  /**
   * 清除所有数据
   */
  const clearAllData = useCallback(async () => {
    try {
      await storage.clear();
      setRecords([]);
      setAuthorizations([]);
      console.log("[MediRecX Storage] 🗑️ 所有数据已清除");
    } catch (error) {
      console.error("[MediRecX Storage] ❌ 清除数据失败:", error);
    }
  }, [storage]);

  // 初始化时加载数据
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return {
    // 数据
    records,
    authorizations,
    isLoading,
    
    // 操作方法
    saveRecord,
    updateRecord,
    saveAuthorization,
    getUserRecords,
    getUserAuthorizations,
    checkDoctorPermission,
    getAnalytics,
    loadRecords,
    clearAllData,
  };
};
