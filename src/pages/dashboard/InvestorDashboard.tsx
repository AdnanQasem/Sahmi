import { useTranslation } from "react-i18next";
import { formatNumber } from "@/i18n/format";
import { formatDate } from "@/i18n/format";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "./DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import SectionHeader from "@/components/dashboard/SectionHeader";
import FundingProgressBar from "@/components/dashboard/FundingProgressBar";
import StatusBadge from "@/components/dashboard/StatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import investmentsService, { Investment } from "@/services/investmentsService";
import projectsService, { Project } from "@/services/projectsService";
import TransactionDetailsDialog, {
  amountOf,
  currency,
  expectedOf,
  formatDateTime,
  formatPaymentMethod,
  getProjectTitle,
} from "@/components/dashboard/TransactionDetailsDialog";
import {
  ArrowRight,
  BookMarked,
  Briefcase,
  CalendarClock,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  TrendingUp,
  Wallet,
} from "lucide-react";

const monthLabel = (value: string) => formatDate(value, { month: "short" });

const colors = [
  "hsl(174 78% 26%)",
  "hsl(224 76% 48%)",
  "hsl(38 92% 50%)",
  "hsl(142 72% 36%)",
  "hsl(215 16% 35%)",
];

const buildPerformance = (investments: Investment[]) => {
  const byMonth = investments.reduce<Record<string, number>>((acc, investment) => {
    const label = monthLabel(investment.investment_date);
    acc[label] = (acc[label] ?? 0) + amountOf(investment);
    return acc;
  }, {});
  const rows = Object.entries(byMonth).map(([month, value]) => ({ month, value }));
  return rows.length ? rows : [{ month: "Now", value: 0 }];
};

