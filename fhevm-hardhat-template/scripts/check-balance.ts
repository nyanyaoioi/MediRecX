#!/usr/bin/env ts-node
import { ethers } from "ethers";
import { vars } from "hardhat/config";

async function main() {
  console.log("💰 Checking Sepolia wallet balance...\n");

  const MNEMONIC = vars.get("MNEMONIC");
  const INFURA_API_KEY = vars.get("INFURA_API_KEY");

  if (!MNEMONIC || MNEMONIC === "test test test test test test test test test test test junk") {
    console.error("❌ Error: MNEMONIC not set in .env file");
    process.exit(1);
  }

  if (!INFURA_API_KEY || INFURA_API_KEY === "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz") {
    console.error("❌ Error: INFURA_API_KEY not set in .env file");
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
    const wallet = ethers.Wallet.fromPhrase(MNEMONIC, provider);

    console.log(`👤 Wallet Address: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);

    console.log(`💰 Balance: ${balanceEth} ETH`);
    console.log(`💰 Balance (wei): ${balance.toString()}`);

    const minBalance = ethers.parseEther("0.01");
    if (balance < minBalance) {
      console.log("\n⚠️  Warning: Balance is low for deployment");
      console.log(`   Minimum recommended: ${ethers.formatEther(minBalance)} ETH`);
      console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
    } else {
      console.log("\n✅ Balance looks good for deployment!");
    }

  } catch (error) {
    console.error("❌ Error checking balance:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
