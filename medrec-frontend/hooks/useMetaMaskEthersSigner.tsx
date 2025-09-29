"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { MOCK_CHAINS } from "@/fhevm/internal/constants";

// EIP-6963 相关类型
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: ethers.Eip1193Provider;
}

/**
 * MetaMask Ethers Signer Hook
 * 基于参考项目修改，专为MediRecX定制
 */
export function useMetaMaskEthersSigner() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);
  
  // 缓存引用
  const providerRef = useRef<ethers.Eip1193Provider | undefined>(provider);
  const chainIdRef = useRef<number | undefined>(chainId);
  const accountsRef = useRef<string[] | undefined>(accounts);
  const etherSignerRef = useRef<ethers.JsonRpcSigner | undefined>(ethersSigner);

  // 更新引用
  providerRef.current = provider;
  chainIdRef.current = chainId;
  accountsRef.current = accounts;
  etherSignerRef.current = ethersSigner;

  // 检查是否已连接
  const isConnected = useMemo(() => {
    return Boolean(provider && accounts && accounts.length > 0);
  }, [provider, accounts]);

  // 支持的Mock链配置
  const initialMockChains = useMemo(() => {
    return MOCK_CHAINS;
  }, []);

  // 同链检查函数
  const sameChain = useRef((checkChainId: number | undefined) => {
    return chainIdRef.current === checkChainId;
  });

  // 同签名者检查函数  
  const sameSigner = useRef((checkSigner: ethers.JsonRpcSigner | undefined) => {
    return etherSignerRef.current === checkSigner;
  });

  /**
   * 检测并连接MetaMask
   */
  const connect = useCallback(async () => {
    console.log("[MediRecX MetaMask] 🦊 开始连接MetaMask...");
    
    try {
      // 检查是否有以太坊提供者
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask未安装或不可用");
      }

      const provider = window.ethereum as ethers.Eip1193Provider;
      console.log("[MediRecX MetaMask] ✅ 检测到MetaMask");

      // 请求连接账户
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("用户拒绝连接或没有可用账户");
      }

      // 获取链ID
      const chainIdHex = await provider.request({
        method: "eth_chainId",
      }) as string;
      const currentChainId = Number.parseInt(chainIdHex, 16);

      console.log(`[MediRecX MetaMask] 📊 连接成功`);
      console.log(`  账户: ${accounts[0]}`);
      console.log(`  链ID: ${currentChainId}`);

      // 设置状态
      setProvider(provider);
      setChainId(currentChainId);
      setAccounts(accounts);

      // 创建ethers provider和signer
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      setEthersSigner(signer);
      setEthersReadonlyProvider(ethersProvider);

      console.log("[MediRecX MetaMask] 🔗 Ethers集成完成");

    } catch (error) {
      console.error("[MediRecX MetaMask] ❌ 连接失败:", error);
      
      // 清理状态
      setProvider(undefined);
      setChainId(undefined);
      setAccounts(undefined);
      setEthersSigner(undefined);
      setEthersReadonlyProvider(undefined);
      
      throw error;
    }
  }, []);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    console.log("[MediRecX MetaMask] 📴 断开连接");
    
    setProvider(undefined);
    setChainId(undefined);
    setAccounts(undefined);
    setEthersSigner(undefined);
    setEthersReadonlyProvider(undefined);
  }, []);

  /**
   * 切换网络
   */
  const switchToNetwork = useCallback(async (targetChainId: number) => {
    if (!provider) {
      throw new Error("未连接到MetaMask");
    }

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      
      console.log(`[MediRecX MetaMask] 🔄 成功切换到链: ${targetChainId}`);
      
    } catch (error: any) {
      // 如果链不存在，尝试添加
      if (error.code === 4902) {
        console.log(`[MediRecX MetaMask] ➕ 尝试添加新链: ${targetChainId}`);
        
        // 这里可以根据需要添加网络配置
        if (targetChainId === 31337) {
          // 添加本地Hardhat网络
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainIdHex,
              chainName: "Hardhat Local",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: ["http://localhost:8545"],
              blockExplorerUrls: null,
            }],
          });
        } else {
          throw new Error(`不支持的网络ID: ${targetChainId}`);
        }
      } else {
        throw error;
      }
    }
  }, [provider]);

  /**
   * 监听账户和网络变化
   */
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("[MediRecX MetaMask] 👤 账户变更:", accounts);
      setAccounts(accounts.length > 0 ? accounts : undefined);
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number.parseInt(chainIdHex, 16);
      console.log("[MediRecX MetaMask] 🌐 网络变更:", newChainId);
      setChainId(newChainId);
    };

    // 注册事件监听器
    const ethProvider = provider as any;
    ethProvider.on("accountsChanged", handleAccountsChanged);
    ethProvider.on("chainChanged", handleChainChanged);

    return () => {
      ethProvider.removeListener("accountsChanged", handleAccountsChanged);
      ethProvider.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider]);

  /**
   * 自动检测已连接的MetaMask
   */
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) {
        return;
      }

      try {
        const provider = window.ethereum as ethers.Eip1193Provider;
        const accounts = await provider.request({
          method: "eth_accounts",
        }) as string[];

        if (accounts && accounts.length > 0) {
          console.log("[MediRecX MetaMask] 🔄 检测到已连接账户，自动连接...");
          await connect();
        }
      } catch (error) {
        console.log("[MediRecX MetaMask] ℹ️  自动连接失败，需要用户手动连接");
      }
    };

    // 延迟检查，确保页面加载完成
    const timer = setTimeout(checkConnection, 1000);
    return () => clearTimeout(timer);
  }, [connect]);

  return {
    // 连接状态
    provider,
    chainId,
    accounts,
    isConnected,
    
    // Ethers 对象
    ethersSigner,
    ethersReadonlyProvider,
    
    // 检查函数
    sameChain,
    sameSigner,
    
    // Mock链配置
    initialMockChains,
    
    // 操作方法
    connect,
    disconnect,
    switchToNetwork,
  };
}
