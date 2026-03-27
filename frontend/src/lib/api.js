import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getToken = () =>
  localStorage.getItem("admin_token") || localStorage.getItem("employee_token");

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

let defaultAxiosInterceptorId = null;
let apiClientInterceptorId = null;

const attachAuthHeader = (config = {}) => {
  const token = getToken();
  if (!token) return config;

  const headers = config.headers || {};
  const hasAuthorization = headers.Authorization || headers.authorization;

  if (hasAuthorization) return config;

  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    return { ...config, headers };
  }

  return { ...config, headers: { ...headers, Authorization: `Bearer ${token}` } };
};

export const setupAxiosAuthInterceptor = () => {
  if (defaultAxiosInterceptorId === null) {
    defaultAxiosInterceptorId = axios.interceptors.request.use(attachAuthHeader);
  }

  if (apiClientInterceptorId === null) {
    apiClientInterceptorId = apiClient.interceptors.request.use(attachAuthHeader);
  }
};
