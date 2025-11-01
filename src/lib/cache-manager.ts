/**
 * CacheManager - Smart caching system for IPTV data
 * Handles IndexedDB operations with TTL and portal-specific caching
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  portalId: string;
  version: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 4 hours)
  forceRefresh?: boolean;
}

export class CacheManager {
  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  private static readonly DB_NAME = 'IPTVCacheDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'iptv_cache';

  // Cache key prefixes
  private static readonly KEYS = {
    CHANNELS: 'iptv-channels',
    EPG: 'iptv-epg',
    MOVIES: 'iptv-movies',
    SERIES: 'iptv-series',
    GENRES: 'iptv-genres',
  };

  /**
   * Check if we're in a browser environment with IndexedDB support
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }

  /**
   * Initialize and open the IndexedDB database
   */
  private static async openDatabase(): Promise<IDBDatabase> {
    if (!this.isBrowser()) {
      throw new Error('IndexedDB not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB database'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
          console.log(`[CacheManager] Created object store: ${this.STORE_NAME}`);
        }
      };
    });
  }

  /**
   * Generate a cache key for a specific portal
   */
  private static getCacheKey(prefix: string, portalId: string): string {
    return `${prefix}-${portalId}`;
  }

  /**
   * Set data in cache with metadata
   */
  static async set<T>(
    key: string,
    portalId: string,
    data: T
  ): Promise<boolean> {
    if (!this.isBrowser()) {
      console.warn('CacheManager: IndexedDB not available');
      return false;
    }

    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        portalId,
        version: this.CACHE_VERSION,
      };

      const cacheKey = this.getCacheKey(key, portalId);
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(JSON.stringify(cacheEntry), cacheKey);

        request.onsuccess = () => {
          console.log(`[CacheManager] Cached ${key} for portal ${portalId}`, {
            dataSize: JSON.stringify(data).length,
            timestamp: new Date(cacheEntry.timestamp).toISOString(),
          });
          db.close();
          resolve(true);
        };

        request.onerror = () => {
          console.error('[CacheManager] Failed to set cache:', request.error);
          db.close();
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('[CacheManager] Transaction error:', transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('[CacheManager] Failed to set cache:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[CacheManager] Storage quota exceeded, clearing old cache');
        await this.clearAll();
      }
      return false;
    }
  }

  /**
   * Get data from cache if valid
   */
  static async get<T>(
    key: string,
    portalId: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    if (!this.isBrowser()) {
      return null;
    }

    const { ttl = this.DEFAULT_TTL, forceRefresh = false } = options;

    if (forceRefresh) {
      console.log(`[CacheManager] Force refresh requested for ${key}`);
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key, portalId);
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(cacheKey);

        request.onsuccess = async () => {
          const cached = request.result;

          if (!cached) {
            console.log(`[CacheManager] No cache found for ${key}`);
            db.close();
            resolve(null);
            return;
          }

          try {
            const cacheEntry: CacheEntry<T> = JSON.parse(cached);

            // Validate cache version
            if (cacheEntry.version !== this.CACHE_VERSION) {
              console.log(`[CacheManager] Cache version mismatch for ${key}, invalidating`);
              db.close();
              await this.remove(key, portalId);
              resolve(null);
              return;
            }

            // Validate portal ID
            if (cacheEntry.portalId !== portalId) {
              console.log(`[CacheManager] Portal ID mismatch for ${key}, invalidating`);
              db.close();
              await this.remove(key, portalId);
              resolve(null);
              return;
            }

            // Check if cache is stale
            const age = Date.now() - cacheEntry.timestamp;
            const isStale = age > ttl;

            if (isStale) {
              console.log(`[CacheManager] Cache expired for ${key}`, {
                age: Math.round(age / 1000 / 60),
                ttl: Math.round(ttl / 1000 / 60),
              });
              db.close();
              resolve(null);
              return;
            }

            console.log(`[CacheManager] Cache hit for ${key}`, {
              age: Math.round(age / 1000 / 60) + ' minutes',
              dataSize: JSON.stringify(cacheEntry.data).length,
            });

            db.close();
            resolve(cacheEntry.data);
          } catch (parseError) {
            console.error('[CacheManager] Failed to parse cache entry:', parseError);
            db.close();
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('[CacheManager] Failed to get cache:', request.error);
          db.close();
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('[CacheManager] Transaction error:', transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('[CacheManager] Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static async has(
    key: string,
    portalId: string,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const result = await this.get(key, portalId, options);
    return result !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  static async getAge(key: string, portalId: string): Promise<number | null> {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key, portalId);
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(cacheKey);

        request.onsuccess = () => {
          const cached = request.result;

          if (!cached) {
            db.close();
            resolve(null);
            return;
          }

          try {
            const cacheEntry: CacheEntry<any> = JSON.parse(cached);
            db.close();
            resolve(Date.now() - cacheEntry.timestamp);
          } catch (parseError) {
            db.close();
            resolve(null);
          }
        };

        request.onerror = () => {
          db.close();
          reject(request.error);
        };

        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cache is stale
   */
  static async isStale(
    key: string,
    portalId: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<boolean> {
    const age = await this.getAge(key, portalId);
    if (age === null) return true;
    return age > ttl;
  }

  /**
   * Remove specific cache entry
   */
  static async remove(key: string, portalId: string): Promise<boolean> {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(key, portalId);
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(cacheKey);

        request.onsuccess = () => {
          console.log(`[CacheManager] Removed cache for ${key}`);
          db.close();
          resolve(true);
        };

        request.onerror = () => {
          console.error('[CacheManager] Failed to remove cache:', request.error);
          db.close();
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('[CacheManager] Transaction error:', transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('[CacheManager] Failed to remove cache:', error);
      return false;
    }
  }

  /**
   * Clear all cache for a specific portal
   */
  static async clearPortal(portalId: string): Promise<boolean> {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const keys = Object.values(this.KEYS);
      let cleared = 0;

      for (const key of keys) {
        const cacheKey = this.getCacheKey(key, portalId);
        const db = await this.openDatabase();

        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const getRequest = store.get(cacheKey);

          getRequest.onsuccess = () => {
            if (getRequest.result) {
              const deleteRequest = store.delete(cacheKey);
              deleteRequest.onsuccess = () => {
                cleared++;
                db.close();
                resolve();
              };
              deleteRequest.onerror = () => {
                db.close();
                reject(deleteRequest.error);
              };
            } else {
              db.close();
              resolve();
            }
          };

          getRequest.onerror = () => {
            db.close();
            reject(getRequest.error);
          };

          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        });
      }

      console.log(`[CacheManager] Cleared ${cleared} cache entries for portal ${portalId}`);
      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to clear portal cache:', error);
      return false;
    }
  }

  /**
   * Clear all IPTV cache
   */
  static async clearAll(): Promise<boolean> {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const getAllKeysRequest = store.getAllKeys();

        getAllKeysRequest.onsuccess = () => {
          const allKeys = getAllKeysRequest.result;
          const keysToRemove = allKeys.filter((key) => 
            typeof key === 'string' && key.startsWith('iptv-')
          );

          let removed = 0;
          let pending = keysToRemove.length;

          if (pending === 0) {
            console.log(`[CacheManager] Cleared all cache (0 entries)`);
            db.close();
            resolve(true);
            return;
          }

          keysToRemove.forEach((key) => {
            const deleteRequest = store.delete(key);
            
            deleteRequest.onsuccess = () => {
              removed++;
              pending--;
              if (pending === 0) {
                console.log(`[CacheManager] Cleared all cache (${removed} entries)`);
                db.close();
                resolve(true);
              }
            };

            deleteRequest.onerror = () => {
              pending--;
              if (pending === 0) {
                console.log(`[CacheManager] Cleared all cache (${removed} entries)`);
                db.close();
                resolve(true);
              }
            };
          });
        };

        getAllKeysRequest.onerror = () => {
          console.error('[CacheManager] Failed to get all keys:', getAllKeysRequest.error);
          db.close();
          reject(getAllKeysRequest.error);
        };

        transaction.onerror = () => {
          console.error('[CacheManager] Transaction error:', transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('[CacheManager] Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      portalId: string;
    }>;
  }> {
    if (!this.isBrowser()) {
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }

    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const getAllRequest = store.getAll();
        const getAllKeysRequest = store.getAllKeys();

        let allValues: any[] = [];
        let allKeys: IDBValidKey[] = [];

        getAllRequest.onsuccess = () => {
          allValues = getAllRequest.result;
        };

        getAllKeysRequest.onsuccess = () => {
          allKeys = getAllKeysRequest.result;
        };

        transaction.oncomplete = () => {
          const entries: Array<{
            key: string;
            size: number;
            age: number;
            portalId: string;
          }> = [];
          let totalSize = 0;

          allKeys.forEach((key, index) => {
            if (typeof key === 'string' && key.startsWith('iptv-')) {
              const value = allValues[index];
              if (value) {
                const size = new Blob([value]).size;
                totalSize += size;

                try {
                  const cacheEntry: CacheEntry<any> = JSON.parse(value);
                  entries.push({
                    key,
                    size,
                    age: Date.now() - cacheEntry.timestamp,
                    portalId: cacheEntry.portalId,
                  });
                } catch {
                  // Invalid cache entry, skip
                }
              }
            }
          });

          db.close();
          resolve({
            totalEntries: entries.length,
            totalSize,
            entries,
          });
        };

        transaction.onerror = () => {
          console.error('[CacheManager] Failed to get stats:', transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('[CacheManager] Failed to get stats:', error);
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }
  }

  // Convenience methods for specific data types
  static async setChannels(portalId: string, channels: any[]): Promise<boolean> {
    return this.set(this.KEYS.CHANNELS, portalId, channels);
  }

  static async getChannels(portalId: string, options?: CacheOptions): Promise<any[] | null> {
    return this.get(this.KEYS.CHANNELS, portalId, options);
  }

  static async setEPG(portalId: string, epg: any): Promise<boolean> {
    return this.set(this.KEYS.EPG, portalId, epg);
  }

  static async getEPG(portalId: string, options?: CacheOptions): Promise<any | null> {
    return this.get(this.KEYS.EPG, portalId, options);
  }

  static async setMovies(portalId: string, movies: any[]): Promise<boolean> {
    return this.set(this.KEYS.MOVIES, portalId, movies);
  }

  static async getMovies(portalId: string, options?: CacheOptions): Promise<any[] | null> {
    return this.get(this.KEYS.MOVIES, portalId, options);
  }

  static async setSeries(portalId: string, series: any[]): Promise<boolean> {
    return this.set(this.KEYS.SERIES, portalId, series);
  }

  static async getSeries(portalId: string, options?: CacheOptions): Promise<any[] | null> {
    return this.get(this.KEYS.SERIES, portalId, options);
  }

  static async setGenres(portalId: string, genres: any[]): Promise<boolean> {
    return this.set(this.KEYS.GENRES, portalId, genres);
  }

  static async getGenres(portalId: string, options?: CacheOptions): Promise<any[] | null> {
    return this.get(this.KEYS.GENRES, portalId, options);
  }
}
