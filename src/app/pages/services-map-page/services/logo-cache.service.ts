import { Injectable } from '@angular/core';

export interface LogoCacheEntry {
  url: string;
  loadedAt: number;
  lastAccessedAt: number;
  valid: boolean;
  accessCount: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  validCount: number;
  invalidCount: number;
  hitRate: number;
  mostAccessed: Array<{ serviceId: number; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class LogoCacheService {
  private readonly DEFAULT_LOGO = 'assets/images/cyclopick-logo.svg';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minut
  private readonly MAX_CACHE_SIZE = 500; // Maksymalnie 500 logo w cache
  private readonly CLEANUP_THRESHOLD = 450; // Kiedy zacząć czyszczenie
  
  private cache = new Map<number, LogoCacheEntry>();
  private loadingUrls = new Set<string>();
  
  // Statystyki
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    // Periodyczne czyszczenie co godzinę
    setInterval(() => this.cleanupExpiredEntries(), 60 * 60 * 1000);
    
    // Preload default logo
    this.preloadDefaultLogo();
  }

  /**
   * Preload domyślnego logo przy starcie
   */
  private preloadDefaultLogo(): void {
    const img = new Image();
    img.src = this.DEFAULT_LOGO;
  }

  /**
   * Pobiera URL logo dla serwisu z cache lub zwraca domyślne logo
   */
  getLogoUrl(serviceId: number, originalUrl?: string): string {
    // Jeśli nie ma oryginalnego URL, zwróć domyślne logo
    if (!originalUrl || originalUrl.trim() === '') {
      return this.DEFAULT_LOGO;
    }

    const cached = this.cache.get(serviceId);
    
    // Jeśli jest w cache i jest ważne
    if (cached && this.isCacheValid(cached)) {
      // Aktualizuj statystyki dostępu
      cached.lastAccessedAt = Date.now();
      cached.accessCount++;
      this.cacheHits++;
      
      return cached.valid ? cached.url : this.DEFAULT_LOGO;
    }

    // Cache miss
    this.cacheMisses++;

    // Sprawdź limit cache przed dodaniem
    if (this.cache.size >= this.CLEANUP_THRESHOLD) {
      this.performLRUCleanup();
    }

    // Dodaj do cache
    this.cache.set(serviceId, {
      url: originalUrl,
      loadedAt: Date.now(),
      lastAccessedAt: Date.now(),
      valid: true,
      accessCount: 1
    });

    // Pre-load w tle
    this.preloadImage(serviceId, originalUrl);

    return originalUrl;
  }

  /**
   * Pre-loading obrazu w tle
   */
  private preloadImage(serviceId: number, url: string): void {
    // Jeśli już ładujemy ten URL, nie rób tego ponownie
    if (this.loadingUrls.has(url)) {
      return;
    }

    this.loadingUrls.add(url);

    const img = new Image();
    
    img.onload = () => {
      const cached = this.cache.get(serviceId);
      if (cached) {
        cached.valid = true;
        cached.url = url;
      }
      this.loadingUrls.delete(url);
    };

    img.onerror = () => {
      const cached = this.cache.get(serviceId);
      if (cached) {
        cached.valid = false;
        cached.url = this.DEFAULT_LOGO;
      }
      this.loadingUrls.delete(url);
      console.warn(`Failed to preload logo for service ${serviceId}: ${url}`);
    };

    img.src = url;
  }

  /**
   * Sprawdza czy cache entry jest jeszcze ważny
   */
  private isCacheValid(entry: LogoCacheEntry): boolean {
    const now = Date.now();
    return (now - entry.loadedAt) < this.CACHE_DURATION;
  }

  /**
   * Czyści wygasłe wpisy z cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const entriesToDelete: number[] = [];

    this.cache.forEach((entry, serviceId) => {
      if ((now - entry.loadedAt) >= this.CACHE_DURATION) {
        entriesToDelete.push(serviceId);
      }
    });

    entriesToDelete.forEach(id => this.cache.delete(id));
    
    if (entriesToDelete.length > 0) {
      console.log(`LogoCacheService: Cleaned up ${entriesToDelete.length} expired entries`);
    }
  }

  /**
   * Czyszczenie cache według strategii LRU (Least Recently Used)
   * Usuwa 20% najmniej używanych wpisów
   */
  private performLRUCleanup(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sortuj według ostatniego dostępu (najstarsze pierwsze)
    entries.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    
    // Usuń 20% najmniej używanych
    const toRemove = Math.floor(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`LogoCacheService: LRU cleanup removed ${toRemove} entries. Cache size: ${this.cache.size}`);
  }

  /**
   * Agresywne czyszczenie cache według strategii LRU + access count
   * Używane gdy przekroczono MAX_CACHE_SIZE
   */
  private performAggressiveCleanup(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sortuj według kombinacji: lastAccessed i accessCount
    // Im starszy dostęp i mniej użyć, tym wyższy priorytet do usunięcia
    entries.sort((a, b) => {
      const scoreA = a[1].lastAccessedAt / 1000 + a[1].accessCount * 10000;
      const scoreB = b[1].lastAccessedAt / 1000 + b[1].accessCount * 10000;
      return scoreA - scoreB;
    });
    
    // Usuń połowę wpisów
    const toRemove = Math.floor(entries.length * 0.5);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`LogoCacheService: Aggressive cleanup removed ${toRemove} entries. Cache size: ${this.cache.size}`);
  }

