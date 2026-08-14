interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

class RedisMock {
  private store = new Map<string, CacheEntry>();

  constructor() {
    // Periodically clean up expired keys
    const interval = setInterval(() => this.cleanupExpired(), 60000);
    // Prevent this timer from keeping the process alive in Node
    if (interval.unref) {
      interval.unref();
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.expiresAt === null) return false;
    return Date.now() > entry.expiresAt;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: 'EX', duration?: number): Promise<'OK'> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.store.set(key, { value: String(value), expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    let val = 0;
    let expiresAt: number | null = null;
    
    if (entry && !this.isExpired(entry)) {
      val = parseInt(entry.value, 10) || 0;
      expiresAt = entry.expiresAt;
    }
    
    val += 1;
    this.store.set(key, { value: String(val), expiresAt });
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return 0;
    
    entry.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }
}

const redisMock = new RedisMock();
export default redisMock;
