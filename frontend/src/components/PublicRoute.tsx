import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";
import { ROUTES } from "../constants/routes";

export function PublicRoute({ children }: React.PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to={ROUTES.DASHBOARD} />
  );
}
