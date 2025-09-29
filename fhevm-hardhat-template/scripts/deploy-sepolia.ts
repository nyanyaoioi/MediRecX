#!/usr/bin/env ts-node
import { ethers } from "ethers";
import { vars } from "hardhat/config";

// Script to deploy MedicalRecord contract to Sepolia testnet
async function main() {
  console.log("🚀 Starting MediRecX deployment to Sepolia testnet...\n");

  // Load environment variables
  const MNEMONIC = vars.get("MNEMONIC");
  const INFURA_API_KEY = vars.get("INFURA_API_KEY");

  if (!MNEMONIC || MNEMONIC === "test test test test test test test test test test test junk") {
    console.error("❌ Error: Please set your MNEMONIC in .env file");
    console.log("   Get your mnemonic from your wallet (MetaMask, etc.)");
    process.exit(1);
  }

  if (!INFURA_API_KEY || INFURA_API_KEY === "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz") {
    console.error("❌ Error: Please set your INFURA_API_KEY in .env file");
    console.log("   Get your API key from: https://www.infura.io/");
    process.exit(1);
  }

  try {
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
    const wallet = ethers.Wallet.fromPhrase(MNEMONIC, provider);

    console.log("📋 Network: Sepolia Testnet");
    console.log(`👤 Deployer: ${wallet.address}`);
    console.log(`💰 Balance: ${(await provider.getBalance(wallet.address)).toString()} wei\n`);

    // Check if balance is sufficient
    const balance = await provider.getBalance(wallet.address);
    const minBalance = ethers.parseEther("0.1"); // Minimum 0.1 ETH for deployment

    if (balance < minBalance) {
      console.error("❌ Error: Insufficient balance for deployment");
      console.log(`   Required: ${ethers.formatEther(minBalance)} ETH`);
      console.log(`   Current: ${ethers.formatEther(balance)} ETH`);
      console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
      process.exit(1);
    }

    console.log("✅ Network connection successful");
    console.log("✅ Sufficient balance for deployment");
    console.log("🔨 Ready to deploy...\n");

    // Now run the hardhat deployment
    const { execSync } = require('child_process');
    console.log("🏥 Deploying MedicalRecord contract...");

    try {
      execSync('npx hardhat deploy --network sepolia --tags MedicalRecord', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log("\n🎉 Deployment completed successfully!");
      console.log("📋 Check deployments/sepolia/MedicalRecord.json for contract address");

    } catch (error) {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Setup error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
