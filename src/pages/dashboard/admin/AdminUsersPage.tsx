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

const roleLabels: Record<AdminUserType, string> = {
  investor: "Investor",
  entrepreneur: "Entrepreneur",
  admin: "Admin",
};

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

const formatDate = (value: string | null) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const AccessBadges = ({ user }: { user: AdminUser }) => (
  <div className="flex flex-wrap gap-1.5">
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
        user.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
      }`}
    >
      {user.is_active ? "Active" : "Inactive"}
    </span>
    {user.is_superuser ? (
      <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
        Superuser
      </span>
    ) : user.is_staff ? (
      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">Staff</span>
    ) : null}
  </div>
);

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
}: UserActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isPending} aria-label={`Actions for ${account.full_name || account.email}`}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-52">
      <DropdownMenuLabel>{isSelf ? "Your account" : "Manage account"}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => onEdit(account)}>
        <Pencil className="h-4 w-4" />
        Edit details
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onResetPassword(account)}>
        <KeyRound className="h-4 w-4" />
        Reset password
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {account.is_active ? (
        <DropdownMenuItem
          disabled={isSelf}
          onSelect={() => onConfirm({ type: "deactivate", user: account })}
        >
          <UserX className="h-4 w-4" />
          Deactivate account
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={() => onActivate(account)}>
          <UserCheck className="h-4 w-4" />
          Activate account
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        disabled={isSelf}
        onSelect={() => onConfirm({ type: "delete", user: account })}
      >
        <Trash2 className="h-4 w-4" />
        Delete permanently
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const AdminUsersPage = () => {
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
      toast.success(variables.user ? "User details updated." : "User account created.");
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserFieldErrors({});
      invalidateUsers();
    },
    onError: (error) => {
      setUserFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not save this user."));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ user, payload }: { user: AdminUser; payload: AdminResetPasswordPayload }) =>
      adminUsersService.resetPassword(user.id, payload),
    onSuccess: (_, variables) => {
      toast.success(`Password reset for ${variables.user.full_name || variables.user.email}.`);
      setResetPasswordUser(null);
      setPasswordFieldErrors({});
    },
    onError: (error) => {
      setPasswordFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not reset this password."));
    },
  });

  const accountStatusMutation = useMutation({
    mutationFn: ({ user, isActive }: { user: AdminUser; isActive: boolean }) =>
      adminUsersService.updateUser(user.id, { is_active: isActive }),
    onSuccess: (_, variables) => {
      toast.success(`${variables.user.full_name || variables.user.email} was ${variables.isActive ? "activated" : "deactivated"}.`);
      setConfirmAction(null);
      const leavesCurrentFilter =
        (activeFilter === "active" && !variables.isActive) ||
        (activeFilter === "inactive" && variables.isActive);
      if (leavesCurrentFilter && accounts.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update this account.")),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (user: AdminUser) => adminUsersService.deleteUser(user.id),
    onSuccess: (_, user) => {
      toast.success(`${user.full_name || user.email} was permanently deleted.`);
      setConfirmAction(null);
      if (accounts.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete this user.")),
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
                <Users className="h-3.5 w-3.5" />
                User administration
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Manage every Sahmi account</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Create accounts, verify identities, control access, and keep user records accurate from one secure workspace.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="bg-card/80" onClick={() => void usersQuery.refetch()} disabled={usersQuery.isFetching}>
                <RefreshCw className={`h-4 w-4 ${usersQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Create user
              </Button>
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Matching users", value: resultCount, icon: Users, tone: "bg-primary/10 text-primary" },
            { label: "Active on page", value: pageStats.active, icon: UserCheck, tone: "bg-success/10 text-success" },
            { label: "Verified on page", value: pageStats.verified, icon: CheckCircle2, tone: "bg-secondary/10 text-secondary" },
            { label: "Staff on page", value: pageStats.staff, icon: ShieldCheck, tone: "bg-accent/15 text-amber-700 dark:text-amber-300" },
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
                placeholder="Search name, email, phone, or business..."
                aria-label="Search users"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex">
              <Select value={userType} onValueChange={(value: UserTypeFilter) => { setUserType(value); setPage(1); }}>
                <SelectTrigger className="xl:w-40"><SelectValue placeholder="Account type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="investor">Investors</SelectItem>
                  <SelectItem value="entrepreneur">Entrepreneurs</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={(value: ActiveFilter) => { setActiveFilter(value); setPage(1); }}>
                <SelectTrigger className="xl:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={(value: VerificationFilter) => { setVerificationFilter(value); setPage(1); }}>
                <SelectTrigger className="xl:w-40"><SelectValue placeholder="Verification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accessFilter} onValueChange={(value: AccessFilter) => { setAccessFilter(value); setPage(1); }}>
                <SelectTrigger className="xl:w-40"><SelectValue placeholder="Access" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any access</SelectItem>
                  <SelectItem value="standard">Standard users</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="superuser">Superusers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-foreground">Accounts</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {usersQuery.isLoading ? "Loading users..." : `${resultCount} ${resultCount === 1 ? "account" : "accounts"} found`}
              </p>
            </div>
            {currentUserQuery.data?.is_superuser && (
              <span className="hidden items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 sm:inline-flex">
                <Shield className="h-3.5 w-3.5" />
                Superuser session
              </span>
            )}
          </div>

          {usersQuery.isError ? (
            <div className="p-6 sm:p-10">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                <h3 className="mt-3 font-semibold text-foreground">Users could not be loaded</h3>
                <p className="mt-1 text-sm text-muted-foreground">Check the admin API connection and try again.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => void usersQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
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
                      <TableHead className="min-w-64 pl-6">User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-16 pr-6 text-right">Actions</TableHead>
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
                                {account.id === authenticatedUser?.id && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">You</span>}
                              </div>
                              <p className="max-w-64 truncate text-xs text-muted-foreground">{account.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses[account.user_type]}`}>
                            {roleLabels[account.user_type]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${account.is_verified ? "text-success" : "text-muted-foreground"}`}>
                              {account.is_verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                              {account.is_verified ? "Verified" : "Not verified"}
                            </div>
                            <p className="text-[11px] text-muted-foreground">KYC {account.is_kyc_verified ? "approved" : "pending"}</p>
                          </div>
                        </TableCell>
                        <TableCell><AccessBadges user={account} /></TableCell>
                        <TableCell>
                          <p className="text-xs font-medium text-foreground">{formatDate(account.date_joined)}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">Last login: {formatDate(account.last_login)}</p>
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
                          {account.id === authenticatedUser?.id && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">You</span>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                      </div>
                      <UserActions {...actionProps(account)} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses[account.user_type]}`}>{roleLabels[account.user_type]}</span>
                      <AccessBadges user={account} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Verification</p>
                        <p className={`mt-1 font-semibold ${account.is_verified ? "text-success" : "text-foreground"}`}>{account.is_verified ? "Verified" : "Not verified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">KYC</p>
                        <p className="mt-1 font-semibold text-foreground">{account.is_kyc_verified ? "Approved" : "Pending"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Joined</p>
                        <p className="mt-1 font-semibold text-foreground">{formatDate(account.date_joined)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last login</p>
                        <p className="mt-1 font-semibold text-foreground">{formatDate(account.last_login)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-foreground">{hasFilters ? "No users match these filters" : "No accounts yet"}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {hasFilters ? "Try a broader search or clear the filters." : "Create the first user account to get started."}
              </p>
              <Button size="sm" className="mt-4" variant={hasFilters ? "outline" : "default"} onClick={hasFilters ? clearFilters : openCreateDialog}>
                {hasFilters ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {hasFilters ? "Clear filters" : "Create user"}
              </Button>
            </div>
          )}

          {!usersQuery.isLoading && !usersQuery.isError && resultCount > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={!usersQuery.data?.previous || usersQuery.isFetching}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!usersQuery.data?.next || usersQuery.isFetching}>
                  Next <ChevronRight className="h-4 w-4" />
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
              <AlertDialogTitle>{confirmAction?.type === "delete" ? "Permanently delete this account?" : "Deactivate this account?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.type === "delete" ? (
                  <>
                    Deleting <strong className="font-semibold text-foreground">{confirmAction.user.full_name || confirmAction.user.email}</strong> also
                    permanently deletes their owned projects, investments, repayments, milestones, and notifications through database cascades. This action cannot be undone.
                  </>
                ) : (
                  <><strong className="font-semibold text-foreground">{confirmAction?.user.full_name || confirmAction?.user.email}</strong> will immediately lose sign-in access. You can reactivate the account later.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutationPending}>Cancel</AlertDialogCancel>
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
                {mutationPending ? "Working..." : confirmAction?.type === "delete" ? "Delete permanently" : "Deactivate account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
