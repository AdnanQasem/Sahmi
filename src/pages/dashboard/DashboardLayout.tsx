import { useEffect, useState, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import notificationService from "@/services/notificationService";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SahmiLogo from "@/components/SahmiLogo";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutConfirmationDialog from "@/components/LogoutConfirmationDialog";
import { formatDate } from "@/i18n/format";
import { translateNotificationType, translateSystemNotificationBody } from "@/i18n/labels";
import { dashboardPollingOptions } from "@/lib/dashboardPolling";
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
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  DollarSign,
  Tags,
  Flag,
  HandCoins,
  LockKeyhole,
  ScrollText,
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
  targetUrl: string;
}

const notificationToneClasses: Record<NotificationTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-accent/10 text-accent",
  info: "bg-secondary/10 text-secondary",
  investment: "bg-primary/10 text-primary",
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "",
    icon: LayoutDashboard,
    roles: ["investor", "entrepreneur", "admin"],
  },
  // Admin routes
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderOpen,
    roles: ["admin"],
  },
  {
    label: "Categories",
    href: "/categories",
    icon: Tags,
    roles: ["admin"],
  },
  {
    label: "Investments",
    href: "/investments",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    label: "Milestones",
    href: "/milestones",
    icon: Flag,
    roles: ["admin"],
  },
  {
    label: "Repayments",
    href: "/repayments",
    icon: HandCoins,
    roles: ["admin", "investor", "entrepreneur"],
  },
  {
    label: "Funds",
    href: "/funds",
    icon: LockKeyhole,
    roles: ["admin", "entrepreneur"],
  },
  {
    label: "Logs",
    href: "/logs",
    icon: ScrollText,
    roles: ["admin"],
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
    roles: ["investor", "entrepreneur", "admin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["investor", "entrepreneur", "admin"],
  },
];

const navLabelKeys: Record<string, string> = {
  Overview: "dashboard.overview", Users: "dashboard.users", Projects: "nav.projects",
  Categories: "projects.category", Investments: "admin.investments", Milestones: "settings.milestones",
  Repayments: "repaymentDashboard.title", "Watched Projects": "dashboard.watched", Transactions: "dashboard.transactions",
  Project: "dashboard.project", Analytics: "dashboard.analytics", Investors: "dashboard.investors",
  Messages: "dashboard.messages", Settings: "dashboard.settings", Funds: "funds.nav", Logs: "auditLogs.nav",
};
interface DashboardLayoutProps {
  children: ReactNode;
  roleBase: string; // e.g. "/dashboard/investor"
  contentClassName?: string;
}

