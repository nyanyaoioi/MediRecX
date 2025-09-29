// ABI生成脚本 - 基于参考项目修改
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路径配置
const HARDHAT_ARTIFACTS_PATH = path.resolve(__dirname, "../../fhevm-hardhat-template/artifacts/contracts");
const HARDHAT_DEPLOYMENTS_PATH = path.resolve(__dirname, "../../fhevm-hardhat-template/deployments");
const FRONTEND_ABI_PATH = path.resolve(__dirname, "../abi");

console.log("🏥 MediRecX ABI生成器");
console.log("====================");

// 确保目标目录存在
if (!fs.existsSync(FRONTEND_ABI_PATH)) {
  fs.mkdirSync(FRONTEND_ABI_PATH, { recursive: true });
}

/**
 * 生成医疗记录合约ABI
 */
function generateMedicalRecordABI() {
  console.log("📋 正在生成MedicalRecord合约ABI...");
  
  try {
    // 读取合约artifacts
    const artifactPath = path.join(HARDHAT_ARTIFACTS_PATH, "MedicalRecord.sol/MedicalRecord.json");
    
    if (!fs.existsSync(artifactPath)) {
      console.warn(`⚠️  警告: 未找到MedicalRecord artifacts文件: ${artifactPath}`);
      console.log("   请确保已编译智能合约: cd fhevm-hardhat-template && npm run compile");
      
      // 生成默认ABI
      generateDefaultMedicalRecordABI();
      return;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // 生成ABI文件
    const abiContent = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MedicalRecordABI = ${JSON.stringify({ abi: artifact.abi }, null, 2)} as const;
`;

    fs.writeFileSync(
      path.join(FRONTEND_ABI_PATH, "MedicalRecordABI.ts"),
      abiContent
    );
    
    console.log("✅ MedicalRecordABI.ts 生成成功");

  } catch (error) {
    console.error("❌ 生成MedicalRecord ABI失败:", error.message);
    generateDefaultMedicalRecordABI();
  }
}

/**
 * 生成默认ABI（当找不到编译的合约时使用）
 */
function generateDefaultMedicalRecordABI() {
  console.log("📋 生成默认MedicalRecord ABI...");
  
  const defaultAbi = {
    abi: [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          { "internalType": "externalEaddress", "name": "patientAddr", "type": "bytes32" },
          { "internalType": "externalEuint32", "name": "recordTypeInput", "type": "bytes32" },
          { "internalType": "externalEuint32", "name": "severityInput", "type": "bytes32" },
          { "internalType": "bytes", "name": "patientProof", "type": "bytes" },
          { "internalType": "bytes", "name": "recordTypeProof", "type": "bytes" },
          { "internalType": "bytes", "name": "severityProof", "type": "bytes" }
        ],
        "name": "addMedicalRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "recordId", "type": "uint256" }
        ],
        "name": "getMedicalRecord",
        "outputs": [
          {
            "components": [
              { "internalType": "euint64", "name": "recordId", "type": "bytes32" },
              { "internalType": "eaddress", "name": "patientAddress", "type": "bytes32" },
              { "internalType": "eaddress", "name": "doctorAddress", "type": "bytes32" },
              { "internalType": "euint32", "name": "recordType", "type": "bytes32" },
              { "internalType": "euint64", "name": "timestamp", "type": "bytes32" },
              { "internalType": "euint32", "name": "severity", "type": "bytes32" },
              { "internalType": "ebool", "name": "isActive", "type": "bytes32" }
            ],
            "internalType": "struct MedicalRecord.EncryptedMedicalRecord",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTotalRecords",
        "outputs": [
          { "internalType": "euint32", "name": "", "type": "bytes32" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  };

  const abiContent = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
  Note: Using default ABI as compiled contract not found
*/
export const MedicalRecordABI = ${JSON.stringify(defaultAbi, null, 2)} as const;
`;

  fs.writeFileSync(
    path.join(FRONTEND_ABI_PATH, "MedicalRecordABI.ts"),
    abiContent
  );
  
  console.log("✅ 默认 MedicalRecordABI.ts 生成成功");
}

/**
 * 生成合约地址映射
 */
function generateMedicalRecordAddresses() {
  console.log("🗺️  正在生成MedicalRecord地址映射...");
  
  const addresses = {
    "31337": {
      "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3", // 默认本地地址
      "chainId": 31337,
      "chainName": "localhost"
    },
    "11155111": {
      "address": "0x0000000000000000000000000000000000000000", // Sepolia地址（需要部署后更新）
      "chainId": 11155111,
      "chainName": "sepolia"
    }
  };

  // 尝试从部署文件读取实际地址
  try {
    const localhostDeployment = path.join(HARDHAT_DEPLOYMENTS_PATH, "localhost/MedicalRecord.json");
    if (fs.existsSync(localhostDeployment)) {
      const deployment = JSON.parse(fs.readFileSync(localhostDeployment, "utf8"));
      addresses["31337"].address = deployment.address;
      console.log(`📍 找到本地部署地址: ${deployment.address}`);
    }
  } catch (error) {
    console.warn("⚠️  未能读取本地部署地址，使用默认地址");
  }

  const addressContent = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MedicalRecordAddresses = ${JSON.stringify(addresses, null, 2)} as const;
`;

  fs.writeFileSync(
    path.join(FRONTEND_ABI_PATH, "MedicalRecordAddresses.ts"),
    addressContent
  );
  
  console.log("✅ MedicalRecordAddresses.ts 生成成功");
}

/**
 * 主执行函数
 */
function main() {
  console.log(`📂 Hardhat路径: ${HARDHAT_ARTIFACTS_PATH}`);
  console.log(`📂 部署路径: ${HARDHAT_DEPLOYMENTS_PATH}`);
  console.log(`📂 输出路径: ${FRONTEND_ABI_PATH}`);
  console.log("");

  generateMedicalRecordABI();
  generateMedicalRecordAddresses();
  
  console.log("");
  console.log("🎉 ABI生成完成！");
  console.log("");
  console.log("💡 提示:");
  console.log("   - 如果智能合约有更新，请运行: npm run genabi");
  console.log("   - 本地开发请确保Hardhat节点正在运行");
  console.log("   - Mock模式会自动检测localhost:8545");
}

// 执行主函数
main();
