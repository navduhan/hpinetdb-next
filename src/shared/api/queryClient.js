const dataCache = new Map();
const inflightCache = new Map();

export function clearQueryCache() {
  dataCache.clear();
  inflightCache.clear();
}

export async function fetchQuery(key, fetcher, options = {}) {
  const staleTime = options.staleTime ?? 30_000;
  const dedupe = options.dedupe ?? true;
  const now = Date.now();
  const cached = dataCache.get(key);

  if (cached && now - cached.timestamp < staleTime) {
    return cached.data;
  }

  if (dedupe && inflightCache.has(key)) {
    return inflightCache.get(key);
  }

  const promise = fetcher()
    .then((data) => {
      dataCache.set(key, { data, timestamp: Date.now() });
      inflightCache.delete(key);
      return data;
    })
    .catch((error) => {
      inflightCache.delete(key);
      throw error;
    });

  if (dedupe) {
    inflightCache.set(key, promise);
  }
  return promise;
}
