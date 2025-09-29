"use client";

import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  FileText, 
  Users, 
  Plus,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Loader2,
  UserCheck,
  Shield
} from "lucide-react";

import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";
import { useMedicalRecord } from "@/hooks/useMedicalRecord";
import { useMedicalRecordDecryption } from "@/hooks/useMedicalRecordDecryption";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMedicalRecordStorage } from "@/hooks/useMedicalRecordStorage";
import { MEDICAL_RECORD_TYPES, MEDICAL_RECORD_TYPE_NAMES, SEVERITY_LEVELS } from "@/fhevm/internal/constants";
import { useTranslation } from "@/hooks/useTranslation";

interface AuthorizedPatient {
  address: string;
  name: string;
  authorizedAt: string;
  expiresAt: string;
  recordCount: number;
}

interface PatientRecord {
  id: string;
  patientAddress: string;
  patientName: string;
  type: string;
  severity: number;
  timestamp: string;
  isDecrypted: boolean;
  decryptedData?: any;
}

export const DoctorDashboard = () => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'add-record' | 'view-records' | 'patients' | 'analytics'>('overview');
  const [authorizedPatients, setAuthorizedPatients] = useState<AuthorizedPatient[]>([]);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  
  // Form state
  const [formData, setFormData] = useState({
    patientAddress: "",
    recordType: "DIAGNOSIS" as keyof typeof MEDICAL_RECORD_TYPES,
    severity: 5,
    notes: ""
  });

  // MetaMask and FHEVM integration
  const { provider, chainId, accounts, isConnected, connect, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const medicalRecord = useMedicalRecord({ instance: fhevmInstance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, userAddress: accounts?.[0] });
  
  // Decryption functionality
  const { storage } = useInMemoryStorage();
  const decryption = useMedicalRecordDecryption({
    instance: fhevmInstance,
    ethersSigner,
    contractAddress: medicalRecord.contractAddress,
    storage
  });
  
  // Record storage management
  const recordStorage = useMedicalRecordStorage();

  // Load real medical records (from contract)
  useEffect(() => {
    if (isConnected && accounts?.[0] && medicalRecord.contractAddress) {
      loadRealDoctorRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, accounts?.[0], medicalRecord.contractAddress]);

  // Load real records from contract
  const loadRealDoctorRecords = async () => {
    if (!medicalRecord.contractAddress || !ethersReadonlyProvider) return;

    try {
      console.log(`[Doctor Dashboard] 🔍 Loading real contract records...`);
      
      const { ethers } = await import("ethers");
      const { MedicalRecordABI } = await import("@/abi/MedicalRecordABI");
      
      const contract = new ethers.Contract(
        medicalRecord.contractAddress,
        MedicalRecordABI.abi,
        ethersReadonlyProvider
      );

      // Try to get records 1-10
      const realRecords: PatientRecord[] = [];
      
      for (let i = 1; i <= 10; i++) {
        try {
          const record = await contract.getMedicalRecord(i);
          
          // Check if record exists
          const hasValidData = record.severity !== ethers.ZeroHash || 
                               record.recordType !== ethers.ZeroHash ||
                               record.timestamp !== ethers.ZeroHash;
          
          if (hasValidData) {
            console.log(`[Doctor Dashboard] ✅ Found record ${i}:`, record);
            
            realRecords.push({
              id: i.toString(), // Real contract record ID
              patientAddress: "0xcf0dff12a8201c030d44aa656b7ad8eaa6c852d9", // Assumed patient address
              patientName: `Patient-${i}`,
              type: "Needs decryption to view", // Encrypted state
              severity: 0, // Encrypted state
              timestamp: "Needs decryption to view", // Encrypted state
              isDecrypted: false
            });
          }
        } catch (error) {
          // Record doesn't exist, continue trying the next one
        }
      }

      console.log(`[医生工作台] 📋 找到 ${realRecords.length} 条真实记录`);
      setPatientRecords(realRecords);

      // 设置授权患者
      if (realRecords.length > 0) {
        setAuthorizedPatients([
          {
            address: "0xcf0dff12a8201c030d44aa656b7ad8eaa6c852d9",
            name: "患者-52d9",
            authorizedAt: new Date().toLocaleDateString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            recordCount: realRecords.length
          }
        ]);
      }
      
    } catch (error) {
      console.error(`[医生工作台] ❌ 加载真实记录失败:`, error);
    }
  };

  // 监听记录添加事件，并刷新真实记录列表
  useEffect(() => {
    const handleRecordAdded = (event: any) => {
      const recordData = event.detail;
      console.log('[医生工作台] 📝 监听到新记录添加:', recordData);
      
      // 保存到本地存储
      recordStorage.saveRecord({
        id: recordData.id,
        patientAddress: recordData.patientAddress,
        doctorAddress: recordData.doctorAddress,
        recordType: recordData.recordType,
        severity: recordData.severity,
        timestamp: recordData.timestamp,
        txHash: recordData.txHash,
        isOnChain: recordData.isOnChain,
        notes: formData.notes
      });

      // 重置表单
      setFormData({
        patientAddress: "",
        recordType: "DIAGNOSIS",
        severity: 5,
        notes: ""
      });

      // 等待3秒后刷新真实记录列表
      setTimeout(() => {
        console.log('[医生工作台] 🔄 刷新记录列表...');
        loadRealDoctorRecords();
      }, 3000);
    };

    window.addEventListener('medicalRecordAdded', handleRecordAdded);
    return () => window.removeEventListener('medicalRecordAdded', handleRecordAdded);
  }, [recordStorage, formData.notes]);

  const tabButtonClass = (isActive: boolean) => 
    `px-6 py-3 rounded-lg font-medium transition-colors ${
      isActive 
        ? 'bg-medical-secondary text-white' 
        : 'text-gray-600 hover:text-medical-secondary hover:bg-gray-100'
    }`;

  const cardClass = "bg-white rounded-xl shadow-card p-6 border border-gray-100";

  // 如果未连接MetaMask，显示连接界面
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-medical-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{t('doctor.walletConnect.title')}</h2>
            <p className="text-sm text-gray-600">{t('doctor.walletConnect.subtitle')}</p>
          </div>
          <p className="text-gray-600 mb-8">
            {t('doctor.walletConnect.description')}
          </p>
          <button
            className="bg-medical-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-secondary/90 transition-colors flex items-center space-x-2"
            onClick={connect}
          >
            <Shield className="w-5 h-5" />
            <span>Connect MetaMask Wallet</span>
          </button>
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
            <div className="space-y-1 mb-2">
              <h4 className="font-medium text-green-800">{t('doctor.walletConnect.features.title')}</h4>
              <p className="text-xs text-green-600">{t('doctor.walletConnect.features.titleEn')}</p>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• {t('doctor.walletConnect.features.addRecords')}</li>
              <li>• {t('doctor.walletConnect.features.viewRecords')}</li>
              <li>• {t('doctor.walletConnect.features.decryptData')}</li>
              <li>• {t('doctor.walletConnect.features.managePermissions')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 真正的FHEVM解密记录功能
  const decryptRecord = async (recordId: string) => {
    console.log(`[医生工作台] 🔓 开始解密记录: ${recordId}`);
    
    // 直接使用记录ID（现在是真实的合约ID）
    const recordIdNumber = parseInt(recordId) || 0;
    console.log(`[医生工作台] 📋 真实记录ID: ${recordIdNumber}`);
    
    // 使用真正的FHEVM解密流程
    const decryptedData = await decryption.decryptRecord(recordIdNumber, recordId);
    
    if (decryptedData) {
      // 更新本地状态显示完整的解密结果
      setPatientRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              isDecrypted: true, 
              decryptedData: decryptedData.medicalDetails || `🏥 医疗记录基础信息:
              
📋 记录类型: ${record.type}
⚕️ 严重程度: ${decryptedData.severity}/10
👨‍⚕️ 主治医生: ${record.patientName}的医生
📅 记录时间: ${new Date(decryptedData.timestamp * 1000).toLocaleString()}
🔐 加密状态: ${decryptedData.isActive ? '有效' : '无效'}

通过FHEVM完全同态加密技术安全解密，确保患者隐私保护。

⚠️ 医疗详情文本需要使用新的合约版本和完整的加密流程`
            }
          : record
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 医生功能区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 医生信息头部 */}
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-medical-secondary rounded-full flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {accounts?.[0] ? `Dr. ${accounts[0].slice(0, 8)}...${accounts[0].slice(-6)}` : "Not Connected"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Authorized Patients</p>
                <p className="text-lg font-semibold text-medical-secondary">{authorizedPatients.length} Patients</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Managed Records</p>
                <p className="text-lg font-semibold text-medical-primary">{patientRecords.length} Records</p>
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
              className={tabButtonClass(activeTab === 'add-record')}
              onClick={() => setActiveTab('add-record')}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Record
            </button>
            <button 
              className={tabButtonClass(activeTab === 'view-records')}
              onClick={() => setActiveTab('view-records')}
            >
              <Search className="w-4 h-4 mr-2 inline" />
              View Records
            </button>
            <button 
              className={tabButtonClass(activeTab === 'patients')}
              onClick={() => setActiveTab('patients')}
            >
              <Users className="w-4 h-4 mr-2 inline" />
              Patient Management
            </button>
            <button 
              className={tabButtonClass(activeTab === 'analytics')}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2 inline" />
              Data Analytics
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 工作概览 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Today's Work</h3>
                  <Calendar className="w-6 h-6 text-medical-secondary" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records Added</span>
                    <span className="font-semibold">0 records</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records Viewed</span>
                    <span className="font-semibold">0 times</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Authorized Patients</span>
                    <span className="font-semibold">{authorizedPatients.length} patients</span>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">System Status</h3>
                  <div className={`w-3 h-3 rounded-full ${fhevmStatus === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">FHEVM</span>
                    <span className="font-semibold">{fhevmStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract</span>
                    <span className="font-semibold">{medicalRecord.isDeployed ? 'Deployed' : 'Not Deployed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold">{chainId === 31337 ? 'Mock' : 'Production'}</span>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{t('doctor.overview.quickActions')}</h3>
                    <p className="text-xs text-gray-500">{t('doctor.overview.quickActionsEn')}</p>
                  </div>
                  <Plus className="w-6 h-6 text-medical-primary" />
                </div>
                <div className="space-y-3">
                  <button
                    className="w-full medical-button"
                    onClick={() => setActiveTab('add-record')}
                  >
                    {t('doctor.overview.addNewRecord')}
                  </button>
                  <button
                    className="w-full bg-medical-secondary text-white px-4 py-2 rounded-lg hover:bg-medical-secondary/90 transition-colors"
                    onClick={() => setActiveTab('view-records')}
                  >
                    {t('doctor.overview.viewPatientRecords')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 添加记录 */}
        {activeTab === 'add-record' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">{t('doctor.addRecord.addMedicalRecord')}</h2>
              <p className="text-sm text-gray-500">{t('doctor.addRecord.addMedicalRecordEn')}</p>
            </div>
            
            <div className={cardClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('doctor.addRecord.patientAddress')}</label>
                    <input
                      type="text"
                      className="medical-input"
                      placeholder="0x..."
                      value={formData.patientAddress}
                      onChange={(e) => setFormData({...formData, patientAddress: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('doctor.addRecord.recordType')}</label>
                    <select
                      className="medical-input"
                      value={formData.recordType}
                      onChange={(e) => setFormData({...formData, recordType: e.target.value as keyof typeof MEDICAL_RECORD_TYPES})}
                    >
                      {Object.entries(MEDICAL_RECORD_TYPE_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('doctor.addRecord.severityLevel')}: {formData.severity} ({SEVERITY_LEVELS[formData.severity as keyof typeof SEVERITY_LEVELS]?.name})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="w-full"
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>轻微 (1)</span>
                      <span>危急 (10)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('doctor.addRecord.medicalRecordDetails')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="medical-input h-40 resize-none"
                    placeholder={t('doctor.addRecord.placeholder')}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 The real medical text entered here will be encrypted and stored, and the original text will be displayed when decrypted
                  </p>

                  <button
                    className="medical-button w-full mt-4"
                    disabled={!medicalRecord.canInteract || medicalRecord.isSubmitting}
                    onClick={() => medicalRecord.addMedicalRecord({
                      patientAddress: formData.patientAddress,
                      recordType: formData.recordType,
                      severity: formData.severity,
                      medicalDetails: formData.notes // 传入真实的医疗详情文本
                    })}
                  >
                    {medicalRecord.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('doctor.addRecord.adding')}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('doctor.addRecord.addMedicalRecordBtn')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 查看记录 */}
        {activeTab === 'view-records' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">查看患者记录</h2>
              <div className="flex items-center space-x-4">
                <select 
                  className="medical-input"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="">选择患者</option>
                  {authorizedPatients.map((patient) => (
                    <option key={patient.address} value={patient.address}>
                      {patient.name} ({patient.address.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPatient && (
              <div className="space-y-4">
                {patientRecords
                  .filter(record => record.patientAddress === selectedPatient)
                  .map((record) => (
                    <div key={record.id} className={cardClass}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-6 h-6 text-medical-secondary" />
                          <div>
                            <h3 className="font-semibold text-lg">{record.type}</h3>
                            <p className="text-sm text-gray-500">患者: {record.patientName} • {record.timestamp}</p>
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
                                : 'bg-medical-secondary text-white hover:bg-medical-secondary/90'
                            }`}
                            onClick={() => decryptRecord(record.id)}
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

                      {record.isDecrypted && record.decryptedData && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">📋 FHEVM解密成功</h4>
                          <pre className="text-blue-700 text-sm whitespace-pre-line">{record.decryptedData}</pre>
                          <div className="mt-3 flex items-center space-x-4 text-sm text-blue-600">
                            <span>🔐 FHEVM加密验证</span>
                            <span>✅ 授权访问确认</span>
                            <span>⏰ 解密时间: {new Date().toLocaleTimeString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 显示解密状态 */}
                      {decryption.isDecrypting && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                            <span className="text-yellow-800 font-medium">正在解密...</span>
                          </div>
                          <p className="text-yellow-700 text-sm mt-2">{decryption.decryptionMessage}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {!selectedPatient && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择患者查看记录</h3>
                <p className="text-gray-600">请从上方下拉菜单选择已授权的患者</p>
              </div>
            )}
          </div>
        )}

        {/* 患者管理 */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">患者管理</h2>
            
            <div className="grid gap-4">
              {authorizedPatients.map((patient) => (
                <div key={patient.address} className={cardClass}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-medical-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <p className="text-sm text-gray-500">{patient.address}</p>
                        <p className="text-xs text-gray-400">授权时间: {patient.authorizedAt} - {patient.expiresAt}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-medical-primary">{patient.recordCount}</div>
                      <div className="text-sm text-gray-600">医疗记录</div>
                      <button 
                        className="mt-2 px-3 py-1 bg-medical-secondary text-white rounded-lg text-sm hover:bg-medical-secondary/90 transition-colors"
                        onClick={() => {
                          setSelectedPatient(patient.address);
                          setActiveTab('view-records');
                        }}
                      >
                        查看记录
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据分析 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">医疗数据分析</h2>
            
            {/* 记录类型统计 */}
            <div className={cardClass}>
              <h3 className="font-semibold text-lg mb-4">记录类型分布</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(MEDICAL_RECORD_TYPE_NAMES).map(([key, name]) => {
                  const count = patientRecords.filter(r => r.type === name).length;
                  return (
                    <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-medical-secondary">{count}</div>
                      <div className="text-sm text-gray-600">{name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 严重程度趋势 */}
            <div className={cardClass}>
              <h3 className="font-semibold text-lg mb-4">患者严重程度分析</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {patientRecords.filter(r => r.severity <= 3).length}
                  </div>
                  <div className="text-sm text-green-700">轻微病例</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {patientRecords.filter(r => r.severity >= 4 && r.severity <= 6).length}
                  </div>
                  <div className="text-sm text-yellow-700">中等病例</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {patientRecords.filter(r => r.severity >= 7).length}
                  </div>
                  <div className="text-sm text-red-700">严重病例</div>
                </div>
              </div>
            </div>

            {/* 月度统计 */}
            <div className={cardClass}>
              <h3 className="font-semibold text-lg mb-4">本月统计</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-medical-primary">{patientRecords.length}</div>
                  <div className="text-sm text-gray-600">总记录数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-medical-secondary">{authorizedPatients.length}</div>
                  <div className="text-sm text-gray-600">授权患者</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {decryption.decryptedCount}
                  </div>
                  <div className="text-sm text-gray-600">已解密记录</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.round(patientRecords.reduce((sum, r) => sum + r.severity, 0) / patientRecords.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">平均严重度</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 添加记录功能（使用现有的组件逻辑） */}
        {activeTab === 'add-record' && (
          <div className={cardClass}>
            <h3 className="font-semibold text-lg mb-4">加密记录提交</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">🔐 FHEVM加密处理</h4>
              <p className="text-blue-700 text-sm">
                您的医疗记录将通过FHEVM技术进行完全加密，确保患者隐私安全。
                只有获得患者授权的医生才能解密查看记录内容。
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              {medicalRecord.message || "准备添加医疗记录..."}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
