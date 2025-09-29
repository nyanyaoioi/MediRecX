// 通用字符串存储接口 - 基于参考项目
export interface GenericStringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 内存存储实现（用于开发测试）
export class InMemoryStorage implements GenericStringStorage {
  private storage = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

// IndexedDB存储实现（用于生产环境）
export class IndexedDBStorage implements GenericStringStorage {
  private dbName = "MediRecX-FHEVM-Storage";
  private storeName = "signatures";
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.warn("IndexedDB读取失败，使用null:", error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn("IndexedDB写入失败:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn("IndexedDB删除失败:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn("IndexedDB清除失败:", error);
      throw error;
    }
  }
}
