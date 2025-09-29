"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  FileText, 
  Shield, 
  Eye, 
  EyeOff,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Loader2
} from "lucide-react";

import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";
import { useMedicalRecord } from "@/hooks/useMedicalRecord";
import { useMedicalRecordDecryption } from "@/hooks/useMedicalRecordDecryption";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMedicalRecordStorage } from "@/hooks/useMedicalRecordStorage";
import { AuthorizationSection } from "./AuthorizationSection";
import { MEDICAL_RECORD_TYPE_NAMES, SEVERITY_LEVELS } from "@/fhevm/internal/constants";
import { useTranslation } from "@/hooks/useTranslation";

interface PatientRecord {
  id: string;
  type: string;
  severity: number;
  doctor: string;
  timestamp: string;
  isDecrypted: boolean;
  decryptedData?: any;
}

export const PatientDashboard = () => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'permissions' | 'analytics'>('overview');
  const [myRecords, setMyRecords] = useState<PatientRecord[]>([]);
  const [authorizedDoctors, setAuthorizedDoctors] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  
  // Authorization form state
  const [authForm, setAuthForm] = useState({
    doctorAddress: "",
    authorizationDays: 30
  });

  // Authorization management state
  const [isAuthorizingDoctor, setIsAuthorizingDoctor] = useState(false);
  const [doctorAuthorizationList, setDoctorAuthorizationList] = useState<{
    address: string;
    name: string;
    authorizedAt: string;
    expiresAt: string;
    isActive: boolean;
  }[]>([]);

  // MetaMask和FHEVM集成
  const { provider, chainId, accounts, isConnected, connect, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const medicalRecord = useMedicalRecord({ instance: fhevmInstance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, userAddress: accounts?.[0] });
  
  // 解密功能
  const { storage } = useInMemoryStorage();
  const decryption = useMedicalRecordDecryption({
    instance: fhevmInstance,
    ethersSigner,
    contractAddress: medicalRecord.contractAddress,
    storage
  });
  
  // 记录存储管理
  const recordStorage = useMedicalRecordStorage();

  // 加载患者的真实医疗记录（从合约获取）
  useEffect(() => {
    if (isConnected && accounts?.[0] && medicalRecord.contractAddress && ethersReadonlyProvider) {
      console.log(`[患者控制台] 🚀 触发记录加载...`);
      // 添加延迟确保所有依赖都已就绪
      const timer = setTimeout(() => {
        loadRealPatientRecords();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      console.log(`[患者控制台] ⏳ 等待环境就绪...`);
      console.log(`  连接状态: ${isConnected}`);
      console.log(`  账户: ${accounts?.[0] ? '✅' : '❌'}`);
      console.log(`  合约地址: ${medicalRecord.contractAddress ? '✅' : '❌'}`);
      console.log(`  只读Provider: ${ethersReadonlyProvider ? '✅' : '❌'}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, accounts?.[0], medicalRecord.contractAddress, ethersReadonlyProvider]);

  // Load real records from contract (improved version with error handling and fallback)
  const loadRealPatientRecords = async () => {
    console.log(`[Patient Portal] 🔍 Starting to load patient records...`);
    console.log(`[Patient Portal] 📋 Contract Address: ${medicalRecord.contractAddress}`);
    console.log(`[Patient Portal] 🔗 Readonly Provider: ${ethersReadonlyProvider ? '✅ Set' : '❌ Not Set'}`);

    if (!medicalRecord.contractAddress || !ethersReadonlyProvider) {
      console.log(`[患者控制台] ⚠️ 环境未就绪，使用fallback记录`);
      setMyRecords([
        {
          id: "1",
              type: "🔐 Please add medical records first",
              severity: 0,
              doctor: "System",
              timestamp: "No records yet",
          isDecrypted: false
        }
      ]);
      return;
    }

    try {
      const { ethers } = await import("ethers");
      const { MedicalRecordABI } = await import("@/abi/MedicalRecordABI");
      
      const contract = new ethers.Contract(
        medicalRecord.contractAddress,
        MedicalRecordABI.abi,
        ethersReadonlyProvider
      );

      console.log(`[患者控制台] 📊 检查合约总记录数...`);
      
      // 首先检查合约是否可调用
      try {
        const totalRecords = await contract.getTotalRecords();
        console.log(`[患者控制台] 📊 总记录数: ${totalRecords}`);
      } catch (totalError) {
        console.log(`[患者控制台] ⚠️ 总记录数调用失败，可能是合约版本问题`);
      }

      // 扫描真实记录
      console.log(`[患者控制台] 🔍 扫描合约记录 1-5...`);
      const realRecords: PatientRecord[] = [];
      
      for (let i = 1; i <= 5; i++) {
        try {
          const record = await contract.getMedicalRecord(i);
          console.log(`[患者控制台] 📋 记录 ${i} 原始数据:`, record);
          
          // 检查记录是否有效（任何非零字段都表示记录存在）
          const hasValidData = record.severity !== ethers.ZeroHash || 
                               record.recordType !== ethers.ZeroHash ||
                               record.timestamp !== ethers.ZeroHash ||
                               record.isActive !== ethers.ZeroHash;
          
          console.log(`[患者控制台] 🔍 记录 ${i} 有效性: ${hasValidData ? '✅ 有效' : '❌ 无效'}`);
          
          if (hasValidData) {
            realRecords.push({
              id: i.toString(),
              type: "📋 加密记录（需解密查看）",
              severity: 0,
              doctor: `Dr.${accounts?.[0]?.slice(-4) || 'Unknown'}`,
              timestamp: "🔐 加密状态",
              isDecrypted: false,
              decryptedData: undefined
            });
          }
        } catch (recordError) {
          console.log(`[患者控制台] ℹ️ 记录 ${i} 查询失败: ${recordError instanceof Error ? recordError.message : String(recordError)}`);
        }
      }

      console.log(`[患者控制台] 📊 扫描完成，找到 ${realRecords.length} 条有效记录`);

      if (realRecords.length > 0) {
        setMyRecords(realRecords);
        setAuthorizedDoctors([`Dr.${accounts?.[0]?.slice(-4) || 'Unknown'}`]);
        console.log(`[患者控制台] ✅ 成功加载 ${realRecords.length} 条真实记录`);
      } else {
        // 没有找到记录，显示提示
        setMyRecords([
          {
            id: "0",
              type: "📝 No medical records yet",
              severity: 0,
              doctor: "System",
              timestamp: "Please add medical records first",
            isDecrypted: true,
            decryptedData: "You don't have any medical records yet. Please use the FHEVM test page or doctor interface to add records."
          }
        ]);
        console.log(`[患者控制台] ℹ️ 未找到有效记录，显示提示信息`);
      }
      
    } catch (error) {
      console.error(`[患者控制台] ❌ 加载记录过程失败:`, error);
      
      // 显示错误状态记录
      setMyRecords([
        {
          id: "error",
          type: "❌ Load Failed",
          severity: 0,
          doctor: "System Error",
          timestamp: new Date().toLocaleString(),
          isDecrypted: true,
          decryptedData: `Record loading failed: ${error instanceof Error ? error.message : String(error)}\n\nSuggestions:\n1. Check if the contract is properly deployed\n2. Confirm network connection is normal\n3. Try refreshing the page`
        }
      ]);
    }
  };

  // 监听授权事件
  useEffect(() => {
    const handleDoctorAuthorized = (event: any) => {
      console.log('[Patient Portal] 🔐 Doctor authorization detected:', event.detail);
      
      // Add to authorization list
      const newAuth = {
        address: event.detail.doctorAddress,
        name: `Dr. ${event.detail.doctorAddress.slice(-4)}`,
        authorizedAt: new Date().toLocaleDateString(),
        expiresAt: new Date(event.detail.expirationTime * 1000).toLocaleDateString(),
        isActive: true
      };
      
      setDoctorAuthorizationList(prev => [...prev, newAuth]);
      setAuthorizedDoctors(prev => [...prev, newAuth.name]);
    };

    const handleDoctorDeauthorized = (event: any) => {
      console.log('[Patient Portal] 🚫 Doctor deauthorization detected:', event.detail);
      
      // Remove from authorization list
      setDoctorAuthorizationList(prev => 
        prev.map(auth => 
          auth.address === event.detail.doctorAddress 
            ? { ...auth, isActive: false }
            : auth
        )
      );
    };

    // 监听记录添加事件，刷新记录列表
    const handleRecordAdded = (event: any) => {
      console.log('[患者控制台] 📝 监听到新记录添加，刷新列表...');
      setTimeout(() => {
        loadRealPatientRecords();
      }, 3000);
    };

    window.addEventListener('doctorAuthorized', handleDoctorAuthorized);
    window.addEventListener('doctorDeauthorized', handleDoctorDeauthorized);
    window.addEventListener('medicalRecordAdded', handleRecordAdded);
    
    return () => {
      window.removeEventListener('doctorAuthorized', handleDoctorAuthorized);
      window.removeEventListener('doctorDeauthorized', handleDoctorDeauthorized);
      window.removeEventListener('medicalRecordAdded', handleRecordAdded);
    };
  }, [recordStorage]);

  // Handle doctor authorization
  const handleAuthorizeDoctorAccess = async () => {
    if (!authForm.doctorAddress.trim()) {
      alert('Please enter a doctor address');
      return;
    }

    // Basic address validation
    if (authForm.doctorAddress.length < 10 || !authForm.doctorAddress.startsWith('0x')) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    setIsAuthorizingDoctor(true);
    
    try {
      await medicalRecord.authorizeDoctorAccess({
        doctorAddress: authForm.doctorAddress,
        expirationDays: authForm.authorizationDays
      });
      
      // Reset form
      setAuthForm({
        doctorAddress: "",
        authorizationDays: 30
      });
      
      alert('Doctor authorization successful! The doctor now has access to your medical records.');
      
    } catch (error) {
      console.error('Authorization failed:', error);
      alert(`Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAuthorizingDoctor(false);
    }
  };

  // Handle doctor deauthorization
  const handleRevokeDoctorAccess = async (doctorAddress: string) => {
    if (!confirm(`Are you sure you want to revoke access for Dr. ${doctorAddress.slice(-4)}?`)) {
      return;
    }

    try {
      await medicalRecord.revokeDoctorAccess({
        doctorAddress: doctorAddress
      });
      
      alert('Doctor access has been successfully revoked.');
      
    } catch (error) {
      console.error('Revocation failed:', error);
      alert(`Revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const refreshRecords = () => {
    loadRealPatientRecords();
  };

  const tabButtonClass = (isActive: boolean) => 
    `px-6 py-3 rounded-lg font-medium transition-colors ${
      isActive 
        ? 'bg-medical-primary text-white' 
        : 'text-gray-600 hover:text-medical-primary hover:bg-gray-100'
    }`;

  const cardClass = "bg-white rounded-xl shadow-card p-6 border border-gray-100";

  // 如果未连接MetaMask，显示连接界面
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-medical-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{t('patient.walletConnect.title')}</h2>
            <p className="text-sm text-gray-600">{t('patient.walletConnect.subtitle')}</p>
          </div>
          <p className="text-gray-600 mb-8">
            {t('patient.walletConnect.description')}
          </p>
          <button
            className="medical-button"
            onClick={connect}
          >
            <Shield className="w-5 h-5 mr-2" />
            Connect MetaMask Wallet
          </button>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <div className="space-y-1 mb-2">
              <h4 className="font-medium text-blue-800">{t('patient.walletConnect.features.title')}</h4>
              <p className="text-xs text-blue-600">{t('patient.walletConnect.features.titleEn')}</p>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {t('patient.walletConnect.features.viewRecords')}</li>
              <li>• {t('patient.walletConnect.features.authorizeDoctors')}</li>
              <li>• {t('patient.walletConnect.features.managePermissions')}</li>
              <li>• {t('patient.walletConnect.features.viewAnalytics')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 患者功能区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 患者信息头部 */}
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
                <p className="text-sm text-gray-500">
                  {accounts?.[0] ? `${accounts[0].slice(0, 8)}...${accounts[0].slice(-6)}` : "Not Connected"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">My Medical Records</p>
                <p className="text-lg font-semibold text-medical-primary">{myRecords.length} Records</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Authorized Doctors</p>
                <p className="text-lg font-semibold text-medical-secondary">{authorizedDoctors.length} Doctors</p>
              </div>
            </div>
          </div>
          
          {/* 功能标签 */}
          <div className="flex space-x-1 border-b">
            <button
              className={tabButtonClass(activeTab === 'overview')}
              onClick={() => setActiveTab('overview')}
            >
              <Activity className="w-4 h-4 mr-2 inline" />
              Overview
            </button>
            <button
              className={tabButtonClass(activeTab === 'records')}
              onClick={() => setActiveTab('records')}
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              My Records
            </button>
            <button
              className={tabButtonClass(activeTab === 'permissions')}
              onClick={() => setActiveTab('permissions')}
            >
              <Shield className="w-4 h-4 mr-2 inline" />
              Permissions
            </button>
            <button
              className={tabButtonClass(activeTab === 'analytics')}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2 inline" />
              Health Analytics
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 概览标签 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 健康状态卡片 */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{t('patient.overview.healthStatus')}</h3>
                    <p className="text-xs text-gray-500">{t('patient.overview.healthStatusEn')}</p>
                  </div>
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patient.overview.totalRecords')}</span>
                    <span className="font-semibold">{myRecords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patient.overview.recentRecords')}</span>
                    <span className="font-semibold">2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patient.overview.authorizedDoctors')}</span>
                    <span className="font-semibold">{authorizedDoctors.length} doctors</span>
                  </div>
                </div>
              </div>

              {/* 隐私状态 */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{t('patient.overview.privacyStatus')}</h3>
                    <p className="text-xs text-gray-500">{t('patient.overview.privacyStatusEn')}</p>
                  </div>
                  <Shield className="w-6 h-6 text-medical-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t('patient.overview.encryptedStorage')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t('patient.overview.permissionControl')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t('patient.overview.fhevmProtection')}</span>
                  </div>
                </div>
              </div>

              {/* 区块链状态 */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{t('patient.overview.blockchainStatus')}</h3>
                    <p className="text-xs text-gray-500">{t('patient.overview.blockchainStatusEn')}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${fhevmStatus === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patient.overview.network')}</span>
                    <span className="font-semibold">{chainId === 31337 ? t('patient.overview.mockMode') : t('patient.overview.productionMode')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patient.overview.fhevm')}</span>
                    <span className="font-semibold">{fhevmStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patient.overview.contract')}</span>
                    <span className="font-semibold">{medicalRecord.isDeployed ? t('patient.overview.deployed') : t('patient.overview.notDeployed')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 最近记录 */}
            <div className={cardClass}>
              <div className="space-y-1 mb-4">
                <h3 className="font-semibold text-lg">{t('patient.records.recentMedicalRecords')}</h3>
                <p className="text-xs text-gray-500">{t('patient.records.recentMedicalRecordsEn')}</p>
              </div>
              <div className="space-y-3">
                {myRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-medical-primary" />
                      <div>
                        <p className="font-medium">{record.type}</p>
                        <p className="text-sm text-gray-500">{record.doctor} • {record.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${SEVERITY_LEVELS[record.severity as keyof typeof SEVERITY_LEVELS]?.bgColor} ${SEVERITY_LEVELS[record.severity as keyof typeof SEVERITY_LEVELS]?.textColor}`}>
                        {SEVERITY_LEVELS[record.severity as keyof typeof SEVERITY_LEVELS]?.name}
                      </span>
                      {record.isDecrypted ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 我的记录标签 */}
        {activeTab === 'records' && (
            <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">我的医疗记录</h2>
              <div className="flex space-x-3">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  onClick={loadRealPatientRecords}
                >
                  🔄 刷新记录
                </button>
                <button className="medical-button">
                  <FileText className="w-4 h-4 mr-2" />
                  导出记录
                </button>
              </div>
            </div>
            
            {/* 记录加载状态提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-800">📋 记录加载状态</h4>
                  <p className="text-blue-700 text-sm">
                    合约地址: {medicalRecord.contractAddress || '未设置'}
                  </p>
                  <p className="text-blue-700 text-sm">
                    记录数量: {myRecords.length} 条
                  </p>
                </div>
                <div className="text-right text-sm text-blue-600">
                  <p>当前账户: {accounts?.[0]?.slice(0, 10)}...</p>
                  <p>环境: {chainId === 31337 ? 'Mock模式' : '生产模式'}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {myRecords.map((record) => (
                <div key={record.id} className={`${cardClass} ${selectedRecord === record.id ? 'ring-2 ring-medical-primary' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-medical-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">{record.type}</h3>
                        <p className="text-sm text-gray-500">记录ID: {record.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${SEVERITY_LEVELS[record.severity as keyof typeof SEVERITY_LEVELS]?.bgColor} ${SEVERITY_LEVELS[record.severity as keyof typeof SEVERITY_LEVELS]?.textColor}`}>
                        {SEVERITY_LEVELS[record.severity as keyof typeof SEVERITY_LEVELS]?.name} ({record.severity})
                      </span>
                      <button 
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          record.isDecrypted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600 hover:bg-medical-primary hover:text-white'
                        }`}
                        onClick={async () => {
                          setSelectedRecord(record.id);
                          
                          if (!record.isDecrypted) {
                            // 使用真正的FHEVM解密
                            console.log(`[患者控制台] 🔓 解密记录: ${record.id}`);
                            
                            // 直接使用记录ID（现在是真实的合约ID）
                            const recordIdNumber = parseInt(record.id) || 0;
                            console.log(`[患者控制台] 📋 真实记录ID: ${recordIdNumber}`);
                            
                            const decryptedData = await decryption.decryptRecord(recordIdNumber, record.id);
                            
                            if (decryptedData) {
                              // 更新记录状态，显示完整的医疗记录详情
                              setMyRecords(prev => prev.map(r => 
                                r.id === record.id 
                                  ? { 
                                      ...r, 
                                      isDecrypted: true, 
                                      decryptedData: decryptedData.medicalDetails || `🏥 我的医疗记录基础信息:

📋 记录类型: ${r.type}
⚕️ 严重程度: ${decryptedData.severity}/10 (${SEVERITY_LEVELS[decryptedData.severity as keyof typeof SEVERITY_LEVELS]?.name})
👨‍⚕️ 主治医生: ${r.doctor}
📅 记录时间: ${new Date(decryptedData.timestamp * 1000).toLocaleString()}
🔐 记录状态: ${decryptedData.isActive ? '✅ 有效' : '❌ 无效'}

💡 建议：定期复查，关注健康指标变化
🛡️  隐私保护：本记录通过FHEVM完全同态加密技术保护，只有您授权的医生才能查看

⚠️ 注意：医疗详情文本解密功能需要先添加带详情的记录`
                                    }
                                  : r
                              ));
                            }
                          }
                        }}
                      >
                        {record.isDecrypted ? (
                          <>
                            <Eye className="w-4 h-4 mr-1 inline" />
                            已解密
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1 inline" />
                            解密查看
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">主治医生:</span>
                      <span className="ml-2 font-medium">{record.doctor}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">记录时间:</span>
                      <span className="ml-2 font-medium">{record.timestamp}</span>
                    </div>
                  </div>

                  {record.isDecrypted && record.decryptedData && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">🔓 解密详情</h4>
                      <pre className="text-blue-700 text-sm whitespace-pre-line">{record.decryptedData}</pre>
                    </div>
                  )}
                  
                  {/* 显示解密进度 */}
                  {decryption.isDecrypting && selectedRecord === record.id && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                        <span className="text-yellow-800 font-medium">FHEVM解密进行中...</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-2">{decryption.decryptionMessage}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permission Management */}
        {activeTab === 'permissions' && (
          <AuthorizationSection
            authForm={authForm}
            setAuthForm={setAuthForm}
            onAuthorizeDoctorAccess={handleAuthorizeDoctorAccess}
            onRevokeDoctorAccess={handleRevokeDoctorAccess}
            isAuthorizingDoctor={isAuthorizingDoctor}
            doctorAuthorizationList={doctorAuthorizationList}
          />
        )}

        {/* 健康分析标签 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">健康数据分析</h2>
            
            {/* 记录统计 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(MEDICAL_RECORD_TYPE_NAMES).map(([key, name]) => {
                const count = myRecords.filter(r => r.type === name).length;
                return (
                  <div key={key} className={cardClass}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-medical-primary">{count}</div>
                      <div className="text-sm text-gray-600">{name}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 严重程度分布 */}
            <div className={cardClass}>
              <h3 className="font-semibold text-lg mb-4">严重程度分布</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 3, 5, 7, 9].map(level => {
                  const count = myRecords.filter(r => r.severity >= level && r.severity <= level + 1).length;
                  const severity = SEVERITY_LEVELS[level as keyof typeof SEVERITY_LEVELS];
                  return (
                    <div key={level} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${severity?.bgColor}`}>
                        <span className={`font-bold ${severity?.textColor}`}>{count}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{severity?.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 时间线图表 */}
            <div className={cardClass}>
              <h3 className="font-semibold text-lg mb-4">记录时间线</h3>
              <div className="space-y-4">
                {myRecords.map((record, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-medical-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{record.type}</span>
                        <span className="text-sm text-gray-500">{record.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600">{record.doctor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 系统状态（固定底部显示，不再自动刷新） */}
        <div className={`${cardClass} mt-8`}>
          <div className="space-y-1 mb-4">
            <h3 className="font-semibold text-lg">
              <Clock className="inline w-5 h-5 mr-2" />
              {t('patient.system.systemStatus')}
            </h3>
            <p className="text-xs text-gray-500">{t('patient.system.systemStatusEn')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            {medicalRecord.message || "System ready, waiting for operation..."}
          </div>
          {/* 手动刷新按钮 */}
          <button
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            onClick={() => medicalRecord.getTotalRecords()}
          >
            {t('patient.system.manualRefresh')}
          </button>
        </div>

      </div>
    </div>
  );
};
