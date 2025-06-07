import axios from "axios";
import { logger } from "../utils/logger";

axios.defaults.withCredentials = true;

const Axios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  timeoutErrorMessage: "Request timed out",
});

// Request interceptor for logging
Axios.interceptors.request.use(
  (config) => {
    logger.debug("Axios", `Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    logger.error("Axios", "Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
Axios.interceptors.response.use(
  (response) => {
    logger.debug("Axios", `Response received from ${response.config.url} with status ${response.status}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    if (status === 401) {
      logger.warn("Axios", `Unauthorized request to ${url}`);
    } else if (status >= 500) {
      logger.error("Axios", `Server error (${status}) for ${url}`);
    } else if (status >= 400) {
      logger.warn("Axios", `Client error (${status}) for ${url}`);
    } else {
      logger.error("Axios", `Network error for ${url}:`, error.message);
    }
    
    return Promise.reject(error);
  }
);

export default Axios;