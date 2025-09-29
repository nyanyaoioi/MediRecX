// 内存存储Hook - 基于参考项目修改
"use client";

import { useMemo } from "react";
import { InMemoryStorage, type GenericStringStorage } from "@/fhevm/GenericStringStorage";

export function useInMemoryStorage(): {
  storage: GenericStringStorage;
} {
  const storage = useMemo(() => {
    console.log("[MediRecX Storage] 🗃️  创建内存存储实例");
    return new InMemoryStorage();
  }, []);

  return { storage };
}
