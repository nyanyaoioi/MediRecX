"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Settings,
  ExternalLink
} from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";

export const WalletStatus = () => {
  const { isConnected, accounts, chainId, connect, disconnect } = useMetaMaskEthersSigner();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getNetworkName = (chainId: number | undefined) => {
    switch (chainId) {
      case 31337: return 'Localhost';
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      default: return `Unknown (${chainId})`;
    }
  };

  const getNetworkColor = (chainId: number | undefined) => {
    switch (chainId) {
      case 31337: return 'bg-blue-100 text-blue-800';
      case 1: return 'bg-green-100 text-green-800';
      case 11155111: return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Not Connected</h3>
          <p className="text-gray-600 mb-6">
            Connect your MetaMask wallet to access MediRecX features
          </p>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-medical-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto min-w-[140px]"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Setup Instructions:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Install MetaMask browser extension</li>
              <li>• Switch to Localhost network (Chain ID: 31337)</li>
              <li>• Ensure you have test ETH for gas fees</li>
              <li>• Make sure Hardhat node is running</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          Wallet Connected
        </h3>
        <button
          onClick={disconnect}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Account:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-900">
              {accounts?.[0]?.slice(0, 8)}...{accounts?.[0]?.slice(-6)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(accounts?.[0] || '')}
              className="text-xs text-gray-500 hover:text-medical-primary"
              title="Copy address"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Network:</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getNetworkColor(chainId)}`}>
            {getNetworkName(chainId)}
          </span>
        </div>

        {chainId !== 31337 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span>Please switch to Localhost network (Chain ID: 31337)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

