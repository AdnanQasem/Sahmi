import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface ProtectedRouteProps {
  allowedUserTypes?: Array<"investor" | "entrepreneur" | "admin">;
  requireStaff?: boolean;
  redirectTo?: string;
}

const ProtectedRoute = ({ allowedUserTypes, requireStaff = false, redirectTo = "/" }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        {t("auth.checkingSession")}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireStaff && !user?.is_staff) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedUserTypes?.length && (!user || !allowedUserTypes.includes(user.user_type))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
