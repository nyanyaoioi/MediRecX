// Hardhat节点检查脚本 - 基于参考项目修改
import { ethers } from "ethers";

async function checkIfHardhatNodeIsRunning() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  try {
    console.log("🏥 MediRecX - 检查Hardhat节点状态...");
    
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    console.log(`✅ 以太坊节点正在运行`);
    console.log(`📦 当前区块: ${blockNumber}`);
    console.log(`🌐 链ID: ${network.chainId}`);
    console.log(`🔗 网络名称: ${network.name}`);
    
    // 检查是否为Hardhat网络
    if (Number(network.chainId) === 31337) {
      console.log("🎭 检测到Hardhat本地网络 - Mock模式已激活");
      
      // 尝试检查FHEVM相关合约
      try {
        const version = await provider.send("web3_clientVersion", []);
        console.log(`⚙️  客户端版本: ${version}`);
        
        if (version.toLowerCase().includes("hardhat")) {
          console.log("🔧 确认为Hardhat节点");
          
          // 尝试获取FHEVM元数据
          try {
            const fhevmMetadata = await provider.send("fhevm_relayer_metadata", []);
            console.log("🔐 FHEVM支持已启用");
            console.log(`   ACL地址: ${fhevmMetadata.ACLAddress}`);
            console.log(`   InputVerifier地址: ${fhevmMetadata.InputVerifierAddress}`);
            console.log(`   KMSVerifier地址: ${fhevmMetadata.KMSVerifierAddress}`);
          } catch {
            console.log("⚠️  FHEVM元数据不可用（这是正常的，如果尚未部署FHEVM合约）");
          }
        }
      } catch (error) {
        console.log("ℹ️  无法获取详细节点信息");
      }
      
    } else {
      console.log(`🌍 检测到非Hardhat网络 (链ID: ${network.chainId}) - 将使用生产模式`);
    }
    
    console.log("");
    console.log("🚀 MediRecX 准备就绪！");
    
  } catch (error) {
    console.error("");
    console.error("===============================================================================");
    console.error("");
    console.error(" 🏥❌ MediRecX: 本地Hardhat节点未运行！");
    console.error("");
    console.error("   启动Hardhat节点:");
    console.error("   ==================");
    console.error("   ✅ 1. 打开新的终端窗口");
    console.error("   ✅ 2. 进入目录: cd fhevm-hardhat-template");
    console.error("   ✅ 3. 运行命令: npx hardhat node --verbose");
    console.error("");
    console.error("   或者运行完整的设置:");
    console.error("   ==================");
    console.error("   ✅ 1. npm run compile  # 编译合约");
    console.error("   ✅ 2. npx hardhat node # 启动节点");
    console.error("   ✅ 3. npx hardhat run deploy/deploy.ts --network localhost # 部署合约");
    console.error("");
    console.error("   错误详情:");
    console.error(`   ${error.message}`);
    console.error("");
    console.error("===============================================================================");
    console.error("");
    process.exit(1);
  }
}

checkIfHardhatNodeIsRunning();
