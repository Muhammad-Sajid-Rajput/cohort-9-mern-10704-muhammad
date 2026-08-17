import axios from "axios";
import { API_CONSTANTS } from "../constants/api";

export const apiClient = axios.create({
  baseURL: API_CONSTANTS.BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry)
      return Promise.reject(error);
    if (
      originalRequest.url?.match(
        /\/(signin|signup|refreshToken|verify|reset-password|forgot-password)(\/|$)/,
      )
    )
      return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) =>
        failedQueue.push({ resolve, reject }),
      ).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.get(API_CONSTANTS.BASE_URL + API_CONSTANTS.AUTH.REFRESH, {
        withCredentials: true,
      });
      processQueue(null);
      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err);
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
