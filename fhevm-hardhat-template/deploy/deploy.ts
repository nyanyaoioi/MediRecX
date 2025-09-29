import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 部署MediRecX医疗记录管理合约
  const deployedMedicalRecord = await deploy("MedicalRecord", {
    from: deployer,
    log: true,
    contract: "MedicalRecord",
  });

  console.log(`MedicalRecord contract deployed: `, deployedMedicalRecord.address);
  console.log(`🏥 MediRecX系统已部署成功！`);
  console.log(`📋 医疗记录管理合约地址: ${deployedMedicalRecord.address}`);
  console.log(`🔐 支持完全加密的医疗数据存储和访问控制`);
  
  // 验证部署
  if (deployedMedicalRecord.address) {
    console.log(`✅ 合约部署验证成功`);
    console.log(`⚡ 合约功能包括：`);
    console.log(`   - 加密医疗记录存储`);
    console.log(`   - 医生访问授权管理`);
    console.log(`   - 患者隐私保护`);
    console.log(`   - FHEVM原生加密支持`);
  } else {
    console.log(`❌ 合约部署失败`);
  }
};

export default func;
func.id = "deploy_medicalRecord";
func.tags = ["MedicalRecord", "MediRecX"];
