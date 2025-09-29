"use client";

import { useState } from "react";
import {
  Home,
  User,
  Stethoscope,
  TestTube,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  Wallet
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavigationProps {
  currentPage: 'home' | 'patient' | 'doctor' | 'test';
  userRole: 'patient' | 'doctor' | 'select';
  onRoleChange: (role: 'patient' | 'doctor' | 'select') => void;
  onPageChange: (page: 'home' | 'patient' | 'doctor' | 'test') => void;
  isConnected: boolean;
  userAddress?: string;
  onConnect: () => Promise<void>;
}

export const Navigation = ({ 
  currentPage, 
  userRole, 
  onRoleChange, 
  onPageChange, 
  isConnected, 
  userAddress,
  onConnect
}: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => onPageChange('home')
    },
    {
      id: 'patient',
      label: 'Patient Portal',
      icon: User,
      onClick: () => {
        onRoleChange('patient');
        onPageChange('patient');
      },
      disabled: !isConnected
    },
    {
      id: 'doctor', 
      label: 'Doctor Dashboard',
      icon: Stethoscope,
      onClick: () => {
        onRoleChange('doctor');
        onPageChange('doctor');
      },
      disabled: !isConnected
    }
  ];

  const NavButton = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = currentPage === item.id;
    const IconComponent = item.icon;

    return (
      <button
        onClick={item.onClick}
        disabled={item.disabled}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isActive
            ? 'bg-medical-primary text-white'
            : item.disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 hover:text-medical-primary'
        }`}
      >
        <IconComponent className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* 桌面端导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo和标题 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-medical-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MediRecX</h1>
                <p className="text-xs text-gray-500">Medical Records Management</p>
              </div>
            </div>

            {/* 桌面端导航菜单 */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
            </div>

            {/* 用户信息和操作 */}
            <div className="flex items-center space-x-4">

              {/* 语言切换器 */}
              <LanguageSwitcher />

              {/* 连接状态和按钮 */}
              {!isConnected ? (
                <button
                  onClick={onConnect}
                  className="bg-medical-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-medical-primary/90 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-gray-600 hidden sm:inline">Connected</span>
                </div>
              )}

              {/* 用户信息 */}
              {isConnected && userAddress && (
                <div className="hidden lg:flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {userRole === 'patient' ? '👤 Patient' : userRole === 'doctor' ? '👨‍⚕️ Doctor' : '👤 User'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
                    </p>
                  </div>
                </div>
              )}

              {/* 角色切换 */}
              {isConnected && (
                <div className="relative">
                  <select
                    value={userRole}
                    onChange={(e) => onRoleChange(e.target.value as 'patient' | 'doctor' | 'select')}
                    className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary"
                  >
                    <option value="select">Select Role</option>
                    <option value="patient">👤 Patient</option>
                    <option value="doctor">👨‍⚕️ Doctor</option>
                  </select>
                </div>
              )}

              {/* 移动端菜单按钮 */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
              
              {/* 移动端连接状态 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
                
                {isConnected && userAddress && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-mono">{userAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 面包屑导航 */}
      {currentPage !== 'home' && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-3 text-sm">
              <button 
                onClick={() => onPageChange('home')}
                className="text-medical-primary hover:text-medical-primary/80"
              >
                Home
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">
                {currentPage === 'patient' ? '👤 Patient Portal' : 
                 currentPage === 'doctor' ? '👨‍⚕️ Doctor Dashboard' : 
                 'Page'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
