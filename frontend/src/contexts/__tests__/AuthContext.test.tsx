import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { mockUser, mockApiResponse } from "../../test/test-utils";
import { authService } from "../../services/authService";
import Cookies from "js-cookie";

// Mock the auth service
vi.mock("../../services/authService", () => ({
  authService: {
    signup: vi.fn(),
    login: vi.fn(),
    googleAuth: vi.fn(),
    walletAuth: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
  },
}));

// Mock cookies
vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock wagmi
const mockDisconnectAsync = vi.fn();
vi.mock("wagmi", () => ({
  useDisconnect: () => ({
    disconnectAsync: mockDisconnectAsync,
  }),
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with no user when no stored tokens", async () => {
    vi.mocked(Cookies.get).mockReturnValue(undefined);
    // Mock getMe to reject when no token (simulate 401)
    vi.mocked(authService).getMe.mockRejectedValue(new Error("No token"));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("loads user from stored tokens on initialization", async () => {
    vi.mocked(Cookies).get.mockImplementation((key) => {
      if (key === "access_token") return "stored-access-token";
      if (key === "refresh_token") return "stored-refresh-token";
      return undefined;
    });
    vi.mocked(authService).getMe.mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    expect(vi.mocked(authService).getMe).toHaveBeenCalled();
  });

  it("handles signup successfully", async () => {
    vi.mocked(authService).signup.mockResolvedValue(mockApiResponse.signup);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const signupData = {
      email: "test@example.com",
      password: "password123",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
    };

    await act(async () => {
      await result.current.signup(signupData.email, signupData.password);
    });

    expect(vi.mocked(authService).signup).toHaveBeenCalledWith({
      email: signupData.email,
      password: signupData.password,
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles login successfully", async () => {
    vi.mocked(authService).login.mockResolvedValue(mockApiResponse.login);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    await act(async () => {
      await result.current.login(loginData.email, loginData.password);
    });

    expect(vi.mocked(authService).login).toHaveBeenCalledWith(loginData);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles Google auth successfully", async () => {
    vi.mocked(authService).googleAuth.mockResolvedValue(mockApiResponse.login);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.googleAuth("google-credential");
    });

    expect(vi.mocked(authService).googleAuth).toHaveBeenCalledWith(
      "google-credential"
    );
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles wallet auth successfully", async () => {
    vi.mocked(authService).walletAuth.mockResolvedValue(mockApiResponse.login);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.walletAuth("0x123...abc");
    });

    expect(vi.mocked(authService).walletAuth).toHaveBeenCalledWith(
      "0x123...abc"
    );
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles logout successfully", async () => {
    // Start with authenticated state
    vi.mocked(Cookies).get.mockImplementation((key: string) => {
      if (key === "access_token") return "stored-access-token";
      if (key === "refresh_token") return "stored-refresh-token";
      return undefined;
    });
    vi.mocked(authService).getMe.mockResolvedValue(mockUser);
    vi.mocked(authService).logout.mockResolvedValue(undefined);
    mockDisconnectAsync.mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockDisconnectAsync).toHaveBeenCalled();
    expect(vi.mocked(authService).logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("handles user data refresh successfully", async () => {
    vi.mocked(Cookies).get.mockImplementation((key: string) => {
      if (key === "access_token") return "stored-access-token";
      return undefined;
    });
    vi.mocked(authService).getMe.mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refetchUser();
    });

    expect(vi.mocked(authService).getMe).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
  });

  it("handles auth errors by logging out", async () => {
    vi.mocked(authService).login.mockRejectedValue(new Error("Auth failed"));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login("test@example.com", "wrong");
      })
    ).rejects.toThrow("Auth failed");

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("throws error when useAuth is used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});
