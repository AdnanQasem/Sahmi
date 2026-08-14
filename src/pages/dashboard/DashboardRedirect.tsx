import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Redirects /dashboard to the role-specific dashboard.
 * Staff → /dashboard/admin
 * Investor → /dashboard/investor
 * Entrepreneur → /dashboard/entrepreneur
 */
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_staff) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (user.user_type === "investor") {
    return <Navigate to="/dashboard/investor" replace />;
  }

  return <Navigate to="/dashboard/entrepreneur" replace />;
};

export default DashboardRedirect;
