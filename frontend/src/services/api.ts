import axios, { AxiosError } from 'axios';

interface ApiValidationError {
  msg?: unknown;
}

interface ApiErrorResponse {
  detail?: unknown;
}

// ==================================================
// Global API Instance Configuration
// ==================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 180000, // 3-minute timeout for local LLM requests (180,000 ms)
});

// ==================================================
// Request Interceptor
// ==================================================

api.interceptors.request.use(
  (config) => {
    // Add request start time for timeout tracking
    (config as any)._requestStartTime = Date.now();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================================================
// Response Interceptor
// ==================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const now = Date.now();
    
    // Calculate elapsed time
    let elapsedTime = 0;
    if ((error.config as any)?._requestStartTime) {
      elapsedTime = now - (error.config as any)._requestStartTime;
    }

    // Handle specific global errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      
      console.error(`API Request Timeout: The server took too long to respond. Elapsed: ${minutes}m ${seconds}s`);
      
      // Add custom timeout error to be handled by getApiError
      (error as any).isTimeout = true;
      (error as any).elapsedTime = elapsedTime;
    } else if (!error.response) {
      console.error('Network Error: Unable to reach the backend server.');
    }
    
    return Promise.reject(error);
  }
);

// ==================================================
// Centralized Error Message Extractor
// ==================================================

export function getApiError(error: unknown, fallback = 'An unexpected error occurred.') {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    
    // Handle timeout errors specially
    if ((error as any).isTimeout) {
      const elapsedTime = (error as any).elapsedTime || 0;
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      
      if (minutes >= 2) {
        return `The AI is still processing your request. Complex questions may take up to 3 minutes. Please wait... (${minutes}m ${seconds}s elapsed)`;
      }
      return `Still working on your request... (${minutes}m ${seconds}s elapsed)`;
    }
    
    // Handle FastAPI/Pydantic validation errors
    if (responseData?.detail && Array.isArray(responseData.detail)) {
      return responseData.detail
        .map((entry: unknown) => {
          if (typeof entry === 'string') return entry;
          if (typeof entry === 'object' && entry !== null && 'msg' in entry) {
            const message = (entry as ApiValidationError).msg;
            return typeof message === 'string' ? message : String(message);
          }
          return String(entry);
        })
        .join(', ');
    }
    
    // Handle standard string detail
    if (typeof responseData?.detail === 'string') {
      return responseData.detail;
    }

    // Handle network/unreachable errors
    if (!error.response) {
      return 'The backend server is unavailable. Please ensure FastAPI is running.';
    }

    // Handle specific HTTP status codes
    if (error.response.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response.status === 500) {
      return 'An internal server error occurred. Please try again later.';
    }
  }

  // Fallback for non-Axios errors
  return error instanceof Error ? error.message : fallback;
}

export default api;