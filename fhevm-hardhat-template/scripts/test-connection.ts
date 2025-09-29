#!/usr/bin/env ts-node
import { ethers } from "ethers";
import { vars } from "hardhat/config";

async function main() {
  console.log("🌐 Testing Sepolia network connection...\n");

  const INFURA_API_KEY = vars.get("INFURA_API_KEY");

  if (!INFURA_API_KEY || INFURA_API_KEY === "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz") {
    console.error("❌ Error: INFURA_API_KEY not set in .env file");
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);

    // Test basic connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

    // Test getting block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Latest block: ${blockNumber}`);

    // Test gas price
    const gasPrice = await provider.getFeeData();
    console.log(`⛽ Gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} gwei`);

    console.log("\n🎉 Sepolia connection test successful!");
    console.log("🚀 Ready for deployment");

  } catch (error) {
    console.error("❌ Connection test failed:", error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("   - Check your internet connection");
    console.log("   - Verify your Infura API key");
    console.log("   - Make sure Sepolia network is not down");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
