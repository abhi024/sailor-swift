import axios from "axios";
import { authService } from "./authService";
import Cookies from "js-cookie";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Bearer token from cookies
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept auth endpoints (login, signup, etc.) - let them handle their own errors
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/auth/google") ||
      originalRequest.url?.includes("/auth/wallet");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await apiClient.post("/auth/refresh", {
            refresh_token: refreshToken,
          });
          const authData = response.data;

          // Store new tokens
          Cookies.set("access_token", authData.accessToken, {
            expires: 1 / 48,
          });
          Cookies.set("refresh_token", authData.refreshToken, { expires: 7 });

          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;

          // Retry the original request
          return apiClient(originalRequest);
        } catch {
          // Refresh failed, redirect to login
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Namespaced API client
export const api = {
  auth: authService,
  // Future services will be added here
  // user: userService,
  // profile: profileService,
};
