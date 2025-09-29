const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 MediRecX 合约调试");
  console.log("===================");

  // 获取合约工厂和实例
  const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
  const contractAddress = "0x933861CA3D843262076A3a3aC9b8Cc88c8aE9D68"; // Sepolia部署地址
  const medicalRecord = MedicalRecord.attach(contractAddress);

  console.log(`📋 合约地址: ${contractAddress}`);

  try {
    // 检查总记录数
    console.log("\n📊 检查总记录数...");
    const totalRecords = await medicalRecord.getTotalRecords();
    console.log(`总记录数（加密）: ${totalRecords}`);
    
    // 检查记录1是否存在
    console.log("\n📋 检查记录ID=1...");
    try {
      const record1 = await medicalRecord.getMedicalRecord(1);
      console.log("记录1数据:", record1);
      
      // 检查各个字段是否为零
      console.log(`  recordId: ${record1.recordId}`);
      console.log(`  severity: ${record1.severity}`);
      console.log(`  recordType: ${record1.recordType}`);
      console.log(`  timestamp: ${record1.timestamp}`);
      console.log(`  isActive: ${record1.isActive}`);
      console.log(`  encryptedDetails: ${record1.encryptedDetails.slice(0, 50)}...`);
      
    } catch (error) {
      console.log("❌ 获取记录1失败:", error.message);
    }

    // 检查记录0（可能存在的错误存储）
    console.log("\n📋 检查记录ID=0...");
    try {
      const record0 = await medicalRecord.getMedicalRecord(0);
      console.log("记录0数据:", record0);
    } catch (error) {
      console.log("❌ 获取记录0失败:", error.message);
    }

    // 获取账户信息
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log(`\n👥 可用账户:`);
    console.log(`  部署者: ${deployer.address}`);
    console.log(`  用户1: ${user1.address}`);
    console.log(`  用户2: ${user2.address}`);

    // 尝试添加一个测试记录
    console.log("\n➕ 尝试添加测试记录...");
    try {
      // 使用简化的测试数据
      const testPatientAddr = user2.address;
      console.log(`  患者地址: ${testPatientAddr}`);
      console.log(`  医生地址: ${user1.address}`);

      // 创建FHEVM输入（这里需要真实的FHEVM实例）
      console.log("⚠️  注意：需要FHEVM实例来创建加密输入");
      console.log("建议：使用前端界面进行测试，那里有完整的FHEVM环境");

    } catch (error) {
      console.log("❌ 添加测试记录失败:", error.message);
    }

  } catch (error) {
    console.error("❌ 调试脚本执行失败:", error);
  }
}

main()
  .then(() => {
    console.log("\n✅ 调试完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
