"use client";

import { useState } from "react";
import { 
  FileText,
  Shield, 
  Stethoscope,
  Plus,
  Eye,
  Clock,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Lock
} from "lucide-react";

import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";
import { useMedicalRecord } from "@/hooks/useMedicalRecord";
import { MEDICAL_RECORD_TYPES, MEDICAL_RECORD_TYPE_NAMES, SEVERITY_LEVELS } from "@/fhevm/internal/constants";

/**
 * MediRecX医疗记录演示组件
 */
export const MedicalRecordDemo = () => {
  // 表单状态
  const [patientAddress, setPatientAddress] = useState<string>("");
  const [recordType, setRecordType] = useState<keyof typeof MEDICAL_RECORD_TYPES>("DIAGNOSIS");
  const [severity, setSeverity] = useState<number>(5);
  const [doctorAddress, setDoctorAddress] = useState<string>("");
  const [authorizationDays, setAuthorizationDays] = useState<number>(30);

  // MetaMask集成
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  // FHEVM实例
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // 医疗记录管理
  const medicalRecord = useMedicalRecord({
    instance: fhevmInstance,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    userAddress: accounts?.[0],
  });

  // 样式定义
  const buttonClass = "medical-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputClass = "medical-input w-full";
  const cardClass = "medical-card";
  const titleClass = "font-semibold text-medical-primary text-lg mb-4";

  // 如果未连接MetaMask
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-medical-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">连接您的钱包</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            要使用MediRecX医疗记录管理系统，请先连接您的MetaMask钱包
          </p>
          <button
            className={buttonClass}
            onClick={connect}
          >
            <Shield className="w-5 h-5" />
            <span>连接 MetaMask</span>
          </button>
        </div>
      </div>
    );
  }

  // 如果合约未部署
  if (medicalRecord.isDeployed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">合约未部署</h2>
          <p className="text-gray-600 mb-6">
            MedicalRecord合约未在当前网络（链ID: {chainId}）上部署。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm">
            <p className="font-medium text-blue-800 mb-2">部署步骤：</p>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>启动Hardhat节点: <code>npx hardhat node</code></li>
              <li>部署合约: <code>npx hardhat run deploy/deploy.ts --network localhost</code></li>
              <li>更新ABI: <code>npm run genabi</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏥 MediRecX 演示系统
          </h1>
          <p className="text-lg text-gray-600">
            基于FHEVM的完全加密医疗记录管理演示
          </p>
        </div>

        {/* 状态信息区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* 连接状态 */}
          <div className={cardClass}>
            <h3 className={titleClass}>
              <Users className="inline w-5 h-5 mr-2" />
              连接状态
            </h3>
            {printProperty("链ID", chainId)}
            {printProperty("账户地址", accounts?.[0] ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` : "未连接")}
            {printProperty("签名者", ethersSigner ? ethersSigner.address.slice(0, 10) + "..." : "未连接")}
          </div>

          {/* FHEVM状态 */}
          <div className={cardClass}>
            <h3 className={titleClass}>
              <Shield className="inline w-5 h-5 mr-2" />
              FHEVM状态
            </h3>
            {printProperty("实例状态", fhevmInstance ? "已就绪" : "未就绪")}
            {printProperty("连接状态", fhevmStatus)}
            {printProperty("错误信息", fhevmError?.message || "无错误")}
          </div>

          {/* 合约状态 */}
          <div className={cardClass}>
            <h3 className={titleClass}>
              <FileText className="inline w-5 h-5 mr-2" />
              合约状态
            </h3>
            {printProperty("合约地址", medicalRecord.contractAddress || "未部署")}
            {printProperty("是否部署", medicalRecord.isDeployed)}
            {printProperty("总记录数", medicalRecord.totalRecords || "未获取")}
          </div>
        </div>

        {/* 操作区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* 医生操作：添加医疗记录 */}
          <div className={cardClass}>
            <h3 className={titleClass}>
              <Stethoscope className="inline w-5 h-5 mr-2" />
              医生功能：添加医疗记录
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  患者地址
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="0x..."
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  记录类型
                </label>
                <select
                  className={inputClass}
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as keyof typeof MEDICAL_RECORD_TYPES)}
                >
                  {Object.entries(MEDICAL_RECORD_TYPE_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  严重程度: {severity} ({SEVERITY_LEVELS[severity as keyof typeof SEVERITY_LEVELS]?.name})
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  className="w-full"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>轻微 (1)</span>
                  <span>危急 (10)</span>
                </div>
              </div>
              
              <button
                className={buttonClass}
                disabled={!medicalRecord.canInteract || medicalRecord.isSubmitting}
                onClick={() => medicalRecord.addMedicalRecord({
                  patientAddress,
                  recordType,
                  severity
                })}
              >
                {medicalRecord.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>添加中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>添加医疗记录</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 患者操作：授权医生访问 */}
          <div className={cardClass}>
            <h3 className={titleClass}>
              <Users className="inline w-5 h-5 mr-2" />
              患者功能：授权医生访问
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  医生地址
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="0x..."
                  value={doctorAddress}
                  onChange={(e) => setDoctorAddress(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授权天数: {authorizationDays} 天
                </label>
                <input
                  type="range"
                  min="1"
                  max="365"
                  className="w-full"
                  value={authorizationDays}
                  onChange={(e) => setAuthorizationDays(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1天</span>
                  <span>365天</span>
                </div>
              </div>
              
              <button
                className={buttonClass}
                disabled={!medicalRecord.canInteract || medicalRecord.isSubmitting}
                onClick={() => medicalRecord.authorizeDoctorAccess({
                  doctorAddress,
                  expirationDays: authorizationDays
                })}
              >
                {medicalRecord.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>授权中...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>授权访问</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 工具操作区域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          <button
            className={buttonClass}
            disabled={!medicalRecord.canInteract}
            onClick={medicalRecord.getTotalRecords}
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新总记录数</span>
          </button>
          
          <button
            className={buttonClass}
            disabled={!medicalRecord.canInteract}
            onClick={medicalRecord.generateRandomRecordId}
          >
            <Activity className="w-4 h-4" />
            <span>生成随机ID</span>
          </button>
          
          <button
            className="bg-medical-secondary text-white px-4 py-2 rounded-lg hover:bg-medical-secondary/90 transition-colors flex items-center space-x-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新页面</span>
          </button>
        </div>

        {/* 消息显示区域 */}
        <div className={cardClass}>
          <h3 className={titleClass}>
            <Clock className="inline w-5 h-5 mr-2" />
            系统消息
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            {medicalRecord.message || "等待操作..."}
          </div>
        </div>

      </div>
    </div>
  );
};

// 辅助函数：格式化属性显示
function printProperty(name: string, value: unknown) {
  let displayValue: string;

  if (typeof value === "boolean") {
    return (
      <p className="text-sm mb-2">
        <span className="text-gray-600">{name}:</span>{" "}
        <span className={`font-medium ${value ? "text-green-600" : "text-red-600"}`}>
          {value ? "✅ 是" : "❌ 否"}
        </span>
      </p>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    displayValue = String(value);
  } else if (typeof value === "bigint") {
    displayValue = String(value);
  } else if (value === null) {
    displayValue = "null";
  } else if (value === undefined) {
    displayValue = "undefined";
  } else if (value instanceof Error) {
    displayValue = value.message;
  } else {
    displayValue = JSON.stringify(value);
  }

  return (
    <p className="text-sm mb-2">
      <span className="text-gray-600">{name}:</span>{" "}
      <span className="font-medium text-gray-900">{displayValue}</span>
    </p>
  );
}
