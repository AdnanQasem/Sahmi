import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SahmiLogo from "@/components/SahmiLogo";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  BarChart3,
  Users,
  Wallet,
  BookMarked,
  Settings,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  DollarSign,
} from "lucide-react";

type UserRole = "investor" | "entrepreneur" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

type NotificationTone = "success" | "warning" | "info" | "investment";

interface RecentNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
  tone: NotificationTone;
  unread?: boolean;
  roles: UserRole[];
}

const notificationToneClasses: Record<NotificationTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-accent/10 text-accent",
  info: "bg-secondary/10 text-secondary",
  investment: "bg-primary/10 text-primary",
};

const recentNotifications: RecentNotification[] = [
  {
    id: "return-updated",
    title: "Expected return updated",
    description: "Olive Grove Co-op adjusted its latest return forecast.",
    time: "10 min ago",
    icon: TrendingUp,
    tone: "investment",
    unread: true,
    roles: ["investor"],
  },
  {
    id: "payment-confirmed",
    title: "Payment confirmed",
    description: "Your investment in Handmade Ceramics was marked confirmed.",
    time: "1 hr ago",
    icon: CheckCircle2,
    tone: "success",
    unread: true,
    roles: ["investor"],
  },
  {
    id: "funding-milestone",
    title: "Funding milestone reached",
    description: "Gaza Tech Hub crossed 75% of its funding goal.",
    time: "Yesterday",
    icon: DollarSign,
    tone: "info",
    unread: true,
    roles: ["investor"],
  },
  {
    id: "project-reviewed",
    title: "Project review completed",
    description: "Your latest project is now visible to investors.",
    time: "18 min ago",
    icon: CheckCircle2,
    tone: "success",
    unread: true,
    roles: ["entrepreneur"],
  },
  {
    id: "investor-message",
    title: "New investor message",
    description: "A potential investor asked about your funding timeline.",
    time: "2 hrs ago",
    icon: Info,
    tone: "info",
    unread: true,
    roles: ["entrepreneur"],
  },
  {
    id: "project-needs-attention",
    title: "Project details need attention",
    description: "Add recent financial updates before the next review.",
    time: "Yesterday",
    icon: AlertCircle,
    tone: "warning",
    unread: true,
    roles: ["entrepreneur"],
  },
];

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "",
    icon: LayoutDashboard,
    roles: ["investor", "entrepreneur", "admin"],
  },
  // Investor routes
  {
    label: "Watched Projects",
    href: "#watched-projects",
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
    label: "Project",
    href: "#projects-section",
    icon: FolderOpen,
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
  const visibleNotifications = recentNotifications.filter(
    (notification) => role && notification.roles.includes(role)
  );
  const unreadCount = visibleNotifications.filter((notification) => notification.unread).length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={`flex h-16 items-center border-b border-border px-4 ${collapsed ? "justify-center" : "gap-3"
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
            item.href === "" ? roleBase : (item.href.startsWith("#") ? `${roleBase}${item.href}` : `${roleBase}${item.href}`);
          const hasHash = !!location.hash;
          const isActive =
            item.href === ""
              ? location.pathname === roleBase && !hasHash
              : item.href.startsWith("#") 
                ? location.pathname === roleBase && location.hash === item.href
                : location.pathname.startsWith(fullHref);

          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (item.href.startsWith("#")) {
              e.preventDefault();
              setSidebarOpen(false);
              navigate(fullHref, { replace: location.pathname === roleBase });
              setTimeout(() => {
                const target = document.getElementById(item.href.substring(1));
                target?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            } else if (item.href === "") {
              setSidebarOpen(false);
              if (location.hash) {
                navigate(roleBase, { replace: true });
              }
              setTimeout(() => {
                const main = document.querySelector("main");
                if (main) {
                  main.scrollTo({ top: 0, behavior: "smooth" });
                }
              }, 100);
            } else {
              setSidebarOpen(false);
            }
          };

          return (
            <Link
              key={item.href}
              to={fullHref}
              onClick={handleClick}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer ${collapsed ? "justify-center" : ""
            }`}
          title={collapsed ? "Go to website" : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Go to Website</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all duration-200 cursor-pointer ${collapsed ? "justify-center" : ""
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
        className={`hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 ${collapsed ? "w-[68px]" : "w-60"
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
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-xl p-0 shadow-xl"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Recent activity for your account</p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto p-2">
                  {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((notification) => {
                      const NotificationIcon = notification.icon;

                      return (
                        <div
                          key={notification.id}
                          className="flex gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                        >
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${notificationToneClasses[notification.tone]}`}>
                            <NotificationIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold leading-snug text-foreground">
                                {notification.title}
                              </p>
                              {notification.unread && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {notification.description}
                            </p>
                            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Bell className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No notifications yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Recent updates will appear here.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border p-2">
                  <Button variant="ghost" size="sm" className="w-full cursor-pointer justify-center" asChild>
                    <Link to={`${roleBase}/settings`}>Notification settings</Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

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
