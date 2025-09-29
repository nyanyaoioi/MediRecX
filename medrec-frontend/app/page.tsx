"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, 
  Stethoscope, 
  FileText, 
  Shield, 
  Activity, 
  Users,
  PlusCircle,
  BarChart3,
  Lock,
  Eye,
  Clock,
  CheckCircle,
  TestTube,
  AlertTriangle,
  Wallet,
  Loader2,
  Settings,
  ExternalLink
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'patient' | 'doctor' | 'test'>('home');
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'select'>('select');

  // MetaMask integration
  const { isConnected, accounts, connect } = useMetaMaskEthersSigner();

  // Read state from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const pageParam = params.get('page');
    
    if (roleParam === 'patient' || roleParam === 'doctor') {
      setUserRole(roleParam);
      setCurrentPage(roleParam);
    }
    
    if (pageParam === 'test') {
      setCurrentPage('test');
    }
  }, []);

  // Page routing handling
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'patient':
        if (!isConnected) return <ConnectWalletPage role="patient" />;
        const { PatientDashboard } = require("@/components/PatientDashboard");
        return <PatientDashboard />;
        
      case 'doctor':
        if (!isConnected) return <ConnectWalletPage role="doctor" />;
        const { DoctorDashboard } = require("@/components/DoctorDashboard");
        return <DoctorDashboard />;
        
        
      default:
        return <LandingPage isConnected={isConnected} onPageChange={setCurrentPage} connect={connect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        userRole={userRole}
        onRoleChange={setUserRole}
        onPageChange={setCurrentPage}
        isConnected={isConnected}
        userAddress={accounts?.[0]}
        onConnect={connect}
      />
      {renderCurrentPage()}
    </div>
  );
}

