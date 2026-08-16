const HEALTH_CACHE_MS = 5000;

let backendReady = null;
let lastCheckedAt = 0;

const getHealthUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api/health';
  }
  return '/api/health';
};

export const isBackendAvailable = async () => {
  if (!import.meta.env.DEV) {
    return true;
  }

  const now = Date.now();
  if (backendReady !== null && now - lastCheckedAt < HEALTH_CACHE_MS) {
    return backendReady;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(getHealthUrl(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      backendReady = false;
    } else {
      const data = await response.json();
      backendReady = data.db === 'connected';
    }
  } catch {
    backendReady = false;
  }

  lastCheckedAt = Date.now();
  return backendReady;
};

export const resetBackendAvailabilityCache = () => {
  backendReady = null;
  lastCheckedAt = 0;
};
