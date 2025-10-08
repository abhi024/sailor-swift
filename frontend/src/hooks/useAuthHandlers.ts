import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ROUTES } from "../constants/routes";

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
      let response;
      if (isSignup) {
        response = await signup(data.email, data.password);
      } else {
        response = await login(data.email, data.password);
      }

      if (response.user) {
        navigate(ROUTES.DASHBOARD);
      }
    } catch {
      const errorMessage = isSignup ? "Signup failed" : "Login failed";
      setApiError(errorMessage);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setApiError("");

    try {
      const response = await googleAuth(credential);

      if (response.user) {
        navigate(ROUTES.DASHBOARD);
      }
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
      const response = await walletAuth(address);

      if (response.user) {
        navigate(ROUTES.DASHBOARD);
      }
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
