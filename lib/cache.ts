const cache = new Map<string, { data: any; time: number }>();

const CACHE_TTL = 30000;

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