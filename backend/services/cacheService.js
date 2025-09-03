const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Redis initialization error:', error);
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, data, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Cache middleware
  cacheMiddleware(ttl = 3600) {
    return async (req, res, next) => {
      if (!this.isConnected || req.method !== 'GET') {
        return next();
      }

      const key = `cache:${req.originalUrl}`;
      const cached = await this.get(key);

      if (cached) {
        return res.json(cached);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (data) => {
        this.set(key, data, ttl);
        return originalJson.call(res, data);
      };

      next();
    };
  }

  // Invalidate cache by pattern
  async invalidatePattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return false;
    }
  }

  // Common cache keys
  keys = {
    news: (page = 1) => `news:page:${page}`,
    newsItem: (id) => `news:item:${id}`,
    matches: (page = 1) => `matches:page:${page}`,
    matchItem: (id) => `match:item:${id}`,
    players: () => 'players:all',
    playerItem: (id) => `player:item:${id}`,
    merchandise: (page = 1) => `merchandise:page:${page}`,
    merchandiseItem: (id) => `merchandise:item:${id}`,
    gallery: (page = 1) => `gallery:page:${page}`,
    stats: () => 'admin:stats'
  };

  // Helper methods for common operations
  async cacheNews(page, data, ttl = 600) {
    return this.set(this.keys.news(page), data, ttl);
  }

  async getCachedNews(page) {
    return this.get(this.keys.news(page));
  }

  async invalidateNewsCache() {
    return this.invalidatePattern('news:*');
  }

  async cacheMatches(page, data, ttl = 600) {
    return this.set(this.keys.matches(page), data, ttl);
  }

  async getCachedMatches(page) {
    return this.get(this.keys.matches(page));
  }

  async invalidateMatchesCache() {
    return this.invalidatePattern('matches:*');
  }
}

module.exports = new CacheService();