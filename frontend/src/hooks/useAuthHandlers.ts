import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export function useAuthHandlers() {
  const [apiError, setApiError] = useState("");
  const { login, signup, googleAuth, walletAuth } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (
    data: { email: string; password: string },
    isSignup: boolean
  ) => {
    setApiError("");

    try {
      if (isSignup) {
        await signup(data.email, data.password);
      } else {
        await login(data.email, data.password);
      }
      navigate("/dashboard");
    } catch {
      const errorMessage = isSignup ? "Signup failed" : "Login failed";
      setApiError(errorMessage);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setApiError("");

    try {
      await googleAuth(credential);
      navigate("/dashboard");
    } catch {
      const errorMessage = "Google sign-in failed";
      setApiError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setApiError("Google sign-in was cancelled or failed");
  };

  const handleWalletSuccess = async (address: string) => {
    setApiError("");

    try {
      await walletAuth(address);
      navigate("/dashboard");
    } catch {
      const errorMessage = "Wallet authentication failed";
      setApiError(errorMessage);
    }
  };

  const handleWalletError = (error: string) => {
    setApiError(error);
  };

  return {
    apiError,
    setApiError,
    handleEmailSubmit,
    handleGoogleSuccess,
    handleGoogleError,
    handleWalletSuccess,
    handleWalletError,
  };
}
