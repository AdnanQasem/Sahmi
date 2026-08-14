import { useTranslation } from "react-i18next";
import { formatDate as formatLocalizedDate } from "@/i18n/format";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users,
  X,
} from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import AdminResetPasswordDialog from "@/components/admin/AdminResetPasswordDialog";
import AdminUserDialog from "@/components/admin/AdminUserDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, getFieldErrors } from "@/services/api";
import adminUsersService, {
  type AdminResetPasswordPayload,
  type AdminUser,
  type AdminUserType,
  type AdminUserWritePayload,
  type AdminUsersListParams,
} from "@/services/adminUsersService";

type UserTypeFilter = "all" | AdminUserType;
type ActiveFilter = "all" | "active" | "inactive";
type VerificationFilter = "all" | "verified" | "unverified";
type AccessFilter = "all" | "staff" | "superuser" | "standard";
type ConfirmAction = { type: "deactivate" | "delete"; user: AdminUser };

const PAGE_SIZE = 15;

const roleClasses: Record<AdminUserType, string> = {
  investor: "bg-secondary/10 text-secondary",
  entrepreneur: "bg-primary/10 text-primary",
  admin: "bg-accent/15 text-amber-700 dark:text-amber-300",
};

const initials = (user: AdminUser) => {
  const name = user.full_name.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase();
  }
  return user.email.slice(0, 2).toLocaleUpperCase();
};

