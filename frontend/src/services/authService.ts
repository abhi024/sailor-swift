import {
  type AuthResponse,
  type LoginRequest,
  type SignupRequest,
  type User,
} from "../types/auth";
import { apiClient } from "./client";
import Cookies from "js-cookie";

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);
    const authData = response.data;

    // Store tokens in cookies on the frontend side
    Cookies.set("access_token", authData.accessToken, { expires: 1/48 }); // 30 minutes
    Cookies.set("refresh_token", authData.refreshToken, { expires: 7 }); // 7 days

    return authData;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/signup", data);
    const authData = response.data;

    // Store tokens in cookies on the frontend side
    Cookies.set("access_token", authData.accessToken, { expires: 1/48 }); // 30 minutes
    Cookies.set("refresh_token", authData.refreshToken, { expires: 7 }); // 7 days

    return authData;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/refresh", { refresh_token: refreshToken });
    const authData = response.data;

    // Store new tokens in cookies
    Cookies.set("access_token", authData.accessToken, { expires: 1/48 }); // 30 minutes
    Cookies.set("refresh_token", authData.refreshToken, { expires: 7 }); // 7 days

    return authData;
  },

  googleAuth: async (googleToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/google", {
      google_token: googleToken
    });
    const authData = response.data;

    // Store tokens in cookies on the frontend side
    Cookies.set("access_token", authData.accessToken, { expires: 1/48 }); // 30 minutes
    Cookies.set("refresh_token", authData.refreshToken, { expires: 7 }); // 7 days

    return authData;
  },


  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
