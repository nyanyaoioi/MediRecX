import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("medical:deploy")
  .setDescription("部署MediRecX医疗记录管理合约")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
    
    console.log("🏥 开始部署MediRecX医疗记录管理系统...");
    
    const deployedMedicalRecord = await deploy("MedicalRecord", {
      from: deployer,
      log: true,
    });
    
    console.log(`✅ MedicalRecord合约部署成功: ${deployedMedicalRecord.address}`);
  });

task("medical:add-record")
  .setDescription("添加医疗记录")
  .addParam("contract", "合约地址")
  .addParam("patient", "患者地址")
  .addParam("type", "记录类型 (0-4)")
  .addParam("severity", "严重程度 (1-10)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    const medicalRecordFactory = await ethers.getContractFactory("MedicalRecord");
    const medicalRecord = medicalRecordFactory.attach(taskArguments.contract);
    
    console.log(`🏥 添加医疗记录...`);
    console.log(`📝 患者地址: ${taskArguments.patient}`);
    console.log(`📋 记录类型: ${taskArguments.type}`);
    console.log(`⚕️  严重程度: ${taskArguments.severity}`);
    
    // 这里需要使用FHEVM的加密输入，实际使用时需要前端提供加密数据
    console.log(`注意：此任务仅为演示，实际使用需要前端提供FHEVM加密输入`);
  });

task("medical:authorize-doctor")
  .setDescription("授权医生访问")
  .addParam("contract", "合约地址")
  .addParam("doctor", "医生地址")
  .addParam("expiration", "过期时间戳")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    console.log(`🔐 授权医生访问医疗记录...`);
    console.log(`👨‍⚕️ 医生地址: ${taskArguments.doctor}`);
    console.log(`⏰ 过期时间: ${new Date(parseInt(taskArguments.expiration) * 1000)}`);
    
    console.log(`注意：此任务仅为演示，实际使用需要前端提供FHEVM加密输入`);
  });

task("medical:get-total-records")
  .setDescription("获取总记录数")
  .addParam("contract", "合约地址")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    const medicalRecordFactory = await ethers.getContractFactory("MedicalRecord");
    const medicalRecord = medicalRecordFactory.attach(taskArguments.contract);
    
    console.log(`📊 获取总记录数...`);
    
    try {
      const totalRecords = await medicalRecord.getTotalRecords();
      console.log(`📈 总记录数: ${totalRecords} (加密状态)`);
      console.log(`注意：返回的是加密数据，需要通过FHEVM解密才能看到明文`);
    } catch (error) {
      console.error(`❌ 获取记录数失败:`, error);
    }
  });

task("medical:generate-random-id")
  .setDescription("生成随机记录ID")
  .addParam("contract", "合约地址")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();
    
    const medicalRecordFactory = await ethers.getContractFactory("MedicalRecord");
    const medicalRecord = medicalRecordFactory.attach(taskArguments.contract);
    
    console.log(`🎲 生成随机记录ID...`);
    
    try {
      const tx = await medicalRecord.generateRandomRecordId();
      const receipt = await tx.wait();
      console.log(`✅ 随机ID生成交易成功: ${tx.hash}`);
      console.log(`注意：返回的是FHEVM加密的随机数`);
    } catch (error) {
      console.error(`❌ 生成随机ID失败:`, error);
    }
  });

task("medical:debug")
  .setDescription("调试医疗记录合约状态")
  .addParam("contract", "合约地址")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    const [deployer, user1, user2] = await ethers.getSigners();
    
    console.log("🔍 MediRecX 合约调试");
    console.log("===================");
    console.log(`📋 合约地址: ${taskArguments.contract}`);

    const medicalRecordFactory = await ethers.getContractFactory("MedicalRecord");
    const medicalRecord = medicalRecordFactory.attach(taskArguments.contract);

    try {
      // 检查总记录数
      console.log("\n📊 检查总记录数...");
      try {
        const totalRecords = await medicalRecord.getTotalRecords();
        console.log(`总记录数（加密）: ${totalRecords}`);
      } catch (error) {
        console.log(`❌ 获取总记录数失败: ${error.message}`);
      }
      
      // 检查记录1
      console.log("\n📋 检查记录ID=1...");
      try {
        const record1 = await medicalRecord.getMedicalRecord(1);
        console.log("记录1存在，字段值:");
        console.log(`  recordId: ${record1.recordId}`);
        console.log(`  severity: ${record1.severity}`);
        console.log(`  recordType: ${record1.recordType}`);
        console.log(`  timestamp: ${record1.timestamp}`);
        console.log(`  isActive: ${record1.isActive}`);
        console.log(`  encryptedDetails长度: ${record1.encryptedDetails?.length || 0}`);
        console.log(`  detailsHash: ${record1.detailsHash}`);
        
        // 检查句柄是否为零
        const isZeroHandle = (handle) => handle === ethers.ZeroHash || handle === "0x0000000000000000000000000000000000000000000000000000000000000000";
        
        console.log("\n🔍 句柄零值检查:");
        console.log(`  severity是零: ${isZeroHandle(record1.severity)}`);
        console.log(`  recordType是零: ${isZeroHandle(record1.recordType)}`);
        console.log(`  timestamp是零: ${isZeroHandle(record1.timestamp)}`);
        console.log(`  isActive是零: ${isZeroHandle(record1.isActive)}`);
        
      } catch (error) {
        console.log(`❌ 获取记录1失败: ${error.message}`);
      }

      // 检查记录0
      console.log("\n📋 检查记录ID=0...");
      try {
        const record0 = await medicalRecord.getMedicalRecord(0);
        console.log("记录0存在，字段值:");
        console.log(`  recordId: ${record0.recordId}`);
        console.log(`  severity: ${record0.severity}`);
        console.log(`  recordType: ${record0.recordType}`);
      } catch (error) {
        console.log(`❌ 获取记录0失败: ${error.message}`);
      }

      // 显示账户信息
      console.log(`\n👥 当前账户信息:`);
      console.log(`  部署者: ${deployer.address}`);
      console.log(`  用户1: ${user1.address}`);
      console.log(`  用户2: ${user2.address}`);
      console.log(`  当前签名者: ${deployer.address}`);

    } catch (error) {
      console.error("❌ 调试执行失败:", error);
    }
  });
