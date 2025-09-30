import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../LoginPage";
import { mockAuthContext, mockApiResponse } from "../../test/test-utils";

// Mock the auth service
vi.mock("../../services/authService", () => ({
  authService: {
    login: vi.fn(),
    googleAuth: vi.fn(),
    walletAuth: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    signup: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

// Mock Google OAuth
vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <button
      data-testid="google-login-button"
      onClick={() => onSuccess({ credential: "mock-credential" })}
    >
      Sign in with Google
    </button>
  ),
}));

// Mock WalletConnect
vi.mock("../../components/WalletConnectButton", () => ({
  WalletConnectButton: ({ onSuccess, onError }: any) => (
    <button
      data-testid="wallet-connect-button"
      onClick={() => onSuccess("0x123...abc")}
    >
      Connect Wallet
    </button>
  ),
}));

describe("LoginPage", () => {
  const mockLogin = vi.fn();
  const mockGoogleAuth = vi.fn();
  const mockWalletAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form correctly", () => {
    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^sign in$/i })
    ).toBeInTheDocument();

    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it("handles form submission with valid data", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(mockApiResponse.login);

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Fill out form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Submit form
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("displays validation errors for invalid form data", async () => {
    const user = userEvent.setup();

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Submit form without filling fields
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("displays error message on login failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Any error"));

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });

  it("handles Google OAuth login", async () => {
    const user = userEvent.setup();
    mockGoogleAuth.mockResolvedValue(mockApiResponse.login);

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Click Google login button
    await user.click(screen.getByTestId("google-login-button"));

    await waitFor(() => {
      expect(mockGoogleAuth).toHaveBeenCalledWith("mock-credential");
    });
  });

  it("handles wallet connection login", async () => {
    const user = userEvent.setup();
    mockWalletAuth.mockResolvedValue(mockApiResponse.login);

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Click wallet connect button
    await user.click(screen.getByTestId("wallet-connect-button"));

    await waitFor(() => {
      expect(mockWalletAuth).toHaveBeenCalledWith("0x123...abc");
    });
  });

  it("shows loading state during form submission", async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    // Check for loading state
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: /signing in/i });
    expect(submitButton).toBeDisabled();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Enter invalid email
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("validates password length", async () => {
    const user = userEvent.setup();

    render(<LoginPage />, {
      authValue: {
        ...mockAuthContext,
        login: mockLogin,
        googleAuth: mockGoogleAuth,
        walletAuth: mockWalletAuth,
      },
    });

    // Enter short password
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
