import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { handleMockRequest } from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ─── Case Conversion Utilities ───────────────────────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeys(obj: unknown, transformer: (key: string) => string): unknown {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer));
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Blob) && !(obj instanceof FormData)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[transformer(key)] = transformKeys(value, transformer);
    }
    return result;
  }
  return obj;
}

function toCamelCase(data: unknown): unknown {
  return transformKeys(data, snakeToCamel);
}

function toSnakeCase(data: unknown): unknown {
  return transformKeys(data, camelToSnake);
}

const realClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

realClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Convert camelCase body to snake_case for backend
    if (config.data && !(config.data instanceof FormData) && !(config.data instanceof Blob)) {
      config.data = toSnakeCase(config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

realClient.interceptors.response.use(
  (response) => {
    // Convert snake_case response to camelCase for frontend
    if (response.data && response.config.responseType !== 'blob') {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // HTTPBearer returns 403 when no token is present; treat as 401
    const status = error.response?.status;
    const isAuthError = status === 401 || (status === 403 && !useAuthStore.getState().accessToken);

    if (isAuthError && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(realClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const { access_token } = response.data;
        useAuthStore.getState().setAccessToken(access_token);
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return realClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        useAuthStore.getState().logout();
        // Use replace to avoid back-button loops; only redirect if not already on login
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Mock Client ─────────────────────────────────────────────────────────────

function createMockResponse(method: string, url: string, data?: unknown, params?: Record<string, unknown>): Promise<AxiosResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const result = handleMockRequest(method, url, data, params);
      if (result.status >= 400) {
        reject({
          response: { data: result.data, status: result.status, statusText: 'Error', headers: {}, config: {} },
          isAxiosError: true,
          message: (result.data as { message?: string })?.message || 'Request failed',
        });
      } else {
        resolve({
          data: result.data,
          status: result.status,
          statusText: 'OK',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        });
      }
    }, 100 + Math.random() * 150);
  });
}

const mockClient = {
  get<T = unknown>(url: string, config?: { params?: Record<string, unknown>; responseType?: string }): Promise<AxiosResponse<T>> {
    return createMockResponse('GET', url, undefined, config?.params) as Promise<AxiosResponse<T>>;
  },
  post<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown>; responseType?: string }): Promise<AxiosResponse<T>> {
    return createMockResponse('POST', url, data, config?.params) as Promise<AxiosResponse<T>>;
  },
  put<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<AxiosResponse<T>> {
    return createMockResponse('PUT', url, data, config?.params) as Promise<AxiosResponse<T>>;
  },
  patch<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<AxiosResponse<T>> {
    return createMockResponse('PATCH', url, data, config?.params) as Promise<AxiosResponse<T>>;
  },
  delete<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<AxiosResponse<T>> {
    return createMockResponse('DELETE', url, undefined, config?.params) as Promise<AxiosResponse<T>>;
  },
};

// ─── Export ──────────────────────────────────────────────────────────────────

const apiClient = (USE_MOCK ? mockClient : realClient) as unknown as typeof realClient;

export default apiClient;
