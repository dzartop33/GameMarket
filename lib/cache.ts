const cache = new Map<string, { data: any; time: number }>();

// Увеличили TTL до 5 минут
const CACHE_TTL = 5 * 60 * 1000;

export function getCache(key: string) {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache(key: string, data: any) {
  cache.set(key, { data, time: Date.now() });
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}