  /**
   * Oznacza logo jako nieważne (np. po błędzie ładowania)
   */
  public markAsInvalid(serviceId: number): void {
    const cached = this.cache.get(serviceId);
    if (cached) {
      cached.valid = false;
      cached.url = this.DEFAULT_LOGO;
    }
  }

  /**
   * Preload batch logo - użyteczne gdy ładujesz listę serwisów
   * Inteligentnie priorytetyzuje najważniejsze logo
   */
  public preloadBatch(
    services: Array<{ id: number; logoUrl?: string }>,
    priority: 'high' | 'low' = 'low'
  ): void {
    const toPreload = services.filter(s => s.logoUrl && s.logoUrl.trim() !== '');
    
    if (priority === 'high') {
      // Wysokie priorytety - ładuj natychmiast
      toPreload.forEach(service => {
        this.getLogoUrl(service.id, service.logoUrl);
      });
    } else {
      // Niskie priorytety - ładuj z małym opóźnieniem (debounce)
      setTimeout(() => {
        toPreload.forEach(service => {
          if (!this.cache.has(service.id)) {
            this.getLogoUrl(service.id, service.logoUrl);
          }
        });
      }, 100);
    }
  }

  /**
   * Czyści cały cache (użyteczne przy wylogowaniu lub zmianie kontekstu)
   */
  public clearCache(): void {
    this.cache.clear();
    this.loadingUrls.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('LogoCacheService: Cache cleared');
  }

  /**
   * Pobiera szczegółowe statystyki cache (do debugowania i monitorowania)
   */
  public getCacheStats(): CacheStats {
    let validCount = 0;
    let invalidCount = 0;
    const accessCounts: Array<{ serviceId: number; count: number }> = [];

    this.cache.forEach((entry, serviceId) => {
      if (this.isCacheValid(entry)) {
        if (entry.valid) {
          validCount++;
        } else {
          invalidCount++;
        }
      }
      accessCounts.push({ serviceId, count: entry.accessCount });
    });

    // Sortuj według liczby dostępów
    accessCounts.sort((a, b) => b.count - a.count);

    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      validCount,
      invalidCount,
      hitRate: Math.round(hitRate * 100) / 100,
      mostAccessed: accessCounts.slice(0, 10) // Top 10
    };
  }

  /**
   * Loguje statystyki do konsoli (pomocne przy debugowaniu)
   */
  public logStats(): void {
    const stats = this.getCacheStats();
    console.group('📊 Logo Cache Statistics');
    console.log(`Cache Size: ${stats.size}/${stats.maxSize}`);
    console.log(`Valid Entries: ${stats.validCount}`);
    console.log(`Invalid Entries: ${stats.invalidCount}`);
    console.log(`Hit Rate: ${stats.hitRate}%`);
    console.log('Most Accessed:', stats.mostAccessed.slice(0, 5));
    console.groupEnd();
  }
}