"use client";

import { useState } from "react";
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Settings,
  ExternalLink,
  Copy,
  ArrowLeft
} from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";

export default function WalletTestPage() {
  const { 
    isConnected, 
    accounts, 
    chainId, 
    provider,
    ethersSigner,
    ethersReadonlyProvider,
    connect, 
    disconnect 
  } = useMetaMaskEthersSigner();
  
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({ 
    provider, 
    chainId, 
    initialMockChains: [], 
    enabled: isConnected 
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setTestResults([]);
    
    try {
      setTestResults(prev => [...prev, "🔄 Starting MetaMask connection..."]);
      await connect();
      setTestResults(prev => [...prev, "✅ MetaMask connection successful!"]);
    } catch (error) {
      const errorMsg = `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setTestResults(prev => [...prev, errorMsg]);
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const runConnectionTests = () => {
    const results: string[] = [];
    
    // Basic connection test
    results.push(`🔗 Connection Status: ${isConnected ? '✅ Connected' : '❌ Not Connected'}`);
    
    if (isConnected) {
      results.push(`👤 Account: ${accounts?.[0] || 'No account'}`);
      results.push(`🌐 Chain ID: ${chainId || 'Unknown'}`);
      results.push(`📡 Provider: ${provider ? '✅ Available' : '❌ Missing'}`);
      results.push(`✍️ Signer: ${ethersSigner ? '✅ Available' : '❌ Missing'}`);
      results.push(`📖 Readonly Provider: ${ethersReadonlyProvider ? '✅ Available' : '❌ Missing'}`);
      results.push(`🔐 FHEVM Status: ${fhevmStatus}`);
      results.push(`🏠 FHEVM Instance: ${fhevmInstance ? '✅ Ready' : '❌ Not Ready'}`);
      
      // Network validation
      if (chainId === 31337) {
        results.push(`✅ Correct Network: Localhost (31337)`);
      } else {
        results.push(`⚠️ Wrong Network: Please switch to Localhost (31337)`);
      }
    }
    
    setTestResults(results);
  };

  const getNetworkName = (chainId: number | undefined) => {
    switch (chainId) {
      case 31337: return 'Localhost (Development)';
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      default: return `Unknown Network (${chainId})`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => window.history.back()}
            className="mb-4 text-medical-primary hover:text-medical-primary/80 flex items-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔗 Wallet Connection Test</h1>
          <p className="text-lg text-gray-600">
            Test and troubleshoot MetaMask wallet connection issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Connection Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Wallet className="w-6 h-6 mr-2 text-medical-primary" />
              Wallet Connection
            </h2>

            {!isConnected ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-gray-400" />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">
                  Connect MetaMask to access MediRecX features
                </p>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-medical-primary text-white px-6 py-4 rounded-lg font-medium hover:bg-medical-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                      Connecting to MetaMask...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2 inline" />
                      Connect MetaMask Wallet
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Connected Successfully
                  </h3>
                  <button
                    onClick={disconnect}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-green-800">Account Address:</span>
                      <button
                        onClick={() => copyToClipboard(accounts?.[0] || '')}
                        className="text-green-600 hover:text-green-700"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-mono text-green-700 break-all">
                      {accounts?.[0]}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <span className="text-sm font-medium text-blue-800">Network:</span>
                    <p className="text-sm text-blue-700">
                      {getNetworkName(chainId)} (Chain ID: {chainId})
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <span className="text-sm font-medium text-purple-800">FHEVM Status:</span>
                    <p className="text-sm text-purple-700 flex items-center mt-1">
                      {fhevmStatus === 'ready' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Ready for encryption operations
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {fhevmStatus}
                        </>
                      )}
                    </p>
                  </div>

                  {chainId !== 31337 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center text-yellow-800">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Wrong Network</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please switch to Localhost network (Chain ID: 31337) for testing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-medical-secondary" />
              Connection Tests
            </h2>

            <div className="space-y-4">
              <button
                onClick={runConnectionTests}
                className="w-full bg-medical-secondary text-white px-4 py-3 rounded-lg font-medium hover:bg-medical-secondary/90 transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2 inline" />
                Run Connection Tests
              </button>

              {testResults.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Test Results:</h4>
                  <div className="space-y-2 text-sm">
                    {testResults.map((result, index) => (
                      <div key={index} className="font-mono text-gray-700">
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Troubleshooting:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Make sure MetaMask is installed and unlocked</li>
                  <li>• Switch to Localhost network (Chain ID: 31337)</li>
                  <li>• Ensure Hardhat node is running on localhost:8545</li>
                  <li>• Try refreshing the page if connection fails</li>
                  <li>• Check browser console for detailed error messages</li>
                </ul>
              </div>

              {!isConnected && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Don't have MetaMask?</h4>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 text-sm flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Download MetaMask Browser Extension
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        {isConnected && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Ready to Go!</h3>
              <p className="text-gray-600 mb-6">Your wallet is connected. Choose your role to continue:</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/?role=patient"
                  className="bg-medical-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-primary/90 transition-colors"
                >
                  👤 Enter as Patient
                </a>
                <a
                  href="/?role=doctor"
                  className="bg-medical-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-secondary/90 transition-colors"
                >
                  👨‍⚕️ Enter as Doctor
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

