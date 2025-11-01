/**
 * CacheManager - Smart caching system for IPTV data
 * Handles localStorage operations with TTL and portal-specific caching
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

  // Cache key prefixes
  private static readonly KEYS = {
    CHANNELS: 'iptv-channels',
    EPG: 'iptv-epg',
    MOVIES: 'iptv-movies',
    SERIES: 'iptv-series',
    GENRES: 'iptv-genres',
  };

  /**
   * Check if we're in a browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
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
  static set<T>(
    key: string,
    portalId: string,
    data: T
  ): boolean {
    if (!this.isBrowser()) {
      console.warn('CacheManager: localStorage not available');
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
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
      console.log(`[CacheManager] Cached ${key} for portal ${portalId}`, {
        dataSize: JSON.stringify(data).length,
        timestamp: new Date(cacheEntry.timestamp).toISOString(),
      });

      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to set cache:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[CacheManager] Storage quota exceeded, clearing old cache');
        this.clearAll();
      }
      return false;
    }
  }

  /**
   * Get data from cache if valid
   */
  static get<T>(
    key: string,
    portalId: string,
    options: CacheOptions = {}
  ): T | null {
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
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        console.log(`[CacheManager] No cache found for ${key}`);
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);

      // Validate cache version
      if (cacheEntry.version !== this.CACHE_VERSION) {
        console.log(`[CacheManager] Cache version mismatch for ${key}, invalidating`);
        this.remove(key, portalId);
        return null;
      }

      // Validate portal ID
      if (cacheEntry.portalId !== portalId) {
        console.log(`[CacheManager] Portal ID mismatch for ${key}, invalidating`);
        this.remove(key, portalId);
        return null;
      }

      // Check if cache is stale
      const age = Date.now() - cacheEntry.timestamp;
      const isStale = age > ttl;

      if (isStale) {
        console.log(`[CacheManager] Cache expired for ${key}`, {
          age: Math.round(age / 1000 / 60),
          ttl: Math.round(ttl / 1000 / 60),
        });
        return null;
      }

      console.log(`[CacheManager] Cache hit for ${key}`, {
        age: Math.round(age / 1000 / 60) + ' minutes',
        dataSize: JSON.stringify(cacheEntry.data).length,
      });

      return cacheEntry.data;
    } catch (error) {
      console.error('[CacheManager] Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static has(
    key: string,
    portalId: string,
    options: CacheOptions = {}
  ): boolean {
    return this.get(key, portalId, options) !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  static getAge(key: string, portalId: string): number | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key, portalId);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      return Date.now() - cacheEntry.timestamp;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cache is stale
   */
  static isStale(
    key: string,
    portalId: string,
    ttl: number = this.DEFAULT_TTL
  ): boolean {
    const age = this.getAge(key, portalId);
    if (age === null) return true;
    return age > ttl;
  }

  /**
   * Remove specific cache entry
   */
  static remove(key: string, portalId: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(key, portalId);
      localStorage.removeItem(cacheKey);
      console.log(`[CacheManager] Removed cache for ${key}`);
      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to remove cache:', error);
      return false;
    }
  }

  /**
   * Clear all cache for a specific portal
   */
  static clearPortal(portalId: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const keys = Object.values(this.KEYS);
      let cleared = 0;

      keys.forEach((key) => {
        const cacheKey = this.getCacheKey(key, portalId);
        if (localStorage.getItem(cacheKey)) {
          localStorage.removeItem(cacheKey);
          cleared++;
        }
      });

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
  static clearAll(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const keysToRemove: string[] = [];
      
      // Find all IPTV cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('iptv-')) {
          keysToRemove.push(key);
        }
      }

      // Remove all found keys
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      console.log(`[CacheManager] Cleared all cache (${keysToRemove.length} entries)`);
      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    totalEntries: number;
    totalSize: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      portalId: string;
    }>;
  } {
    if (!this.isBrowser()) {
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }

    const entries: Array<{
      key: string;
      size: number;
      age: number;
      portalId: string;
    }> = [];
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('iptv-')) {
          const value = localStorage.getItem(key);
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
      }

      return {
        totalEntries: entries.length,
        totalSize,
        entries,
      };
    } catch (error) {
      console.error('[CacheManager] Failed to get stats:', error);
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }
  }

  // Convenience methods for specific data types
  static setChannels(portalId: string, channels: any[]): boolean {
    return this.set(this.KEYS.CHANNELS, portalId, channels);
  }

  static getChannels(portalId: string, options?: CacheOptions): any[] | null {
    return this.get(this.KEYS.CHANNELS, portalId, options);
  }

  static setEPG(portalId: string, epg: any): boolean {
    return this.set(this.KEYS.EPG, portalId, epg);
  }

  static getEPG(portalId: string, options?: CacheOptions): any | null {
    return this.get(this.KEYS.EPG, portalId, options);
  }

  static setMovies(portalId: string, movies: any[]): boolean {
    return this.set(this.KEYS.MOVIES, portalId, movies);
  }

  static getMovies(portalId: string, options?: CacheOptions): any[] | null {
    return this.get(this.KEYS.MOVIES, portalId, options);
  }

  static setSeries(portalId: string, series: any[]): boolean {
    return this.set(this.KEYS.SERIES, portalId, series);
  }

  static getSeries(portalId: string, options?: CacheOptions): any[] | null {
    return this.get(this.KEYS.SERIES, portalId, options);
  }

  static setGenres(portalId: string, genres: any[]): boolean {
    return this.set(this.KEYS.GENRES, portalId, genres);
  }

  static getGenres(portalId: string, options?: CacheOptions): any[] | null {
    return this.get(this.KEYS.GENRES, portalId, options);
  }
}
