const DEFAULT_PROD_API_BASE_URL = "https://kaabil.net/hpinetbackend";
const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const ENV_BASE_URL = (import.meta.env.VITE_BASE_URL || "").trim();
const RESOLVED_API_BASE_URL = import.meta.env.DEV
  ? "/hpinetbackend"
  : (ENV_API_BASE_URL || DEFAULT_PROD_API_BASE_URL);
const RESOLVED_BASE_URL = import.meta.env.DEV
  ? "/"
  : (ENV_BASE_URL || "/");

export const APP_CONFIG = {
  baseUrl: RESOLVED_BASE_URL,
  apiBaseUrl: RESOLVED_API_BASE_URL.replace(/\/$/, "")
};
