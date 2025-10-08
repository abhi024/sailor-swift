import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { wagmiConfig } from "./config/wagmi";
import { ROUTES } from "./constants/routes";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("VITE_GOOGLE_CLIENT_ID environment variable is not set");
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <GoogleOAuthProvider clientId={clientId || ""}>
            <Router>
              <AuthProvider>
                <Routes>
                  <Route
                    path={ROUTES.HOME}
                    element={<Navigate to={ROUTES.DASHBOARD} />}
                  />
                  <Route
                    path={ROUTES.LOGIN}
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path={ROUTES.SIGNUP}
                    element={
                      <PublicRoute>
                        <SignupPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path={ROUTES.DASHBOARD}
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </AuthProvider>
            </Router>
          </GoogleOAuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
