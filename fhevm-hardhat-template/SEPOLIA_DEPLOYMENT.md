# MediRecX Sepolia Testnet Deployment Guide

This guide will help you deploy the MediRecX medical records management contract to the Sepolia testnet.

## Prerequisites

### 1. Wallet Setup
- **MetaMask wallet** with Sepolia testnet configured
- **Sepolia ETH** for gas fees (get from faucets below)

### 2. API Keys Required
- **Infura API Key**: For Sepolia network access
- **Etherscan API Key**: For contract verification

## Step 1: Get Sepolia Testnet ETH

You need Sepolia ETH to pay for gas fees. Get free testnet ETH from:

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

**Minimum required**: ~0.05 ETH for deployment

## Step 2: Set Up API Keys

### Infura API Key
1. Go to [Infura.io](https://www.infura.io/)
2. Sign up for a free account
3. Create a new project
4. Copy the Project ID (this is your API key)

### Etherscan API Key
1. Go to [Etherscan.io](https://etherscan.io/)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

## Step 3: Configure Environment Variables

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` file and fill in your values:
```bash
# Your wallet mnemonic (12/24 word seed phrase)
# WARNING: Never commit this to version control!
MNEMONIC="your twelve word mnemonic phrase here"

# Infura API key for Sepolia network access
INFURA_API_KEY="your_infura_project_id_here"

# Etherscan API key for contract verification
ETHERSCAN_API_KEY="your_etherscan_api_key_here"
```

⚠️ **Security Warning**: Never commit your `.env` file to version control!

## Step 4: Deploy to Sepolia

### Option 1: Automated Deployment Script (Recommended)

Run the automated deployment script:
```bash
npm run deploy:sepolia
```

This script will:
- Check your wallet balance
- Validate network connection
- Deploy the contract
- Display deployment results

### Option 2: Manual Deployment

If you prefer manual deployment:
```bash
npx hardhat deploy --network sepolia --tags MedicalRecord
```

## Step 5: Verify Contract on Etherscan

After successful deployment, verify your contract:
```bash
npm run verify:sepolia DEPLOYED_CONTRACT_ADDRESS
```

Replace `DEPLOYED_CONTRACT_ADDRESS` with the address from deployment output.

## Step 6: Update Frontend Configuration

After deployment, update your frontend with the new contract address:

1. Find the deployed contract address in `deployments/sepolia/MedicalRecord.json`
2. Update `medrec-frontend/abi/MedicalRecordAddresses.ts`
3. Update any configuration files with the new Sepolia contract address

## Troubleshooting

### Common Issues

#### 1. Insufficient Balance
```
❌ Error: Insufficient balance for deployment
```
**Solution**: Get more Sepolia ETH from faucets listed above.

#### 2. Invalid Mnemonic
```
❌ Error: Please set your MNEMONIC in .env file
```
**Solution**: Make sure your mnemonic is correctly set in `.env` file.

#### 3. Infura Connection Issues
```
❌ Error: Please set your INFURA_API_KEY in .env file
```
**Solution**: Check your Infura API key and network connectivity.

#### 4. Gas Estimation Failures
**Solution**: Try again during less congested network times, or increase gas limit.

### Check Your Setup

Run these commands to verify your setup:

```bash
# Check balance
npx hardhat run scripts/check-balance.ts --network sepolia

# Test connection
npx hardhat run scripts/test-connection.ts --network sepolia
```

## Contract Information

- **Contract Name**: MedicalRecord
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Features**:
  - FHEVM encrypted medical record storage
  - Doctor authorization management
  - Patient privacy protection
  - Encrypted data access control

## Security Notes

- ✅ Never commit private keys or mnemonics to version control
- ✅ Use environment variables for sensitive data
- ✅ Test thoroughly on testnets before mainnet deployment
- ✅ Verify contracts on block explorers
- ✅ Keep API keys secure and rotate regularly

## Next Steps

After successful deployment:

1. Test the contract functions
2. Update frontend with new contract address
3. Test end-to-end functionality
4. Consider mainnet deployment when ready

---

For support or questions, refer to the main README.md or check the FHEVM documentation.
