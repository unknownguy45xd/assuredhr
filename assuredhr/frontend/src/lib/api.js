import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getToken = () =>
  localStorage.getItem("admin_token") || localStorage.getItem("employee_token");

// Single shared apiClient instance
export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

// Always attach token — attached directly at creation, not lazily
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Also patch global axios for any direct axios.get/post calls
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// No-op kept for compatibility — interceptors are now set up at import time
export const setupAxiosAuthInterceptor = () => {};

export default apiClient;