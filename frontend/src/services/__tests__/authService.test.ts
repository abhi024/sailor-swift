import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { AxiosError } from "axios";
import { mockUser, mockApiResponse } from "../../test/test-utils";

// Mock axios to avoid circular dependency issues
vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }))
    }
  };
});

// Mock cookies
vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Import after mocking
import { authService } from "../authService";
import { apiClient } from "../client";

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("signup", () => {
    it("makes POST request to /auth/signup with user data", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
      };


      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockApiResponse.signup,
      });

      const result = await authService.signup(userData);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/signup", userData);
      expect(result).toEqual(mockApiResponse.signup);
    });

    it("throws error when signup fails", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
      };

      const errorResponse = new AxiosError("Email already registered");

      vi.mocked(apiClient.post).mockRejectedValue(errorResponse);

      await expect(authService.signup(userData)).rejects.toThrow(
        "Email already registered"
      );
    });
  });

  describe("login", () => {
    it("makes POST request to /auth/login with credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockApiResponse.login,
      });

      const result = await authService.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", credentials);
      expect(result).toEqual(mockApiResponse.login);
    });

    it("throws error when login fails", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const errorResponse = new AxiosError("Invalid credentials");

      vi.mocked(apiClient.post).mockRejectedValue(errorResponse);

      await expect(authService.login(credentials)).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("googleAuth", () => {
    it("makes POST request to /auth/google with credential", async () => {
      const credential = "google-credential-123";

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockApiResponse.login,
      });

      const result = await authService.googleAuth(credential);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/google", {
        google_token: credential,
      });
      expect(result).toEqual(mockApiResponse.login);
    });

    it("throws error when Google auth fails", async () => {
      const credential = "invalid-credential";

      const errorResponse = new AxiosError("Invalid Google token");

      vi.mocked(apiClient.post).mockRejectedValue(errorResponse);

      await expect(authService.googleAuth(credential)).rejects.toThrow(
        "Invalid Google token"
      );
    });
  });

  describe("walletAuth", () => {
    it("makes POST request to /auth/wallet with wallet address", async () => {
      const walletAddress = "0x123...abc";

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockApiResponse.login,
      });

      const result = await authService.walletAuth(walletAddress);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/wallet", {
        wallet_address: walletAddress,
      });
      expect(result).toEqual(mockApiResponse.login);
    });

    it("throws error when wallet auth fails", async () => {
      const walletAddress = "invalid-address";

      const errorResponse = new AxiosError("Invalid wallet address");

      vi.mocked(apiClient.post).mockRejectedValue(errorResponse);

      await expect(authService.walletAuth(walletAddress)).rejects.toThrow(
        "Invalid wallet address"
      );
    });
  });

  describe("logout", () => {
    it("makes POST request to /auth/logout", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { message: "Successfully logged out" },
      });

      const result = await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
      expect(result).toBeUndefined();
    });

    it("handles logout errors gracefully", async () => {
      const errorResponse = new AxiosError("Token invalid");

      vi.mocked(apiClient.post).mockRejectedValue(errorResponse);

      await expect(authService.logout()).rejects.toThrow("Token invalid");
    });
  });

  describe("refreshToken", () => {
    it("makes POST request to /auth/refresh with refresh token", async () => {
      const refreshTokenValue = "refresh-token-123";

      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        },
      });

      const result = await authService.refresh(refreshTokenValue);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh", {
        refresh_token: refreshTokenValue,
      });
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("throws error when refresh fails", async () => {
      const refreshTokenValue = "invalid-refresh-token";

      const errorResponse = new AxiosError("Invalid refresh token");

      vi.mocked(apiClient.post).mockRejectedValue(errorResponse);

      await expect(authService.refresh(refreshTokenValue)).rejects.toThrow(
        "Invalid refresh token"
      );
    });
  });

  describe("getCurrentUser", () => {
    it("makes GET request to /auth/me", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockUser,
      });

      const result = await authService.getMe();

      expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockUser);
    });

    it("throws error when getting current user fails", async () => {
      const errorResponse = new AxiosError("Not authenticated");

      vi.mocked(apiClient.get).mockRejectedValue(errorResponse);

      await expect(authService.getMe()).rejects.toThrow("Not authenticated");
    });
  });

  describe("error handling", () => {
    it("handles network errors", async () => {
      const networkError = new Error("Network Error");
      vi.mocked(apiClient.post).mockRejectedValue(networkError);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Network Error");
    });

    it("handles errors without response data", async () => {
      const errorWithoutResponse = {
        message: "Something went wrong",
      };
      vi.mocked(apiClient.post).mockRejectedValue(errorWithoutResponse);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Something went wrong");
    });

    it("handles errors with different status codes", async () => {
      const serverError = new AxiosError("Internal server error");

      vi.mocked(apiClient.post).mockRejectedValue(serverError);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Internal server error");
    });
  });
});
