// FHEVM 相关常量定义

export const SDK_CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

// 医疗记录类型枚举
export const MEDICAL_RECORD_TYPES = {
  DIAGNOSIS: 0,     // 诊断
  PRESCRIPTION: 1,  // 处方
  LAB_RESULT: 2,   // 检查结果
  TREATMENT: 3,    // 治疗记录
  SURGERY: 4       // 手术记录
} as const;

// 医疗记录类型名称
export const MEDICAL_RECORD_TYPE_NAMES = {
  [MEDICAL_RECORD_TYPES.DIAGNOSIS]: '诊断',
  [MEDICAL_RECORD_TYPES.PRESCRIPTION]: '处方',
  [MEDICAL_RECORD_TYPES.LAB_RESULT]: '检查结果',
  [MEDICAL_RECORD_TYPES.TREATMENT]: '治疗记录',
  [MEDICAL_RECORD_TYPES.SURGERY]: '手术记录',
} as const;

// 严重程度级别
export const SEVERITY_LEVELS = {
  1: { name: '轻微', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  2: { name: '轻度', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  3: { name: '轻度', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  4: { name: '中等', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  5: { name: '中等', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  6: { name: '中等', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  7: { name: '严重', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  8: { name: '严重', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  9: { name: '危急', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  10: { name: '危急', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
} as const;

// 默认授权持续时间（天）
export const DEFAULT_AUTHORIZATION_DAYS = 30;

// Mock 链配置
export const MOCK_CHAINS = {
  31337: "http://localhost:8545", // Hardhat local network
} as const;