// Wallet connection page component
const ConnectWalletPage = ({ role }: { role: 'patient' | 'doctor' }) => {
  const { connect } = useMetaMaskEthersSigner();
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

  const checkMetaMaskInstalled = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-lg bg-white rounded-xl shadow-lg p-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          role === 'patient' ? 'bg-medical-primary' : 'bg-medical-secondary'
        }`}>
          {role === 'patient' ? (
            <UserCircle className="w-12 h-12 text-white" />
          ) : (
            <Stethoscope className="w-12 h-12 text-white" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {role === 'patient' ? 'Patient' : 'Doctor'} Portal
        </h2>
        
        <p className="text-gray-600 mb-8">
          Connect your MetaMask wallet to access {role === 'patient' ? 'patient' : 'doctor'} features and manage encrypted medical records
        </p>

        {!checkMetaMaskInstalled() ? (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-red-800 font-medium">MetaMask Not Detected</p>
              <p className="text-red-700 text-sm">Please install MetaMask browser extension</p>
            </div>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors inline-flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Install MetaMask
            </a>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`px-8 py-4 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] ${
              role === 'patient' 
                ? 'bg-medical-primary hover:bg-medical-primary/90 hover:shadow-lg' 
                : 'bg-medical-secondary hover:bg-medical-secondary/90 hover:shadow-lg'
            }`}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2 inline" />
                Connect MetaMask Wallet
              </>
            )}
          </button>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            {role === 'patient' ? 'Patient' : 'Doctor'} Features:
          </h4>
          <ul className="text-sm text-blue-700 space-y-2">
            {role === 'patient' ? (
              <>
                <li>• 🔍 View your encrypted medical records</li>
                <li>• 🔐 Authorize doctors to access records</li>
                <li>• ⏰ Manage doctor access time limits</li>
                <li>• 📊 View health analytics and trends</li>
              </>
            ) : (
              <>
                <li>• 📝 Add encrypted medical records for patients</li>
                <li>• 👁️ View authorized patient records</li>
                <li>• 🔓 Decrypt and analyze medical data</li>
                <li>• 👥 Manage patient authorization status</li>
              </>
            )}
          </ul>
        </div>

        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Network Required:</strong> Localhost (Chain ID: 31337)<br/>
            Make sure your MetaMask is connected to the correct network
          </p>
        </div>
      </div>
    </div>
  );
};

// Homepage landing page component
const LandingPage = ({ 
  isConnected, 
  onPageChange,
  connect
}: { 
  isConnected: boolean;
  onPageChange: (page: 'home' | 'patient' | 'doctor' | 'test') => void;
  connect: () => Promise<void>;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light to-white">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Connection status indicator */}
          <div className="flex justify-center mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              isConnected 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              {isConnected ? 'FHEVM Connected' : 'Connecting to FHEVM...'}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-medical-primary">MediRecX</span>
              <br />
              <span className="text-2xl sm:text-3xl font-normal text-gray-600">
                Medical Records Management
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Fully Encrypted Medical Records Management System Based on FHEVM Technology
              <br />
              <span className="text-medical-primary font-medium">Protect Patient Privacy • Ensure Data Security • Precise Access Control</span>
            </p>

            {/* Quick start buttons with enhanced wallet connection */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 fade-in">
              {!isConnected ? (
                <div className="space-y-4">
                  <button 
                    onClick={async () => {
                      try {
                        await connect();
                        // After successful connection, redirect to patient portal by default
                        setTimeout(() => onPageChange('patient'), 1000);
                      } catch (error) {
                        console.error('Connection failed:', error);
                        alert(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-medical-primary text-white px-8 py-4 rounded-lg font-medium hover:bg-medical-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto min-w-[280px]"
                  >
                    <Wallet className="w-6 h-6 mr-3" />
                    Connect Wallet to Get Started
                  </button>
                  
                  <div className="text-center">
                    <a
                      href="/wallet-test"
                      className="text-sm text-gray-500 hover:text-medical-primary transition-colors"
                    >
                      Having connection issues? → Wallet Test Page
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    className="medical-button"
                    onClick={() => onPageChange('patient')}
                  >
                    <UserCircle className="w-5 h-5 mr-2 inline" />
                    Patient Portal
                  </button>
                  
                  <button 
                    className="bg-medical-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-secondary/90 transition-all duration-200"
                    onClick={() => onPageChange('doctor')}
                  >
                    <Stethoscope className="w-5 h-5 mr-2 inline" />
                    Doctor Dashboard
                  </button>
                  
                  <a
                    href="/wallet-test"
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 inline-flex items-center"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Wallet Test
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Using FHEVM fully homomorphic encryption technology to ensure medical data remains encrypted throughout the entire processing
            </p>
          </div>

          <div className="medical-grid">
            {/* Fully Encrypted Storage */}
            <div className="medical-card">
              <div className="w-12 h-12 bg-medical-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-medical-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fully Encrypted Storage</h3>
              <p className="text-gray-600 mb-4">
                Using FHEVM technology ensures medical records remain encrypted during storage and processing, preventing unauthorized access to plaintext data.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  End-to-end encryption
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Zero-knowledge verification
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Confidential computing
                </li>
              </ul>
            </div>

            {/* Precise Permission Control */}
            <div className="medical-card">
              <div className="w-12 h-12 bg-medical-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-medical-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Precise Permission Control</h3>
              <p className="text-gray-600 mb-4">
                Patients have complete control over their medical data access permissions, with precise authorization for specific doctors within specific time frames.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Patient autonomous authorization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Time-limited access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Revocable permissions
                </li>
              </ul>
            </div>

            {/* Intelligent Statistical Analysis */}
            <div className="medical-card">
              <div className="w-12 h-12 bg-medical-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-medical-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Statistical Analysis</h3>
              <p className="text-gray-600 mb-4">
                Provides statistical analysis and visualization of medical data while protecting privacy, assisting in medical decision-making.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Health trend analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Visualization charts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Smart reminders
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Five simple steps to start managing your medical records with MediRecX</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              {
                step: "1",
                title: "Patient Registration",
                description: "Connect wallet to complete identity verification",
                icon: UserCircle,
                color: "medical-primary"
              },
              {
                step: "2", 
                title: "Doctor Adds Records",
                description: "Doctor creates encrypted medical records",
                icon: PlusCircle,
                color: "medical-secondary"
              },
              {
                step: "3",
                title: "Patient Authorization",
                description: "Patient authorizes doctor access permissions",
                icon: Shield,
                color: "medical-accent"
              },
              {
                step: "4",
                title: "Doctor Views Records",
                description: "Authorized doctor views encrypted records",
                icon: FileText,
                color: "status-info"
              },
              {
                step: "5",
                title: "Statistical Analysis",
                description: "View health data analysis reports",
                icon: Activity,
                color: "status-normal"
              }
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                {/* 连接线 */}
                {index < 4 && (
                  <div className="hidden md:block absolute top-6 -right-4 w-8 h-0.5 bg-gray-300"></div>
                )}
                
                <div className={`w-12 h-12 rounded-full bg-${item.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-4`}>
                  {item.step}
                </div>
                
                <item.icon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