const buildAllocation = (investments: Investment[]) => {
  const byCategory = investments.reduce<Record<string, number>>((acc, investment) => {
    const category = investment.project_detail?.category_detail?.name ?? "Other";
    acc[category] = (acc[category] ?? 0) + amountOf(investment);
    return acc;
  }, {});
  const total = Object.values(byCategory).reduce((sum, value) => sum + value, 0);
  return Object.entries(byCategory).map(([name, amount], index) => ({
    name,
    amount,
    value: total ? Math.round((amount / total) * 100) : 0,
    color: colors[index % colors.length],
  }));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-base font-bold text-foreground">{currency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const InvestorDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<Investment | null>(null);
  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "investor", "investments"],
    queryFn: investmentsService.listInvestments,
    refetchInterval: 5000,
  });
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "investor", "available-projects"],
    queryFn: () => projectsService.listProjects({ page_size: 3, ordering: "-created_at" }),
    refetchInterval: 5000,
  });

  const investments = investmentsQuery.data?.results ?? [];
  const availableProjects = projectsQuery.data?.results ?? [];
  const totalInvested = investments.reduce((sum, investment) => sum + amountOf(investment), 0);
  const expectedReturns = investments.reduce((sum, investment) => sum + expectedOf(investment), 0);
  const activeInvestments = investments.filter((investment) => ["pending", "confirmed"].includes(investment.status)).length;
  const performance = buildPerformance(investments);
  const allocation = buildAllocation(investments);
  const isLoading = investmentsQuery.isLoading || projectsQuery.isLoading;

  const kpiCards = [
    {
      label: t("dashboard.totalInvested"),
      value: currency(totalInvested),
      subtext: t("dashboard.investmentCount", { count: investments.length }),
      icon: DollarSign,
      trend: "neutral" as const,
      iconColorClass: "text-primary",
      iconBgClass: "bg-primary/10",
    },
    {
      label: t("dashboard.activeInvestments"),
      value: activeInvestments.toString(),
      subtext: t("dashboard.pendingOrConfirmed"),
      icon: Briefcase,
      trend: "neutral" as const,
      iconColorClass: "text-secondary",
      iconBgClass: "bg-secondary/10",
    },
    {
      label: t("dashboard.expectedReturns"),
      value: currency(expectedReturns),
      subtext: t("dashboard.calculatedByBackend"),
      icon: TrendingUp,
      trend: "neutral" as const,
      iconColorClass: "text-success",
      iconBgClass: "bg-success/10",
    },
    {
      label: t("dashboard.availableProjects"),
      value: availableProjects.length.toString(),
      subtext: t("dashboard.verifiedProjectsToReview"),
      icon: Wallet,
      trend: "neutral" as const,
      iconColorClass: "text-accent",
      iconBgClass: "bg-accent/10",
    },
  ];

  return (
    <DashboardLayout roleBase="/dashboard/investor">
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {t("dashboard.goodMorningName", { name: "" })}<span className="gradient-text"><bdi dir="auto">{user?.full_name?.split(" ")[0] || t("dashboard.investorFallback")}</bdi></span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? t("dashboard.portfolioLoading") : t("dashboard.portfolioSummary", { count: formatNumber(investments.length) })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <Link to="/projects"><Eye className="me-1.5 h-4 w-4" /> {t("home.browse")}</Link>
              </Button>
              <Button size="sm" asChild className="cursor-pointer">
                <Link to="/projects">{t("projects.invest")} <ArrowRight className="ms-1.5 h-4 w-4 rtl-flip" /></Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, index) => <StatCard key={card.label} {...card} index={index} />)}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader title={t("dashboard.portfolioPerformance")} subtitle={t("dashboard.investmentByMonth")} />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={performance}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174 78% 26%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(174 78% 26%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="hsl(174 78% 26%)" strokeWidth={2.5} fill="url(#portfolioGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader title={t("dashboard.portfolioAllocation")} subtitle={t("dashboard.byProjectCategory")} />
            {allocation.length ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-full sm:w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={allocation} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={56} 
                        outerRadius={76} 
                        paddingAngle={3} 
                        dataKey="value"
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      >
                        {allocation.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground">{data.name}</p>
                                <p className="text-sm font-bold text-foreground">{data.value}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t("dashboard.total")}</p>
                      <p className="text-lg font-bold text-foreground">100%</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allocation.map((item) => (
                      <motion.div 
                        key={item.name}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 transition-all hover:border-primary/30 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="h-2.5 w-2.5 rounded-full shadow-sm" 
                            style={{ 
                              background: item.color,
                              boxShadow: `0 0 8px ${item.color}40`
                            }} 
                          />
                          <span className="text-xs font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.value}%</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={BookMarked} title={t("dashboard.noAllocation")} description={t("dashboard.firstInvestmentAllocation")} ctaLabel={t("home.browse")} ctaHref="/projects" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <SectionHeader title={t("dashboard.recentTransactions")} subtitle={t("dashboard.recentBackendPayments", { count: 5 })} />
          </div>
          {investments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Briefcase} title={t("dashboard.noTransactions")} description={t("dashboard.firstInvestmentPrompt")} ctaLabel={t("home.browse")} ctaHref="/projects" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["project", "amountPaid", "payment", "status", "dateTime", "details"].map((header) => (
                      <th key={header} className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`dashboard.table.${header}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {investments.slice(0, 5).map((investment) => (
                    <tr
                      key={investment.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTransaction(investment)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTransaction(investment);
                        }
                      }}
                      className="group cursor-pointer transition-colors hover:bg-muted/20 focus:bg-muted/20 focus:outline-none"
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-[200px]">
                          <p className="font-medium text-foreground">{getProjectTitle(investment)}</p>
                          <Badge variant="outline" className="mt-1 text-xs">{investment.project_detail?.category_detail?.name ?? t("projects.projectFallback")}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{currency(amountOf(investment))}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <CreditCard className="h-4 w-4" />
                          {formatPaymentMethod(investment.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={investment.status} /></td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <CalendarClock className="h-4 w-4" />
                          {formatDateTime(investment.investment_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-primary transition-colors group-hover:bg-primary/10">
                          <Eye className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="watched-projects" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader title={t("dashboard.watchedProjects")} subtitle={t("dashboard.liveVerifiedBackendProjects")} />
          {availableProjects.length === 0 ? (
            <EmptyState icon={CheckCircle} title={t("dashboard.noLiveProjects")} description={t("dashboard.noVerifiedProjects")} />
          ) : (
            <div className="space-y-4">
              {availableProjects.map((project: Project) => (
                <motion.div key={project.id} whileHover={{ x: 2 }} className="group rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{project.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{project.category_detail?.name ?? t("projects.projectFallback")}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t("dashboard.daysRemaining", { count: project.days_left ?? 0 })}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild className="h-8 text-xs text-primary hover:bg-primary/5">
                      <Link to={`/projects/${project.slug}`}>{t("common.view")} <ArrowRight className="ms-1 h-3 w-3 rtl-flip" /></Link>
                    </Button>
                  </div>
                  <FundingProgressBar raised={Number(project.funded_amount)} goal={Number(project.goal_amount)} size="sm" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, hsl(174 78% 26%), hsl(224 76% 48%))" }}>
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-primary-foreground">{t("dashboard.portfolioCta")}</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">{t("dashboard.portfolioCtaText")}</p>
            </div>
            <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold" asChild>
              <Link to="/projects">{t("home.browse")} <ArrowRight className="ms-1.5 h-4 w-4 rtl-flip" /></Link>
            </Button>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/5" />
        </motion.div>
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

export default InvestorDashboard;
