// 公钥存储管理 - 基于参考项目
import { openDB, DBSchema, IDBPDatabase } from "idb";

interface FhevmDB extends DBSchema {
  publicKeys: {
    key: string; // ACL contract address
    value: {
      publicKey: string;
      publicParams: string;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<FhevmDB> | undefined;

async function getDB(): Promise<IDBPDatabase<FhevmDB>> {
  if (db) {
    return db;
  }

  db = await openDB<FhevmDB>("MediRecX-FHEVM", 1, {
    upgrade(database) {
      // 创建公钥存储表
      database.createObjectStore("publicKeys");
    },
  });

  return db;
}

export async function publicKeyStorageGet(
  aclAddress: string
): Promise<{ publicKey: string; publicParams: string }> {
  console.log(`[MediRecX PublicKeyStorage] 获取公钥: ${aclAddress}`);
  
  try {
    const database = await getDB();
    const stored = await database.get("publicKeys", aclAddress);

    if (stored) {
      console.log(`[MediRecX PublicKeyStorage] ✅ 找到缓存的公钥`);
      return {
        publicKey: stored.publicKey,
        publicParams: stored.publicParams,
      };
    }
  } catch (error) {
    console.warn(`[MediRecX PublicKeyStorage] ⚠️  读取存储的公钥失败:`, error);
  }

  // 如果没有存储的公钥，返回默认值（实际应用中应该从网络获取）
  console.log(`[MediRecX PublicKeyStorage] ℹ️ 未找到缓存公钥，使用默认值`);
  return {
    publicKey: "",
    publicParams: "",
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  console.log(`[MediRecX PublicKeyStorage] 存储公钥: ${aclAddress}`);
  
  try {
    const database = await getDB();
    await database.put("publicKeys", {
      publicKey,
      publicParams,
      timestamp: Date.now(),
    }, aclAddress);
    
    console.log(`[MediRecX PublicKeyStorage] ✅ 公钥存储成功`);
  } catch (error) {
    console.error(`[MediRecX PublicKeyStorage] ❌ 存储公钥失败:`, error);
    throw error;
  }
}

export async function publicKeyStorageClear(): Promise<void> {
  console.log(`[MediRecX PublicKeyStorage] 清除所有存储的公钥`);
  
  try {
    const database = await getDB();
    await database.clear("publicKeys");
    console.log(`[MediRecX PublicKeyStorage] ✅ 公钥存储已清除`);
  } catch (error) {
    console.error(`[MediRecX PublicKeyStorage] ❌ 清除公钥存储失败:`, error);
    throw error;
  }
}
