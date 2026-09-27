export class IndexedDBCache {
  constructor(dbName = "RimuflixCacheDB", storeName = "apiResponses") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // A URL da requisição será a chave principal
          db.createObjectStore(this.storeName, { keyPath: "url" });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async get(url) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);

      request.onsuccess = () => {
        const record = request.result;
        if (!record) return resolve(null);

        // Verifica se o tempo de vida (TTL) expirou
        if (Date.now() > record.expiry) {
          this.delete(url); // Limpa o dado velho
          return resolve(null); // Força um novo fetch
        }

        resolve(record.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async set(url, data, ttlHours = 2) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);

      const expiry = Date.now() + ttlHours * 60 * 60 * 1000;
      const record = { url, data, expiry };

      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(url) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(url);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}
