import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/i18n/format";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "./DashboardLayout";
import EmptyState from "@/components/dashboard/EmptyState";
import FundingProgressBar from "@/components/dashboard/FundingProgressBar";
import StatusBadge from "@/components/dashboard/StatusBadge";
import investmentsService, { Investment } from "@/services/investmentsService";
import projectsService, { Project } from "@/services/projectsService";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Eye,
  FolderOpen,
  PieChart as PieChartIcon,
  PlusSquare,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const currency = (value: number) => formatCurrency(value);
const compactNumber = (value: number) => formatNumber(value, { notation: "compact" });
const percent = (value: number) => formatPercent(value);

const amountOf = (investment: Investment) => Number(investment.amount || 0);
const expectedOf = (investment: Investment) => Number(investment.expected_return || 0);
const projectRaised = (project: Project) => Number(project.funded_amount || 0);
const projectGoal = (project: Project) => Number(project.goal_amount || 0);

const projectFundingPercent = (project: Project) => {
  const apiPercent = Number(project.funding_percent || 0);
  if (apiPercent > 0) return Math.min(Math.round(apiPercent), 100);

  const goal = projectGoal(project);
  return goal > 0 ? Math.min(Math.round((projectRaised(project) / goal) * 100), 100) : 0;
};

export type Timeframe = "1M" | "3M" | "6M" | "1Y" | "ALL";

const buildPerformanceData = (investments: Investment[], timeframe: Timeframe) => {
  const now = new Date();
  let startDate = new Date(0);

  if (timeframe === "1M") startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (timeframe === "3M") startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (timeframe === "6M") startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  if (timeframe === "1Y") startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const filtered = investments.filter((inv) => {
    const d = new Date(inv.investment_date);
    return !Number.isNaN(d.getTime()) && d >= startDate;
  });

  const grouped = filtered.reduce<Record<string, { raised: number; transactions: number; investors: Set<string>; sortKey: string }>>(
    (acc, investment) => {
      const date = new Date(investment.investment_date);
      let key = "";
      let sortKey = "";
      
      if (timeframe === "1M") {
        key = formatDate(date, { month: "short", day: "numeric" });
        sortKey = date.toISOString().split("T")[0];
      } else if (timeframe === "3M") {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        key = i18n.t("analytics.weekOf", { date: formatDate(startOfWeek, { month: "short", day: "numeric" }) });
        sortKey = startOfWeek.toISOString().split("T")[0];
      } else {
        key = formatDate(date, { month: "short", year: timeframe === "ALL" ? "numeric" : undefined });
        sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!acc[key]) acc[key] = { raised: 0, transactions: 0, investors: new Set(), sortKey };
      acc[key].raised += amountOf(investment);
      acc[key].transactions += 1;
      acc[key].investors.add(investment.investor);
      return acc;
    },
    {}
  );

  const rows = Object.entries(grouped)
    .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
    .map(([label, data]) => ({
      label,
      raised: data.raised,
      transactions: data.transactions,
      investors: data.investors.size,
    }));

  return rows.length ? rows : [{ label: i18n.t("analytics.noData"), raised: 0, transactions: 0, investors: 0 }];
};

