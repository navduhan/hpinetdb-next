import { APP_CONFIG } from "@/shared/api/config";

const RETRIABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createRequestSignal(signal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = timeoutMs
    ? setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs)
    : null;

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }
  };
}

function buildUrl(path, query = {}) {
  const base = String(APP_CONFIG.apiBaseUrl || "").trim();
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const normalizedBase = (base ? new URL(base, origin).toString() : origin).replace(/\/+$/, "");
  const normalizedPath = String(path || "").startsWith("/") ? String(path || "") : `/${String(path || "")}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Generic HTTP request helper with retries and abort support.
 */
export async function request(path, options = {}) {
  const {
    method = "GET",
    query,
    body,
    headers,
    signal,
    retries = 2,
    retryDelayMs = 350,
    timeoutMs = 20_000
  } = options;

  const url = buildUrl(path, query);
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    let requestSignal;
    try {
      const hasJsonBody = body !== undefined && body !== null;
      const normalizedHeaders = {
        Accept: "application/json",
        ...(headers || {})
      };
      if (hasJsonBody && !("Content-Type" in normalizedHeaders)) {
        normalizedHeaders["Content-Type"] = "application/json";
      }

      requestSignal = createRequestSignal(signal, timeoutMs);
      const response = await fetch(url, {
        method,
        signal: requestSignal.signal,
        headers: normalizedHeaders,
        body: hasJsonBody ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const payload = await parseJsonSafe(response);
        const err = new Error(`HTTP ${response.status} for ${url}`);
        err.status = response.status;
        err.payload = payload;

        if (attempt < retries && RETRIABLE_STATUSES.has(response.status)) {
          await sleep(retryDelayMs * 2 ** attempt);
          attempt += 1;
          continue;
        }
        throw err;
      }

      return await parseJsonSafe(response);
    } catch (error) {
      const timedOut = requestSignal?.didTimeout?.() === true;
      if (error.name === "AbortError" && timedOut) {
        const timeoutError = new Error(`Request timed out after ${timeoutMs}ms for ${url}`);
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
      if (error.name === "AbortError") {
        throw error;
      }
      lastError = error;
      if (attempt >= retries) {
        throw lastError;
      }
      await sleep(retryDelayMs * 2 ** attempt);
      attempt += 1;
    } finally {
      requestSignal?.cleanup();
    }
  }

  throw lastError;
}
