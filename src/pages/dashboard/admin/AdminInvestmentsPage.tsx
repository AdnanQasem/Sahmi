import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatCurrency as formatLocaleCurrency, formatDate } from "@/i18n/format";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  CreditCard,
  Landmark,
  LayoutGrid,
  PieChart,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import AdminDeleteDialog from "@/components/admin/AdminDeleteDialog";
import AdminInvestmentDialog from "@/components/admin/AdminInvestmentDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { getErrorMessage } from "@/services/api";
import adminFinanceService, {
  type AdminInvestment,
  type AdminInvestmentPayload,
} from "@/services/adminFinanceService";

const PAGE_SIZE = 12;

const currency = (value: string | number) => formatLocaleCurrency(Number(value) || 0);

const dateTime = (value: string) => formatDate(value, { dateStyle: "medium", timeStyle: "short" });

const paymentLabel = (method: string) =>
  i18n.t(`payment.${method}`, { defaultValue: method });

const investorName = (investment: AdminInvestment) =>
  investment.investor_detail?.full_name ||
  investment.investor_detail?.email ||
  investment.investor_name ||
  i18n.t("admin.unknownInvestor");

const investorEmail = (investment: AdminInvestment) =>
  investment.investor_detail?.email || "";

const projectName = (investment: AdminInvestment) =>
  investment.project_detail?.title || i18n.t("admin.unknownProject");