const AccessBadges = ({ user }: { user: AdminUser }) => {
  const { t } = useTranslation();
  return (
  <div className="flex flex-wrap gap-1.5">
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
        user.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
      }`}
    >
      {t(user.is_active ? "adminForm.active" : "adminForm.inactive")}
    </span>
    {user.is_superuser ? (
      <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
        {t("adminForm.superuser")}
      </span>
    ) : user.is_staff ? (
      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{t("admin.staff")}</span>
    ) : null}
  </div>
  );
};

interface UserActionsProps {
  account: AdminUser;
  isSelf: boolean;
  isPending: boolean;
  onEdit: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onActivate: (user: AdminUser) => void;
  onConfirm: (action: ConfirmAction) => void;
}

const UserActions = ({
  account,
  isSelf,
  isPending,
  onEdit,
  onResetPassword,
  onActivate,
  onConfirm,
}: UserActionsProps) => {
  const { t } = useTranslation();
  return (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isPending} aria-label={t("adminForm.actionsFor", { name: account.full_name || account.email })}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-52">
      <DropdownMenuLabel>{t(isSelf ? "adminForm.yourAccount" : "adminForm.manageAccount")}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => onEdit(account)}>
        <Pencil className="h-4 w-4" />
        {t("adminForm.editDetails")}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onResetPassword(account)}>
        <KeyRound className="h-4 w-4" />
        {t("adminForm.resetPassword")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {account.is_active ? (
        <DropdownMenuItem
          disabled={isSelf}
          onSelect={() => onConfirm({ type: "deactivate", user: account })}
        >
          <UserX className="h-4 w-4" />
          {t("adminForm.deactivateAccount")}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={() => onActivate(account)}>
          <UserCheck className="h-4 w-4" />
          {t("adminForm.activateAccount")}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        disabled={isSelf}
        onSelect={() => onConfirm({ type: "delete", user: account })}
      >
        <Trash2 className="h-4 w-4" />
        {t("adminForm.deletePermanently")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  );
};

const AdminUsersPage = () => {
  const { t } = useTranslation();
  const { user: authenticatedUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState<UserTypeFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [page, setPage] = useState(1);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [userFieldErrors, setUserFieldErrors] = useState<Record<string, string>>({});
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

  const params = useMemo<AdminUsersListParams>(() => {
    const nextParams: AdminUsersListParams = {
      page,
      page_size: PAGE_SIZE,
      ordering: "-date_joined",
    };
    if (search.trim()) nextParams.search = search.trim();
    if (userType !== "all") nextParams.user_type = userType;
    if (activeFilter !== "all") nextParams.is_active = activeFilter === "active";
    if (verificationFilter !== "all") nextParams.is_verified = verificationFilter === "verified";
    if (accessFilter === "staff") nextParams.is_staff = true;
    if (accessFilter === "superuser") nextParams.is_superuser = true;
    if (accessFilter === "standard") nextParams.is_staff = false;
    return nextParams;
  }, [accessFilter, activeFilter, page, search, userType, verificationFilter]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminUsersService.listUsers(params),
    staleTime: 20_000,
  });

  const currentUserQuery = useQuery({
    queryKey: ["admin", "users", "current", authenticatedUser?.id],
    queryFn: () => adminUsersService.getUser(authenticatedUser!.id),
    enabled: !!authenticatedUser?.id,
    staleTime: 60_000,
  });

  const accounts = useMemo(
    () => usersQuery.data?.results ?? [],
    [usersQuery.data?.results],
  );
  const resultCount = usersQuery.data?.count ?? 0;
  const totalPages = Math.max(Math.ceil(resultCount / PAGE_SIZE), 1);
  const hasFilters =
    !!search || userType !== "all" || activeFilter !== "all" || verificationFilter !== "all" || accessFilter !== "all";

  const pageStats = useMemo(
    () => ({
      active: accounts.filter((account) => account.is_active).length,
      verified: accounts.filter((account) => account.is_verified).length,
      staff: accounts.filter((account) => account.is_staff).length,
    }),
    [accounts],
  );

  const invalidateUsers = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const saveUserMutation = useMutation({
    mutationFn: ({ user, payload }: { user: AdminUser | null; payload: AdminUserWritePayload }) =>
      user ? adminUsersService.updateUser(user.id, payload) : adminUsersService.createUser(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.user ? "admin.userSaved" : "admin.userCreated"));
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserFieldErrors({});
      invalidateUsers();
    },
    onError: (error) => {
      setUserFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.userItem") })));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ user, payload }: { user: AdminUser; payload: AdminResetPasswordPayload }) =>
      adminUsersService.resetPassword(user.id, payload),
    onSuccess: (_, variables) => {
      toast.success(t("admin.passwordReset", { name: variables.user.full_name || variables.user.email }));
      setResetPasswordUser(null);
      setPasswordFieldErrors({});
    },
    onError: (error) => {
      setPasswordFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, t("admin.passwordResetFailed")));
    },
  });

  const accountStatusMutation = useMutation({
    mutationFn: ({ user, isActive }: { user: AdminUser; isActive: boolean }) =>
      adminUsersService.updateUser(user.id, { is_active: isActive }),
    onSuccess: (_, variables) => {
      toast.success(t("admin.accountState", { name: variables.user.full_name || variables.user.email, state: t(variables.isActive ? "admin.activated" : "admin.deactivated") }));
      setConfirmAction(null);
      const leavesCurrentFilter =
        (activeFilter === "active" && !variables.isActive) ||
        (activeFilter === "inactive" && variables.isActive);
      if (leavesCurrentFilter && accounts.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.accountUpdateFailed"))),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (user: AdminUser) => adminUsersService.deleteUser(user.id),
    onSuccess: (_, user) => {
      toast.success(t("admin.userPermanentlyDeleted", { name: user.full_name || user.email }));
      setConfirmAction(null);
      if (accounts.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.deleteFailed", { item: t("admin.userItem") }))),
  });

  const mutationPending =
    saveUserMutation.isPending ||
    resetPasswordMutation.isPending ||
    accountStatusMutation.isPending ||
    deleteUserMutation.isPending;

  const clearFilters = () => {
    setSearch("");
    setUserType("all");
    setActiveFilter("all");
    setVerificationFilter("all");
    setAccessFilter("all");
    setPage(1);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setUserFieldErrors({});
    setUserDialogOpen(true);
  };

  const openEditDialog = (account: AdminUser) => {
    setEditingUser(account);
    setUserFieldErrors({});
    setUserDialogOpen(true);
  };

  const openResetPassword = (account: AdminUser) => {
    setPasswordFieldErrors({});
    setResetPasswordUser(account);
  };

  const actionProps = (account: AdminUser) => ({
    account,
    isSelf: account.id === authenticatedUser?.id,
    isPending: mutationPending,
    onEdit: openEditDialog,
    onResetPassword: openResetPassword,
    onActivate: (target: AdminUser) => accountStatusMutation.mutate({ user: target, isActive: true }),
    onConfirm: setConfirmAction,
  });

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-6 lg:space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 sm:p-8"
        >
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                <Users className="h-3.5 w-3.5" />{t("admin.userAdministration")}</div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("admin.manageAccounts")}</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t("admin.userAdministrationText")}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="bg-card/80" onClick={() => void usersQuery.refetch()} disabled={usersQuery.isFetching}>
                <RefreshCw className={`h-4 w-4 ${usersQuery.isFetching ? "animate-spin" : ""}`} />{t("admin.refresh")}</Button>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />{t("admin.createUser")}</Button>
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: t("admin.matchingUsers"), value: resultCount, icon: Users, tone: "bg-primary/10 text-primary" },
            { label: t("admin.activePage"), value: pageStats.active, icon: UserCheck, tone: "bg-success/10 text-success" },
            { label: t("admin.verifiedPage"), value: pageStats.verified, icon: CheckCircle2, tone: "bg-secondary/10 text-secondary" },
            { label: t("admin.staffPage"), value: pageStats.staff, icon: ShieldCheck, tone: "bg-accent/15 text-amber-700 dark:text-amber-300" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
                placeholder={t("admin.searchUsers")}
                aria-label={t("admin.searchUsers")}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex">
              <Select value={userType} onValueChange={(value: UserTypeFilter) => { setUserType(value); setPage(1); }}>
                <SelectTrigger className="xl:w-40"><SelectValue placeholder={t("admin.accountType")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allTypes")}</SelectItem>
                  <SelectItem value="investor">{t("admin.investors")}</SelectItem>
                  <SelectItem value="entrepreneur">{t("admin.entrepreneurs")}</SelectItem>
                  <SelectItem value="admin">{t("admin.admins")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={(value: ActiveFilter) => { setActiveFilter(value); setPage(1); }}>
                <SelectTrigger className="xl:w-36"><SelectValue placeholder={t("admin.status")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.anyStatus")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("admin.inactive")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={(value: VerificationFilter) => { setVerificationFilter(value); setPage(1); }}>
                <SelectTrigger className="xl:w-40"><SelectValue placeholder={t("admin.verification")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.anyVerification")}</SelectItem>
                  <SelectItem value="verified">{t("admin.verified")}</SelectItem>
                  <SelectItem value="unverified">{t("admin.unverified")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accessFilter} onValueChange={(value: AccessFilter) => { setAccessFilter(value); setPage(1); }}>
                <SelectTrigger className="xl:w-40"><SelectValue placeholder={t("admin.access")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.anyAccess")}</SelectItem>
                  <SelectItem value="standard">{t("admin.standardUsers")}</SelectItem>
                  <SelectItem value="staff">{t("admin.staff")}</SelectItem>
                  <SelectItem value="superuser">{t("admin.superusers")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4" />{t("admin.clear")}</Button>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-foreground">{t("admin.accounts")}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {usersQuery.isLoading ? t("admin.loadingUsers") : t("admin.accountsFound", { count: resultCount })}
              </p>
            </div>
            {currentUserQuery.data?.is_superuser && (
              <span className="hidden items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 sm:inline-flex">
                <Shield className="h-3.5 w-3.5" />
                {t("adminForm.superuserSession")}
              </span>
            )}
          </div>

          {usersQuery.isError ? (
            <div className="p-6 sm:p-10">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                <h3 className="mt-3 font-semibold text-foreground">{t("admin.usersLoadError")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("admin.apiRetry")}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => void usersQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />{t("common.retry")}</Button>
              </div>
            </div>
          ) : usersQuery.isLoading ? (
            <div className="p-4 sm:p-6">
              <div className="hidden space-y-3 md:block">
                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
              </div>
              <div className="space-y-3 md:hidden">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}
              </div>
            </div>
          ) : accounts.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="min-w-64 pl-6">{t("admin.user")}</TableHead>
                      <TableHead>{t("admin.type")}</TableHead>
                      <TableHead>{t("admin.verification")}</TableHead>
                      <TableHead>{t("admin.access")}</TableHead>
                      <TableHead>{t("admin.joined")}</TableHead>
                      <TableHead className="w-16 pr-6 text-right">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id} className="group">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                              <AvatarImage src={account.profile_picture || undefined} alt="" />
                              <AvatarFallback className="bg-gradient-to-br from-primary/15 to-secondary/15 text-xs font-bold text-primary">
                                {initials(account)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="max-w-56 truncate text-sm font-semibold text-foreground">{account.full_name || account.username}</p>
                                {account.id === authenticatedUser?.id && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{t("admin.you")}</span>}
                              </div>
                              <p className="max-w-64 truncate text-xs text-muted-foreground">{account.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses[account.user_type]}`}>
                            {t(`roles.${account.user_type}`)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${account.is_verified ? "text-success" : "text-muted-foreground"}`}>
                              {account.is_verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                              {t(account.is_verified ? "admin.verified" : "admin.notVerified")}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {t("admin.kycState", { state: t(account.is_kyc_verified ? "status.approved" : "status.pending") })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell><AccessBadges user={account} /></TableCell>
                        <TableCell>
                          <p className="text-xs font-medium text-foreground">{formatLocalizedDate(account.date_joined, { year: "numeric", month: "short", day: "numeric" })}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{t("adminForm.lastLoginLabel", { date: account.last_login ? formatLocalizedDate(account.last_login, { year: "numeric", month: "short", day: "numeric" }) : t("adminForm.never") })}</p>
                        </TableCell>
                        <TableCell className="pr-6 text-right"><UserActions {...actionProps(account)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {accounts.map((account) => (
                  <article key={account.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 border border-border">
                        <AvatarImage src={account.profile_picture || undefined} alt="" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/15 to-secondary/15 text-xs font-bold text-primary">{initials(account)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">{account.full_name || account.username}</h3>
                          {account.id === authenticatedUser?.id && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{t("admin.you")}</span>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                      </div>
                      <UserActions {...actionProps(account)} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses[account.user_type]}`}>
                        {t(`roles.${account.user_type}`)}
                      </span>
                      <AccessBadges user={account} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">{t("admin.verification")}</p>
                        <p className={`mt-1 font-semibold ${account.is_verified ? "text-success" : "text-foreground"}`}>{t(account.is_verified ? "admin.verified" : "admin.notVerified")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("admin.kyc")}</p>
                        <p className="mt-1 font-semibold text-foreground">{t(account.is_kyc_verified ? "status.approved" : "status.pending")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("admin.joined")}</p>
                        <p className="mt-1 font-semibold text-foreground">{formatLocalizedDate(account.date_joined, { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("admin.lastLogin")}</p>
                        <p className="mt-1 font-semibold text-foreground">{account.last_login ? formatLocalizedDate(account.last_login, { year: "numeric", month: "short", day: "numeric" }) : t("adminForm.never")}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-foreground">{t(hasFilters ? "admin.noUsersMatch" : "admin.noAccountsYet")}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {t(hasFilters ? "admin.tryBroaderUserSearch" : "admin.createFirstUser")}
              </p>
              <Button size="sm" className="mt-4" variant={hasFilters ? "outline" : "default"} onClick={hasFilters ? clearFilters : openCreateDialog}>
                {hasFilters ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {hasFilters ? t("projects.clearFilters") : t("admin.createUser")}
              </Button>
            </div>
          )}

          {!usersQuery.isLoading && !usersQuery.isError && resultCount > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-muted-foreground">{t("admin.pageOf", { page, pages: totalPages })}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={!usersQuery.data?.previous || usersQuery.isFetching}>
                  <ChevronLeft className="h-4 w-4 rtl-flip" />{t("common.previous")}</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!usersQuery.data?.next || usersQuery.isFetching}>{t("common.next")}<ChevronRight className="h-4 w-4 rtl-flip" />
                </Button>
              </div>
            </div>
          )}
        </section>

        <AdminUserDialog
          open={userDialogOpen}
          user={editingUser}
          currentUserId={authenticatedUser?.id}
          onOpenChange={(open) => {
            setUserDialogOpen(open);
            if (!open) {
              setEditingUser(null);
              setUserFieldErrors({});
            }
          }}
          onSubmit={(payload) => saveUserMutation.mutate({ user: editingUser, payload })}
          isPending={saveUserMutation.isPending}
          fieldErrors={userFieldErrors}
        />

        <AdminResetPasswordDialog
          user={resetPasswordUser}
          onOpenChange={(open) => {
            if (!open) {
              setResetPasswordUser(null);
              setPasswordFieldErrors({});
            }
          }}
          onSubmit={(payload) => resetPasswordUser && resetPasswordMutation.mutate({ user: resetPasswordUser, payload })}
          isPending={resetPasswordMutation.isPending}
          fieldErrors={passwordFieldErrors}
        />

        <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && !mutationPending && setConfirmAction(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                {confirmAction?.type === "delete" ? <Trash2 className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
              </div>
              <AlertDialogTitle>{t(confirmAction?.type === "delete" ? "adminForm.deleteAccountQuestion" : "adminForm.deactivateAccountQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.type === "delete" ? (
                  <>{t("admin.deleteCascade", { name: confirmAction.user.full_name || confirmAction.user.email })}</>
                ) : (
                  <>{t("admin.accountDeactivation", { name: confirmAction?.user.full_name || confirmAction?.user.email })}</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutationPending}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={mutationPending}
                onClick={(event) => {
                  event.preventDefault();
                  if (!confirmAction) return;
                  if (confirmAction.type === "delete") deleteUserMutation.mutate(confirmAction.user);
                  else accountStatusMutation.mutate({ user: confirmAction.user, isActive: false });
                }}
              >
                {mutationPending ? t("adminForm.working") : t(confirmAction?.type === "delete" ? "adminForm.deletePermanently" : "adminForm.deactivateAccount")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