const buildStatusMix = (projects: Project[]) => {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--accent))",
    "hsl(var(--muted-foreground))",
  ];

  const grouped = projects.reduce<Record<string, number>>((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  const rows = Object.entries(grouped).map(([status, value], index) => ({
    name: i18n.t(`status.${status}`, { defaultValue: status.replace(/_/g, " ") }),
    value,
    color: colors[index % colors.length],
  }));

  return rows.length ? rows : [{ name: i18n.t("analytics.noProjects"), value: 1, color: "hsl(var(--muted))" }];
};

const chartProjectName = (title: string) => (title.length > 16 ? `${title.slice(0, 15)}...` : title);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const MoneyTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string }[];
  label?: string;
}) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => {
          const value = Number(item.value || 0);
          const isMoney = item.name === "raised" || item.name === "goal";
          return (
            <p key={item.name} className="flex items-center justify-between gap-5 text-foreground">
              <span className="text-muted-foreground">{t(`analytics.${item.name}`, { defaultValue: item.name })}</span>
              <span className="font-bold">{isMoney ? currency(value) : formatNumber(value)}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
};

const EntrepreneurAnalyticsPage = () => {
  const { t } = useTranslation();
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "analytics", "projects"],
    queryFn: projectsService.listMyProjects,
    refetchInterval: 5000,
  });

  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "analytics", "investments"],
    queryFn: investmentsService.listInvestments,
    refetchInterval: 5000,
  });

  const projects = projectsQuery.data?.results ?? [];
  const investments = investmentsQuery.data?.results ?? [];
  const isLoading = projectsQuery.isLoading || investmentsQuery.isLoading;

  const confirmedInvestments = investments.filter(
    (investment) => investment.status === "confirmed" || investment.status === "completed"
  );
  const paidInvestments = confirmedInvestments.length ? confirmedInvestments : investments;
  const totalRaised = projects.reduce((sum, project) => sum + projectRaised(project), 0);
  const totalGoal = projects.reduce((sum, project) => sum + projectGoal(project), 0);
  const totalInvestors = projects.reduce((sum, project) => sum + Number(project.investor_count || 0), 0);
  const rawTotalViews = projects.reduce((sum, project) => sum + Number(project.view_count || 0), 0);
  const totalViews = Math.max(rawTotalViews, totalInvestors > 0 ? Math.ceil(totalInvestors * 2.5) : 0);
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const fundedProjects = projects.filter((project) => project.status === "successful" || projectFundingPercent(project) >= 100).length;
  const avgFunding = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + projectFundingPercent(project), 0) / projects.length)
    : 0;
  const averageTicket = paidInvestments.length
    ? paidInvestments.reduce((sum, investment) => sum + amountOf(investment), 0) / paidInvestments.length
    : 0;
  const expectedReturn = confirmedInvestments.reduce((sum, investment) => sum + expectedOf(investment), 0);
  const conversionRate = totalViews > 0 ? (totalInvestors / totalViews) * 100 : 0;

  const [timeframe, setTimeframe] = useState<Timeframe>("6M");
  const performanceData = buildPerformanceData(investments, timeframe);
  const statusMix = buildStatusMix(projects);
  const topProjects = [...projects]
    .sort((a, b) => projectFundingPercent(b) - projectFundingPercent(a))
    .slice(0, 5);
  const topProject = topProjects[0];
  const projectChartData = topProjects.length
    ? topProjects.map((project) => ({
        name: chartProjectName(project.title),
        raised: projectRaised(project),
        goal: projectGoal(project),
        progress: projectFundingPercent(project),
      }))
    : [{ name: t("analytics.noProjects"), raised: 0, goal: 0, progress: 0 }];

  const funnelSteps = [
    { label: t("analytics.projectViews"), value: totalViews, icon: Eye, color: "bg-secondary" },
    { label: t("analytics.investorInterest"), value: totalInvestors, icon: Users, color: "bg-primary" },
    { label: t("analytics.confirmedPaymentLabel"), value: confirmedInvestments.length, icon: CircleDollarSign, color: "bg-success" },
  ];
  const funnelMax = Math.max(...funnelSteps.map((step) => step.value), 1);

  const metricCards = [
    {
      label: t("analytics.totalRaised"),
      value: currency(totalRaised),
      subtext: t("analytics.ofFundingGoal", { percent: percent(totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0) }),
      icon: CircleDollarSign,
      iconClass: "from-primary/20 to-primary/5 text-primary",
      glowClass: "from-primary/40 to-primary/5",
      borderClass: "hover:border-primary/50",
    },
    {
      label: t("analytics.averageProgress"),
      value: percent(avgFunding),
      subtext: t("analytics.activeFunded", { active: formatNumber(activeProjects), funded: formatNumber(fundedProjects) }),
      icon: Target,
      iconClass: "from-secondary/20 to-secondary/5 text-secondary",
      glowClass: "from-secondary/40 to-secondary/5",
      borderClass: "hover:border-secondary/50",
    },
    {
      label: t("analytics.investorReach"),
      value: totalInvestors.toString(),
      subtext: t("analytics.totalViews", { count: compactNumber(totalViews) }),
      icon: Users,
      iconClass: "from-success/20 to-success/5 text-success",
      glowClass: "from-success/40 to-success/5",
      borderClass: "hover:border-success/50",
    },
    {
      label: t("analytics.averageTransaction"),
      value: currency(averageTicket),
      subtext: t("analytics.confirmedPayments", { count: formatNumber(confirmedInvestments.length) }),
      icon: Activity,
      iconClass: "from-warning/20 to-warning/5 text-warning",
      glowClass: "from-warning/40 to-warning/5",
      borderClass: "hover:border-warning/50",
    },
  ];

  return (
    <DashboardLayout roleBase="/dashboard/entrepreneur">
      <motion.div className="space-y-7" variants={containerVariants} initial="hidden" animate="visible">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{t("analytics.title")}</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {t("analytics.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("analytics.portfolioFunding")}</span>
              <span className="font-black text-primary">{currency(totalRaised)}</span>
            </div>
          </div>
        </div>

        <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${metric.borderClass} hover:-translate-y-1`}>
              <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60 ${metric.glowClass}`} />
              <div className={`absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-gradient-to-tr opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40 ${metric.glowClass}`} />
              <div className="relative flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${metric.iconClass} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-3xl font-black text-foreground tracking-tight">{metric.value}</p>
                  <p className="mt-1.5 text-[11px] font-medium text-muted-foreground bg-foreground/5 w-fit px-2 py-0.5 rounded-md transition-colors group-hover:bg-foreground/10">{metric.subtext}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.section>

        {!isLoading && projects.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={FolderOpen}
              title={t("analytics.noAnalytics")}
              description={t("analytics.noAnalyticsText")}
              ctaLabel={t("analytics.startProject")}
              ctaHref="/start-project"
            />
          </motion.div>
        ) : (
          <>
            <motion.section variants={itemVariants} className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
              <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary/20">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-foreground">{t("analytics.fundingMomentum")}</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t(timeframe === "1M" ? "analytics.dailyRaised" : timeframe === "3M" ? "analytics.weeklyRaised" : "analytics.monthlyRaised")}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-muted/30 p-1 rounded-lg">
                    {(["1M", "3M", "6M", "1Y", "ALL"] as Timeframe[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeframe === tf ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-72 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="raisedGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tickMargin={10} fontWeight="600" />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={10} fontWeight="600" tickFormatter={(value) => compactNumber(Number(value))} />
                      <Tooltip content={<MoneyTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area
                        type="monotone"
                        dataKey="raised"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fill="url(#raisedGradient)"
                        name="raised"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-xl hover:border-secondary/20 flex flex-col h-full">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary ring-1 ring-secondary/20">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-foreground">{t("analytics.activeProjects")}</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("analytics.fundingProgress")}</p>
                    </div>
                  </div>
                </div>
                {projects.filter(p => p.status === 'active').length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-sm font-medium text-muted-foreground">{t("analytics.noActive")}</p>
                  </div>
                ) : (
                  <>
                    <div className="h-40 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={projects.filter(p => p.status === 'active').map((p, i) => ({
                              name: chartProjectName(p.title),
                              value: Math.max(projectRaised(p), 1),
                              color: ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--accent))"][i % 5]
                            }))} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={30} 
                            outerRadius={55} 
                            paddingAngle={3}
                          >
                            {projects.filter(p => p.status === 'active').map((_, i) => (
                              <Cell key={`cell-${i}`} fill={["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--accent))"][i % 5]} />
                            ))}
                          </Pie>
                          <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                      {projects.filter(p => p.status === 'active').map((project, i) => {
                        const colors = ["bg-primary", "bg-secondary", "bg-success", "bg-warning", "bg-accent"];
                        const bgColors = ["bg-primary/10", "bg-secondary/10", "bg-success/10", "bg-warning/10", "bg-accent/10"];
                        const textColors = ["text-primary", "text-secondary", "text-success", "text-warning", "text-accent"];
                        const colorIdx = i % 5;
                        return (
                          <div key={project.id} className="space-y-2 group">
                            <div className="flex items-center justify-between text-sm">
                              <Link to={`/projects/${project.slug}`} className="font-bold text-foreground hover:opacity-80 transition-opacity line-clamp-1 flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${colors[colorIdx]}`} />
                                {project.title}
                              </Link>
                              <span className={`text-xs font-black ${textColors[colorIdx]} ${bgColors[colorIdx]} px-2 py-0.5 rounded-md ml-2 shrink-0`}>
                                {percent(projectFundingPercent(project))}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                              <div 
                                className={`h-full rounded-full ${colors[colorIdx]} transition-all duration-1000`} 
                                style={{ width: `${projectFundingPercent(project)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.4fr)]">
              <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary/20">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-foreground">{t("analytics.interactions")}</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("analytics.engagement")}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-6">
                  {funnelSteps.map((step) => (
                    <div key={step.label} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-card/30">
                      <div className="flex items-center gap-4">
                        <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform hover:scale-110 ${step.color}`}>
                          <step.icon className="h-5 w-5" />
                        </span>
                        <span className="text-base font-bold text-foreground">{step.label}</span>
                      </div>
                      <span className="text-2xl font-black text-foreground">{formatNumber(step.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary/20">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-foreground">{t("analytics.topPerformance")}</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("analytics.raisedVsGoal")}</p>
                    </div>
                  </div>
                  {topProject && (
                    <Button variant="outline" size="sm" asChild className="rounded-full border-primary/20 text-primary hover:bg-primary/10 font-bold px-4">
                      <Link to={`/projects/${topProject.slug}`}>
                        {t("analytics.openTop")}
                        <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="h-72 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectChartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} tickMargin={10} fontWeight="600" />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={10} fontWeight="600" tickFormatter={(value) => compactNumber(Number(value))} />
                      <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
                      <Bar dataKey="goal" fill="hsl(var(--muted))" radius={[8, 8, 0, 0]} name="goal" maxBarSize={50} />
                      <Bar dataKey="raised" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} name="raised" maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between bg-card/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-foreground">{t("analytics.projectList")}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("analytics.visibility")}</p>
                  </div>
                </div>
                <Button size="sm" asChild className="w-fit bg-primary hover:bg-primary/90 rounded-full font-bold shadow-md shadow-primary/20 px-5">
                  <Link to="/start-project">
                    <PlusSquare className="me-2 h-4 w-4" />
                    {t("analytics.newProject")}
                  </Link>
                </Button>
              </div>

              <div className="divide-y divide-border/50">
                {projects.map((project) => (
                  <div key={project.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)_130px_130px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/projects/${project.slug}`} className="truncate font-semibold text-foreground hover:text-primary">
                          {project.title}
                        </Link>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {t("analytics.categoryLocation", { category: project.category_detail?.name || project.category || t("analytics.uncategorized"), location: project.location || t("analytics.noLocation") })}
                      </p>
                    </div>
                    <div>
                      <FundingProgressBar raised={projectRaised(project)} goal={projectGoal(project)} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span>
                        {t("analytics.investors", { count: formatNumber(project.investor_count || 0) })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 text-secondary" />
                      <span>
                        {t("analytics.views", { count: formatNumber(Number(project.view_count || 0)) })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default EntrepreneurAnalyticsPage;
