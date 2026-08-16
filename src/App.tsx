import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import HomePage from "./pages/HomePage";
import BrowseProjects from "./pages/BrowseProjects";
import ProjectDetails from "./pages/ProjectDetails";
import StartProject from "./pages/StartProject";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import RegisterPage from "./pages/RegisterPage";
import EditProject from "./pages/EditProject";
import NotFound from "./pages/NotFound.tsx";
import DashboardRedirect from "./pages/dashboard/DashboardRedirect";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminProjectsPage from "./pages/dashboard/admin/AdminProjectsPage";
import AdminCategoriesPage from "./pages/dashboard/admin/AdminCategoriesPage";
import AdminUsersPage from "./pages/dashboard/admin/AdminUsersPage";
import AdminInvestmentsPage from "./pages/dashboard/admin/AdminInvestmentsPage";
import AdminMilestonesPage from "./pages/dashboard/admin/AdminMilestonesPage";
import FundsPage from "./pages/dashboard/FundsPage";
import AdminRepaymentsPage from "./pages/dashboard/admin/AdminRepaymentsPage";
import AdminProjectEditPage from "./pages/dashboard/admin/AdminProjectEditPage";
import AdminAuditLogsPage from "./pages/dashboard/admin/AdminAuditLogsPage";
import InvestorDashboard from "./pages/dashboard/InvestorDashboard";
import InvestorTransactionsPage from "./pages/dashboard/InvestorTransactionsPage";
import RepaymentsPage from "./pages/dashboard/RepaymentsPage";
import EntrepreneurDashboard from "./pages/dashboard/EntrepreneurDashboard";
import EntrepreneurAnalyticsPage from "./pages/dashboard/EntrepreneurAnalyticsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import InvestorsPage from "./pages/dashboard/InvestorsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import RouteTitle from "@/components/RouteTitle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <RouteTitle />
        <AuthProvider>
          <Routes>
            {/* Dashboard routes — full-page layout with sidebar, no Navbar/Footer */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
            </Route>
            <Route element={<ProtectedRoute requireStaff redirectTo="/dashboard" />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/admin/projects" element={<AdminProjectsPage />} />
              <Route path="/dashboard/admin/projects/:projectId/edit" element={<AdminProjectEditPage />} />
              <Route path="/dashboard/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/dashboard/admin/users" element={<AdminUsersPage />} />
              <Route path="/dashboard/admin/investments" element={<AdminInvestmentsPage />} />
              <Route path="/dashboard/admin/milestones" element={<AdminMilestonesPage />} />
              <Route path="/dashboard/admin/repayments" element={<AdminRepaymentsPage />} />
              <Route path="/dashboard/admin/funds" element={<FundsPage />} />
              <Route path="/dashboard/admin/messages" element={<MessagesPage />} />
              <Route path="/dashboard/admin/settings" element={<SettingsPage />} />
              <Route path="/dashboard/admin/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/admin/logs" element={<AdminAuditLogsPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedUserTypes={["investor", "admin"]} redirectTo="/dashboard" />}>
              <Route path="/dashboard/investor" element={<InvestorDashboard />} />
              <Route path="/dashboard/investor/transactions" element={<InvestorTransactionsPage />} />
              <Route path="/dashboard/investor/repayments" element={<RepaymentsPage />} />
              <Route path="/dashboard/investor/settings" element={<SettingsPage />} />
              <Route path="/dashboard/investor/messages" element={<MessagesPage />} />
              <Route path="/dashboard/investor/notifications" element={<NotificationsPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedUserTypes={["entrepreneur", "admin"]} redirectTo="/dashboard" />}>
              <Route path="/dashboard/entrepreneur" element={<EntrepreneurDashboard />} />
              <Route path="/dashboard/entrepreneur/analytics" element={<EntrepreneurAnalyticsPage />} />
              <Route path="/dashboard/entrepreneur/settings" element={<SettingsPage />} />
              <Route path="/dashboard/entrepreneur/messages" element={<MessagesPage />} />
              <Route path="/dashboard/entrepreneur/investors" element={<InvestorsPage />} />
              <Route path="/dashboard/entrepreneur/funds" element={<FundsPage />} />
              <Route path="/dashboard/entrepreneur/repayments" element={<RepaymentsPage />} />
              <Route path="/dashboard/entrepreneur/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Main website routes — with shared Navbar and Footer */}
            <Route
              path="/*"
              element={
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/projects" element={<BrowseProjects />} />
                      <Route path="/projects/:id" element={<ProjectDetails />} />
                      <Route element={<ProtectedRoute allowedUserTypes={["entrepreneur"]} redirectTo="/" />}>
                        <Route path="/start-project" element={<StartProject />} />
                      </Route>
                      <Route element={<ProtectedRoute />}>
                        <Route path="/projects/:id/edit" element={<EditProject />} />
                      </Route>
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/how-it-works" element={<HowItWorksPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
