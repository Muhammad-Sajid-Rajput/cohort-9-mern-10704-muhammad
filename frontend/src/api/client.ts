import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_CONSTANTS } from '../constants/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

export const apiClient = axios.create({
  baseURL: API_CONSTANTS.BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      throw error;
    }

    if (
      originalRequest.url?.match(
        /\/(signin|signup|refreshToken|verify|resetPassword|forgotPassword|me)(\/|$)/,
      )
    ) {
      throw error;
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    isRefreshing = true;

    try {
      await axios.post(API_CONSTANTS.BASE_URL + API_CONSTANTS.AUTH.REFRESH, {}, {
        withCredentials: true,
      });
      processQueue(null);
      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err);
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw err;
    } finally {
      isRefreshing = false;
    }
  },
);
