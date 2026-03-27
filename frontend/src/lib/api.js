import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getToken = () =>
  localStorage.getItem("admin_token") || localStorage.getItem("employee_token");

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

const attachAuthHeader = (config) => {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("employee_token");
  console.log("TOKEN:", token);

  if (!token) return config;

  const headers = config.headers || {};
  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("HEADERS:", headers);
  } else {
    headers.Authorization = `Bearer ${token}`;
    config.headers = headers;
    console.log("HEADERS:", config.headers);
  }

  return config;
};

apiClient.interceptors.request.use(attachAuthHeader);

let defaultAxiosInterceptorId = null;
let defaultAxiosInterceptorId = null;
let apiClientInterceptorId = null;

const attachAuthHeader = (config = {}) => {
  const token = getToken();
  console.log("TOKEN:", token);
  if (!token) return config;

  const headers = config.headers || {};
  const hasAuthorization = headers.Authorization || headers.authorization;

  if (hasAuthorization) return config;

  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("HEADERS:", headers);
    return { ...config, headers };
  }

  const nextConfig = { ...config, headers: { ...headers, Authorization: `Bearer ${token}` } };
  console.log("HEADERS:", nextConfig.headers);
  return nextConfig;
    return { ...config, headers };
  }

  return { ...config, headers: { ...headers, Authorization: `Bearer ${token}` } };
};

export const setupAxiosAuthInterceptor = () => {
  if (defaultAxiosInterceptorId === null) {
    defaultAxiosInterceptorId = axios.interceptors.request.use(attachAuthHeader);
  }
};

export default apiClient;

  if (apiClientInterceptorId === null) {
    apiClientInterceptorId = apiClient.interceptors.request.use(attachAuthHeader);
  }
};
