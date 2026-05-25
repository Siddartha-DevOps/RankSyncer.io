import { KeywordResearchResult } from './types';
import fs from 'fs';
import path from 'path';

export class KeywordCacheManager {
  private cache: Map<string, { result: KeywordResearchResult; expiresAt: number }> = new Map();
  private cacheFile = path.join(process.cwd(), 'metadata_keywords_cache.json');
  private defaultTtl = 24 * 60 * 60 * 1000; // 24 Hours cache duration

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const raw = fs.readFileSync(this.cacheFile, 'utf-8');
        const parsed = JSON.parse(raw);
        const now = Date.now();
        
        for (const [key, item] of Object.entries(parsed)) {
          const typedItem = item as { result: KeywordResearchResult; expiresAt: number };
          if (typedItem.expiresAt > now) {
            this.cache.set(key, typedItem);
          }
        }
        console.log(`[KEYWORD CACHE]: Loaded ${this.cache.size} cached items from disk.`);
      }
    } catch (e: any) {
      console.warn('[KEYWORD CACHE]: Failed to load cache from disk, starting empty:', e.message);
    }
  }

  private saveToDisk() {
    try {
      const obj: { [key: string]: any } = {};
      const now = Date.now();
      
      for (const [key, item] of this.cache.entries()) {
        if (item.expiresAt > now) {
          obj[key] = item;
        }
      }
      
      fs.writeFileSync(this.cacheFile, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('[KEYWORD CACHE]: Failed to save cache output to disk:', e.message);
    }
  }

  private generateKey(keyword: string, country: string, language: string, device: string): string {
    return `${keyword.trim().toLowerCase()}_${country.toLowerCase()}_${language.toLowerCase()}_${device.toLowerCase()}`;
  }

  /**
   * Retrieves a cached keyword research result if valid and unexpired
   */
  public get(keyword: string, country: string, language: string, device: string): KeywordResearchResult | null {
    const key = this.generateKey(keyword, country, language, device);
    const cachedItem = this.cache.get(key);
    
    if (cachedItem) {
      if (cachedItem.expiresAt > Date.now()) {
        console.log(`[KEYWORD CACHE]: Cache HIT for key "${key}"`);
        return {
          ...cachedItem.result,
          cached: true
        };
      } else {
        // Expired, cleanup
        this.cache.delete(key);
        this.saveToDisk();
      }
    }
    
    return null;
  }

  /**
   * Saves a lookup result in the cache
   */
  public set(result: KeywordResearchResult, ttlMs: number = this.defaultTtl): void {
    const key = this.generateKey(result.keyword, result.country, result.language, result.device);
    const expiresAt = Date.now() + ttlMs;
    
    this.cache.set(key, {
      result,
      expiresAt
    });
    
    console.log(`[KEYWORD CACHE]: Cached lookup item for key "${key}"`);
    this.saveToDisk();
  }

  /**
   * Clears the entire research cache
   */
  public clear(): void {
    this.cache.clear();
    this.saveToDisk();
  }
}

export const kwCacheManager = new KeywordCacheManager();
