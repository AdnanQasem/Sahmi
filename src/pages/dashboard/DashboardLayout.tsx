import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SahmiLogo from "@/components/SahmiLogo";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  PlusSquare,
  BarChart3,
  Users,
  Wallet,
  BookMarked,
  Settings,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

type UserRole = "investor" | "entrepreneur" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "",
    icon: LayoutDashboard,
    roles: ["investor", "entrepreneur", "admin"],
  },
  // Investor routes
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
    roles: ["investor"],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: TrendingUp,
    roles: ["investor"],
  },
  {
    label: "Watched Projects",
    href: "/watchlist",
    icon: BookMarked,
    roles: ["investor"],
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: Wallet,
    roles: ["investor"],
  },
  // Entrepreneur routes
  {
    label: "My Projects",
    href: "/projects",
    icon: FolderOpen,
    roles: ["entrepreneur"],
  },
  {
    label: "Add Project",
    href: "/add-project",
    icon: PlusSquare,
    roles: ["entrepreneur"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["entrepreneur"],
  },
  {
    label: "Investors",
    href: "/investors",
    icon: Users,
    roles: ["entrepreneur"],
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageSquare,
    roles: ["investor", "entrepreneur"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["investor", "entrepreneur", "admin"],
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
  roleBase: string; // e.g. "/dashboard/investor"
}

const DashboardLayout = ({ children, roleBase }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.user_type as UserRole | undefined;

  const filteredNav = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={`flex h-16 items-center border-b border-border px-4 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
      >
        {collapsed ? (
          <Link to="/" className="flex items-center">
            <SahmiLogo size="sm" variant="icon" />
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <SahmiLogo size="md" variant="full" />
          </Link>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <div className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border border-primary/20 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-sm">
                  {user?.full_name || "User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-primary capitalize">
                    {role === "entrepreneur" ? "Project Owner" : role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {collapsed && (
        <div className="pt-4 px-3">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNav.map((item) => {
          const fullHref =
            item.href === "" ? roleBase : `${roleBase}${item.href}`;
          const isActive =
            item.href === ""
              ? location.pathname === roleBase
              : location.pathname.startsWith(fullHref);

          return (
            <Link
              key={item.href}
              to={fullHref}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to="/"
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Go to website" : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Go to Website</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all duration-200 cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-20 translate-x-[calc(100%+1px)] z-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm"
          style={{
            left: collapsed ? "68px" : "240px",
            position: "fixed",
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-card shadow-xl lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page greeting (desktop) */}
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">
              Welcome back,{" "}
              <span className="text-primary">
                {user?.full_name?.split(" ")[0] || "User"}
              </span>
            </p>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold text-primary border border-primary/20">
                {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="line-clamp-1 max-w-[120px] text-sm font-medium text-foreground">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {role === "entrepreneur" ? "Project Owner" : role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