const getInitials = (name: string) => {
  const clean = name.trim();
  if (!clean) return "IN";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

const PaymentBadge = ({ method }: { method: string }) => {
  let Icon = CircleDollarSign;
  let bgClass = "bg-primary/10 text-primary border-primary/20";

  if (method === "card") {
    Icon = CreditCard;
    bgClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  } else if (method === "bank_transfer") {
    Icon = Landmark;
    bgClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  } else if (method === "paypal") {
    Icon = Wallet;
    bgClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${bgClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {paymentLabel(method)}
    </span>
  );
};

const AdminInvestmentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminInvestment | null>(null);
  const [deleting, setDeleting] = useState<AdminInvestment | null>(null);

  const investmentsQuery = useQuery({
    queryKey: ["admin", "investments", page, search, status, paymentMethod],
    queryFn: () =>
      adminFinanceService.listInvestments({
        page,
        page_size: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        payment_method: paymentMethod === "all" ? undefined : paymentMethod,
        ordering: "-investment_date",
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ["admin", "investments", "summary", search, status, paymentMethod],
    queryFn: () =>
      adminFinanceService.investmentSummary({
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        payment_method: paymentMethod === "all" ? undefined : paymentMethod,
      }),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "user-options"],
    queryFn: adminFinanceService.listUserOptions,
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryKey: ["admin", "project-options"],
    queryFn: adminFinanceService.listProjectOptions,
    staleTime: 60_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "repayments"] });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      investment,
      payload,
    }: {
      investment: AdminInvestment | null;
      payload: AdminInvestmentPayload;
    }) =>
      investment
        ? adminFinanceService.updateInvestment(investment.id, payload)
        : adminFinanceService.createInvestment(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.investment ? "admin.updated" : "admin.created", { item: t("admin.investmentItem") }));
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.investmentItem") }))),
  });

  const deleteMutation = useMutation({
    mutationFn: (investment: AdminInvestment) =>
      adminFinanceService.deleteInvestment(investment.id),
    onSuccess: (_, investment) => {
      toast.success(t("admin.investmentDeleted", { investor: investorName(investment) }));
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.deleteFailed", { item: t("admin.investmentItem") }))),
  });

  const openEdit = (investment: AdminInvestment) => {
    setEditing(investment);
    setDialogOpen(true);
  };

  const data = investmentsQuery.data;
  const records = data?.results || [];

  const summaryStats = {
    totalVolume: Number(summaryQuery.data?.funded_total || 0),
    totalCount: summaryQuery.data?.total_count ?? data?.count ?? 0,
    confirmedCount: summaryQuery.data?.funded_count ?? 0,
    pendingCount: summaryQuery.data?.pending_count ?? 0,
  };

  const hasActiveFilters = Boolean(search || status !== "all" || paymentMethod !== "all");

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentMethod("all");
    setPage(1);
  };

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={CircleDollarSign}
          title={t("admin.ledgerTitle")}
          description={t("admin.ledgerText")}
        />

        {/* Analytics Stat Cards */}
        <section aria-label="Investment Summary Statistics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("admin.totalInvested", { defaultValue: "Total Volume" })}
              value={currency(summaryStats.totalVolume)}
              subtext={t("admin.confirmedAcrossLedger", { defaultValue: "Confirmed and completed records" })}
              icon={CircleDollarSign}
              iconBgClass="bg-primary/10"
              iconColorClass="text-primary"
              index={0}
            />
            <StatCard
              label={t("admin.totalRecords", { defaultValue: "Total Transactions" })}
              value={String(summaryStats.totalCount)}
              subtext={t("admin.investmentEntries", { defaultValue: "Investment entries" })}
              icon={PieChart}
              iconBgClass="bg-secondary/10"
              iconColorClass="text-secondary"
              index={1}
            />
            <StatCard
              label={t("status.confirmed")}
              value={String(summaryStats.confirmedCount)}
              subtext={t("admin.successfulInvestments", { defaultValue: "Verified transactions" })}
              icon={CheckCircle2}
              iconBgClass="bg-success/10"
              iconColorClass="text-success"
              index={2}
            />
            <StatCard
              label={t("status.pending")}
              value={String(summaryStats.pendingCount)}
              subtext={t("admin.awaitingConfirmation", { defaultValue: "Requires attention" })}
              icon={Clock}
              iconBgClass="bg-warning/10"
              iconColorClass="text-warning"
              index={3}
            />
          </div>
        </section>

        {/* Main Section */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm backdrop-blur-md">
          {/* Header & Filter Controls */}
          <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{t("admin.allInvestments")}</h2>
                {data && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {data.count}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? t("admin.financialRecords", { count: data.count }) : t("admin.loadingLedger")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t("admin.searchInvestmentsLabel")}
                  className="pl-9 pr-8"
                  placeholder={t("admin.searchInvestments")}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Select */}
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label={t("admin.filterInvestmentStatus")} className="w-[140px]">
                  <SelectValue placeholder={t("admin.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                  <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  <SelectItem value="failed">{t("status.failed")}</SelectItem>
                  <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                  <SelectItem value="refunded">{t("status.refunded")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Method Select */}
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label={t("admin.filterInvestmentMethod")} className="w-[150px]">
                  <SelectValue placeholder={t("admin.payment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allPaymentMethods")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem>
                  <SelectItem value="card">{t("payment.card")}</SelectItem>
                  <SelectItem value="paypal">{t("payment.paypal")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetFilters}
                  title={t("common.resetFilters", { defaultValue: "Reset filters" })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

              {/* Layout View Switcher */}
              <div className="hidden border-l border-border pl-2.5 sm:flex sm:items-center sm:gap-1">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className="h-9 w-9"
                  title="Table View"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9"
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          {investmentsQuery.isPending ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : investmentsQuery.isError ? (
            <div className="p-12 text-center">
              <p className="font-medium text-destructive">{t("admin.ledgerLoadError")}</p>
              <Button className="mt-4" variant="outline" onClick={() => void investmentsQuery.refetch()}>
                {t("admin.tryAgain")}
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/60">
                <CircleDollarSign className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t("admin.noInvestments")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.adjustOrCreate")}</p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4 gap-2" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  {t("common.clearFilters", { defaultValue: "Clear filters" })}
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("admin.investorProject")}
                      </TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("common.amount")} & {t("admin.quantityShort")}
                      </TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("common.status")}
                      </TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("admin.payment")}
                      </TableHead>
                      <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("common.date")}
                      </TableHead>
                      <TableHead className="w-24 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("admin.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="wait">
                      {records.map((investment, index) => {
                        const name = investorName(investment);
                        const email = investorEmail(investment);
                        const project = projectName(investment);

                        return (
                          <TableRow
                            key={investment.id}
                            className="group transition-colors duration-150 hover:bg-muted/30"
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-border shadow-xs">
                                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                    {getInitials(name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {name}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                                    <span className="max-w-[200px] truncate">{project}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <p className="font-bold text-foreground tabular-nums">
                                  {currency(investment.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t("admin.quantityShort")} <bdi dir="ltr" className="font-medium text-foreground">{investment.quantity}</bdi> {t("common.shares", { defaultValue: "shares" })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <StatusBadge status={investment.status} />
                            </TableCell>
                            <TableCell className="py-4">
                              <PaymentBadge method={investment.payment_method} />
                            </TableCell>
                            <TableCell className="py-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 opacity-60" />
                                {dateTime(investment.investment_date)}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                  onClick={() => openEdit(investment)}
                                  title={t("admin.editInvestment")}
                                >
                                  <SlidersHorizontal className="h-4 w-4" />
                                  <span className="sr-only">{t("admin.editInvestment")}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setDeleting(investment)}
                                  title={t("admin.deleteInvestment")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">{t("admin.deleteInvestment")}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              <AdminPagination
                page={page}
                count={data?.count || 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          ) : (
            /* Grid Card View */
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {records.map((investment, index) => {
                  const name = investorName(investment);
                  const project = projectName(investment);

                  return (
                    <motion.div
                      key={investment.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      whileHover={{ y: -3 }}
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-border">
                            <AvatarFallback className="bg-primary/10 font-bold text-primary">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                              {name}
                            </h3>
                            <p className="truncate text-xs text-muted-foreground">{project}</p>
                          </div>
                        </div>
                        <StatusBadge status={investment.status} />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3.5 text-xs">
                        <div>
                          <p className="text-muted-foreground">{t("common.amount")}</p>
                          <p className="mt-1 text-base font-bold text-foreground tabular-nums">
                            {currency(investment.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("admin.quantityShort")}</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            <bdi dir="ltr">{investment.quantity}</bdi> {t("common.shares", { defaultValue: "shares" })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                        <PaymentBadge method={investment.payment_method} />
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateTime(investment.investment_date)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openEdit(investment)}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          {t("common.edit")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(investment)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("common.delete", { defaultValue: "Delete" })}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <AdminPagination
                page={page}
                count={data?.count || 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
      </div>

      <AdminInvestmentDialog
        open={dialogOpen}
        investment={editing}
        users={usersQuery.data || []}
        projects={projectsQuery.data || []}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={(payload) => saveMutation.mutate({ investment: editing, payload })}
      />

      <AdminDeleteDialog
        open={!!deleting}
        title={t("admin.deleteInvestmentQuestion")}
        description={t("admin.deleteInvestmentText")}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminInvestmentsPage;