const DashboardLayout = ({ children, roleBase, contentClassName = "" }: DashboardLayoutProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({ queryKey: ["notifications"], queryFn: () => notificationService.list(), ...dashboardPollingOptions });
  const unreadQuery = useQuery({ queryKey: ["notification-unread"], queryFn: notificationService.unreadCount, ...dashboardPollingOptions });
  const markRead = useMutation({ mutationFn: notificationService.markRead, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["notifications"] }); void queryClient.invalidateQueries({ queryKey: ["notification-unread"] }); } });
  const markAllRead = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["notifications"] }); void queryClient.invalidateQueries({ queryKey: ["notification-unread"] }); } });
  useEffect(() => notificationService.subscribe(() => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notification-unread"] });
  }), [queryClient]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const role: UserRole | undefined = user?.is_staff ? "admin" : user?.user_type;

  const filteredNav = navItems.filter(
    (item) => role && item.roles.includes(role)
  );
  const coreLabels = new Set(["Overview", "Messages"]);
  const financeLabels = new Set(["Investments", "Milestones", "Repayments", "Funds", "Transactions"]);
  const navSections = [
    { key: "core", items: filteredNav.filter((item) => coreLabels.has(item.label)) },
    { key: "management", items: filteredNav.filter((item) => item.label !== "Settings" && !coreLabels.has(item.label) && !financeLabels.has(item.label)) },
    { key: "finance", items: filteredNav.filter((item) => financeLabels.has(item.label)) },
  ].filter((section) => section.items.length > 0);
  const visibleNotifications: RecentNotification[] = (notificationsQuery.data?.results ?? []).map((notification) => ({
    id: notification.id,
    title: notification.title === t("notifications.investmentConfirmedTitle", { lng: "en" })
      ? t("notifications.investmentConfirmedTitle")
      : translateNotificationType(t, notification.notification_type),
    description: translateSystemNotificationBody(t, notification.notification_type, notification.body),
    time: formatDate(notification.created_at, { dateStyle: "medium", timeStyle: "short" }, isRtl ? "ar" : "en"), icon: Info, tone: "info",
    unread: !notification.read_at, roles: role ? [role] : [],
    targetUrl: notification.target_url || roleBase,
  }));
  const unreadCount = unreadQuery.data?.unread_count ?? visibleNotifications.filter((notification) => notification.unread).length;

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
        <div className="px-5 pb-2 pt-5">
          <div className="rounded-2xl border border-border/60 bg-muted/35 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-sm">
                  {user?.full_name || t("common.user", { defaultValue: "User" })}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-primary capitalize">
                    {role ? t(`dashboard.${role}`) : ""}
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
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.key}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {t(`dashboard.navSections.${section.key}`)}
              </p>
            )}
            <div className="space-y-1.5">
        {section.items.map((item) => {
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
              title={collapsed ? t(navLabelKeys[item.label], { defaultValue: item.label }) : undefined}
              className={`group flex cursor-pointer items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
              />
              {!collapsed && <span>{t(navLabelKeys[item.label], { defaultValue: item.label })}</span>}
            </Link>
          );
        })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to={`${roleBase}/settings`}
          className={`group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 ${location.pathname.startsWith(`${roleBase}/settings`)
              ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            } ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? t("dashboard.settings") : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("dashboard.settings")}</span>}
        </Link>
        <LogoutConfirmationDialog onLoggedOut={() => navigate("/")}>
          <button
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all duration-200 cursor-pointer ${collapsed ? "justify-center" : ""
              }`}
            title={collapsed ? t("nav.logout") : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t("nav.logout")}</span>}
          </button>
        </LogoutConfirmationDialog>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border/70 bg-card transition-all duration-300 ease-in-out shrink-0 ${collapsed ? "w-[72px]" : "w-64"
          }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 z-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm"
          style={{ [isRtl ? "right" : "left"]: collapsed ? "72px" : "256px", position: "fixed", transform: `translateX(${isRtl ? "50%" : "-50%"})` }}
          aria-label={collapsed ? t("common.expand", { defaultValue: "Expand sidebar" }) : t("common.collapse", { defaultValue: "Collapse sidebar" })}
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
              initial={{ x: isRtl ? 280 : -280 }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? 280 : -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed start-0 top-0 z-50 h-full w-80 max-w-[88vw] border-r border-border bg-card shadow-xl lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute end-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted cursor-pointer"
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
        <header dir="ltr" className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden cursor-pointer"
            aria-label={t("nav.menu")}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page greeting (desktop) */}
          <div className="hidden lg:block">
            <p dir={i18n.dir()} className="text-sm font-medium text-foreground">{t("dashboard.welcome", { name: user?.full_name?.split(" ")[0] || "" })}</p>
          </div>

          {/* Right side actions */}
          <div dir="ltr" className="ml-auto flex items-center gap-3">
            <LanguageSwitcher compact />
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label={t("notifications.title") + (unreadCount ? `, ${t("notifications.new", { count: unreadCount })}` : "")}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
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
                    <h2 className="text-sm font-semibold text-foreground">{t("notifications.title")}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("notifications.subtitle")}</p>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {t("notifications.markAll")}
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto p-2">
                  {notificationsQuery.isPending ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("notifications.loading")}</div>
                  ) : notificationsQuery.isError ? (
                    <div className="px-4 py-8 text-center"><p className="text-sm font-medium text-destructive">{t("notifications.loadError")}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void notificationsQuery.refetch()}>{t("admin.tryAgain")}</Button></div>
                  ) : visibleNotifications.length > 0 ? (
                    visibleNotifications.map((notification) => {
                      const NotificationIcon = notification.icon;

                      return (
                        <div
                          key={notification.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (notification.unread) markRead.mutate(notification.id);
                            navigate(notification.targetUrl);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              if (notification.unread) markRead.mutate(notification.id);
                              navigate(notification.targetUrl);
                            }
                          }}
                          className="flex cursor-pointer gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
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
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={t("messages.unread", { count: 1 })} />
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
                      <p className="text-sm font-medium text-foreground">{t("notifications.empty")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("notifications.emptyText")}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 border-t border-border p-2">
                  <Button variant="ghost" size="sm" asChild><Link to={`${roleBase}/notifications`}>{t("notifications.viewAll")}</Link></Button>
                  <Button variant="ghost" size="sm" asChild><Link to={`${roleBase}/settings`}>{t("notifications.settings")}</Link></Button>
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
                  {role ? t(`dashboard.${role}`) : ""}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`mx-auto p-4 md:p-6 lg:p-8 ${contentClassName || "max-w-7xl"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
