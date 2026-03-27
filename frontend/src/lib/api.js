import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getToken = () =>
  localStorage.getItem("admin_token") || localStorage.getItem("employee_token");

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

const attachAuthHeader = (config = {}) => {
  const token = getToken();
  if (!token) return config;

  const headers = config.headers || {};
  if (headers.Authorization || headers.authorization) return config;

  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    return { ...config, headers };
  }

  return {
    ...config,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  };
};

let defaultAxiosInterceptorId = null;
let apiClientInterceptorId = null;

export const setupAxiosAuthInterceptor = () => {
  if (defaultAxiosInterceptorId === null) {
    defaultAxiosInterceptorId = axios.interceptors.request.use(attachAuthHeader);
  }

  if (apiClientInterceptorId === null) {
    apiClientInterceptorId = apiClient.interceptors.request.use(attachAuthHeader);
  }
};

export default apiClient;
