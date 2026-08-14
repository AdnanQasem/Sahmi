import { useTranslation } from "react-i18next";
import { formatNumber, formatPercent } from "@/i18n/format";
import { calculateFundingPercent, fundingProgressBarWidth, fundingProgressColor } from "@/lib/fundingProgress";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "./DashboardLayout";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import TransactionDetailsDialog, {
  amountOf,
  currency,
  expectedOf,
  formatDateTime,
  formatPaymentMethod,
  getProjectTitle,
} from "@/components/dashboard/TransactionDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import investmentsService, { Investment } from "@/services/investmentsService";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  ReceiptText,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

const statusFilters = ["all", "pending", "confirmed", "completed", "canceled"] as const;

const InvestorTransactionsPage = () => {
  const { t } = useTranslation();
  const [selectedTransaction, setSelectedTransaction] = useState<Investment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("all");

  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "investor", "transactions"],
    queryFn: investmentsService.listInvestments,
    refetchInterval: 5000,
  });

  const transactions = investmentsQuery.data?.results ?? [];
  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      const searchable = [
        getProjectTitle(transaction),
        transaction.project_detail?.category_detail?.name,
        transaction.transaction_id,
        transaction.payment_method,
        transaction.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [transactions, searchQuery, statusFilter]);

  const totalPaid = transactions.reduce((sum, transaction) => sum + amountOf(transaction), 0);
  const confirmedPaid = transactions
    .filter((transaction) => ["confirmed", "completed"].includes(transaction.status))
    .reduce((sum, transaction) => sum + amountOf(transaction), 0);
  const expectedReturns = transactions.reduce((sum, transaction) => sum + expectedOf(transaction), 0);
  // The expectedReturns from the backend represents the net profit, so ROI is simply (profit / paid) * 100
  const totalROI = totalPaid > 0 ? (expectedReturns / totalPaid) * 100 : 0;
  const latestTransaction = transactions[0];
  const ledgerTransactions = filteredTransactions.filter((transaction) => transaction.id !== latestTransaction?.id);
  const latestProjectProgress = latestTransaction?.project_detail
    ? calculateFundingPercent(
        Number(latestTransaction.project_detail.funded_amount),
        Number(latestTransaction.project_detail.goal_amount),
      )
    : 0;
  const latestProgressColor = fundingProgressColor(latestProjectProgress);

  const openTransaction = (transaction: Investment) => {
    setSelectedTransaction(transaction);
  };

  return (
    <DashboardLayout roleBase="/dashboard/investor">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-sm"
        >
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="relative flex flex-col justify-center overflow-hidden bg-primary text-primary-foreground px-6 py-6 sm:px-8 lg:py-8">
              {/* Premium glowing background effects - scaled down */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-64 w-64 rounded-full bg-secondary/30 blur-3xl mix-blend-screen pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay pointer-events-none" />
              
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px]" />

              <div className="relative z-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner shadow-white/10">
                      <ReceiptText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("transactions.title")}</h1>
                      <p className="mt-1 text-sm font-medium text-white/70 max-w-md">
                        {transactions.length > 0 
                          ? t("transactions.activeSummary", { count: formatNumber(transactions.length), roi: formatPercent(totalROI) })
                          : t("transactions.explorePrompt")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t("dashboard.totalPaid")}</p>
                        <p className="text-xl font-bold">{currency(totalPaid)}</p>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t("dashboard.expected")}</p>
                        <p className="text-xl font-bold text-secondary-foreground">{currency(expectedReturns)}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col justify-center overflow-hidden bg-card/60 backdrop-blur-xl p-6 sm:px-8 lg:py-8 border-l border-border/50">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("dashboard.recentActivity")}</h3>
                  </div>
                  {latestTransaction && (
                    <button
                      type="button"
                      onClick={() => openTransaction(latestTransaction)}
                      className="text-xs font-semibold text-primary hover:underline transition-all"
                    >
                      {t("transactions.viewDetails")}
                    </button>
                  )}
                </div>

                {latestTransaction ? (
                  <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/30 hover:bg-background/80 hover:shadow-md cursor-pointer" onClick={() => openTransaction(latestTransaction)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge status={latestTransaction.status} />
                          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                            {formatDateTime(latestTransaction.investment_date)}
                          </span>
                        </div>
                        <h4 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {getProjectTitle(latestTransaction)}
                        </h4>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{t("dashboard.invested")}</p>
                        <p className="text-lg font-black text-foreground">
                          {currency(amountOf(latestTransaction))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("dashboard.expectedReturn")}</p>
                        <p className="text-sm font-bold text-foreground">{currency(expectedOf(latestTransaction))}</p>
                      </div>
                      <div>
                        <p className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {t("transactions.progress")} <bdi dir="ltr" style={{ color: latestProgressColor }}>{formatPercent(latestProjectProgress)}</bdi>
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${fundingProgressBarWidth(latestProjectProgress)}%`,
                              backgroundColor: latestProgressColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/30 p-6 text-center">
                    <p className="text-xs font-medium text-muted-foreground">{t("dashboard.noActivity")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm ring-1 ring-black/5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("common.filter")}</h2>
                <p className="text-[11px] font-medium text-muted-foreground">{t("transactions.resultsFound", { count: formatNumber(filteredTransactions.length) })}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("transactions.searchRecords")}
                </label>
                <div className="relative group">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("transactions.search")}
                    className="ps-10 h-11 bg-background/50 border-border/50 transition-all focus:bg-background focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("transactions.allStatuses")}</p>
                <div className="flex flex-col gap-1.5">
                  {statusFilters.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatusFilter(option)}
                      className={`group flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        statusFilter === option
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                          : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {statusFilter === option && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                        {option === "all" ? t("common.all") : t(`status.${option}`)}
                      </span>
                      <span className={`text-[11px] font-bold rounded-md px-2 py-0.5 ${
                        statusFilter === option 
                          ? "bg-primary-foreground/20 text-primary-foreground" 
                          : "bg-background text-muted-foreground group-hover:bg-background/80"
                      }`}>
                        {option === "all"
                          ? transactions.length
                          : transactions.filter((transaction) => transaction.status === option).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">{t("transactions.title")}</h2>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {investmentsQuery.isLoading
                      ? t("transactions.loadingRecords")
                      : t("transactions.recordsSummary", { listed: formatNumber(ledgerTransactions.length), total: formatNumber(transactions.length) })}
                  </p>
                </div>
              </div>
            </div>

            {transactions.length === 0 && !investmentsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/30 p-12 text-center backdrop-blur-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ReceiptText className="h-10 w-10 opacity-80" />
                </div>
                <h3 className="text-2xl font-black text-foreground">{t("transactions.noResults")}</h3>
                <p className="mt-3 text-sm font-medium text-muted-foreground max-w-md">
                  {t("transactions.paymentsAppear")}
                </p>
                <Button asChild className="mt-8 rounded-full px-8 py-6 text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                  <Link to="/projects">{t("home.browse")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" /></Link>
                </Button>
              </div>
            ) : filteredTransactions.length === 0 && !investmentsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/30 p-12 text-center backdrop-blur-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Search className="h-10 w-10 opacity-80" />
                </div>
                <h3 className="text-2xl font-black text-foreground">{t("transactions.noResults")}</h3>
                <p className="mt-3 text-sm font-medium text-muted-foreground max-w-md">
                  {t("transactions.adjustFilters")}
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className="mt-8 rounded-full px-8 font-bold border-primary/20 hover:bg-primary/5 text-primary">
                  {t("transactions.clearFilters")}
                </Button>
              </div>
            ) : ledgerTransactions.length === 0 && !investmentsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/30 p-12 text-center backdrop-blur-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ReceiptText className="h-10 w-10 opacity-80" />
                </div>
                <h3 className="text-2xl font-black text-foreground">{t("dashboard.latestHighlighted")}</h3>
                <p className="mt-3 text-sm font-medium text-muted-foreground max-w-md">
                  {t("transactions.moreAppear")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {investmentsQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="h-8 w-8 animate-spin" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                      {t("transactions.loadingLedger")}
                    </p>
                  </div>
                ) : (
                  ledgerTransactions.map((transaction, index) => (
                    <motion.button
                      key={transaction.id}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.18) }}
                      onClick={() => openTransaction(transaction)}
                      className="relative group w-full overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-1 text-start transition-all hover:border-primary/30 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative rounded-xl bg-card p-4 sm:p-5">
                        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                          <div className="flex min-w-0 gap-4 sm:gap-5">
                            <div className="flex flex-col items-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary/50 group-hover:scale-110 shadow-sm">
                                <ReceiptText className="h-5 w-5" />
                              </div>
                              <div className="mt-3 h-full min-h-8 w-px bg-border/50" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <p className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">{getProjectTitle(transaction)}</p>
                                <StatusBadge status={transaction.status} />
                              </div>
                              <div className="mt-2.5 flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                <span className="inline-flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  {formatDateTime(transaction.investment_date)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  {formatPaymentMethod(transaction.payment_method)}
                                </span>
                                {transaction.transaction_id && (
                                  <span className="inline-flex items-center gap-1.5 font-mono bg-background/50 px-2 py-1 rounded-md text-foreground/70">
                                    #{transaction.transaction_id.slice(0, 8)}...
                                  </span>
                                )}
                              </div>
                              <div className="mt-3.5 flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs rounded-full border-border/50 bg-background/50 font-semibold">
                                  {transaction.project_detail?.category_detail?.name ?? t("transactions.project")}
                                </Badge>
                                <Badge variant="secondary" className="bg-secondary/10 text-xs text-secondary rounded-full font-bold">
                                  {t("transactions.expectedReturn", { amount: currency(expectedOf(transaction)) })}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row-reverse md:flex-col items-center md:items-end justify-between gap-4 border-t border-border/50 pt-4 md:border-t-0 md:pt-0">
                            <div className="text-end">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("dashboard.amountPaid")}</p>
                              <p className="text-2xl font-black text-foreground">{currency(amountOf(transaction))}</p>
                            </div>
                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20">
                              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <TransactionDetailsDialog
        investment={selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      />
    </DashboardLayout>
  );
};

export default InvestorTransactionsPage;
