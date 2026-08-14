import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import projectsService, { Project } from "@/services/projectsService";
import investmentsService, { Investment } from "@/services/investmentsService";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FolderOpen,
  PlusSquare,
  Users,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  MessageSquare,
} from "lucide-react";

const currency = (value: number) => formatCurrency(Math.round(value));
const monthLabel = (value: string) => formatDate(value, { month: "short" });
const shortDate = (value: string) => formatDate(value, { month: "short", day: "numeric" });

const amountOf = (investment: Investment) => Number(investment.amount || 0);
const projectRaised = (project: Project) => Number(project.funded_amount || 0);
const projectGoal = (project: Project) => Number(project.goal_amount || 0);

const groupInvestmentsByMonth = (investments: Investment[]) => {
  const byMonth = investments.reduce<Record<string, { raised: number; investors: Set<string> }>>((acc, investment) => {
    const label = monthLabel(investment.investment_date);
    if (!acc[label]) acc[label] = { raised: 0, investors: new Set() };
    acc[label].raised += amountOf(investment);
    acc[label].investors.add(investment.investor);
    return acc;
  }, {});
  const rows = Object.entries(byMonth).map(([month, data]) => ({
    month,
    raised: data.raised,
    investors: data.investors.size,
  }));
  return rows.length ? rows : [{ month: "Now", raised: 0, investors: 0 }];
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-sm">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground">
          {item.name === "raised" ? currency(item.value) : `${item.value} investors`}
        </p>
      </div>
    );
  }
  return null;
};

const EntrepreneurDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "projects"],
    queryFn: projectsService.listMyProjects,
    refetchInterval: 5000,
  });
  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "investments"],
    queryFn: investmentsService.listInvestments,
    refetchInterval: 5000,
  });

  const projects = projectsQuery.data?.results ?? [];
  const investments = investmentsQuery.data?.results ?? [];
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const completedProjects = projects.filter(
    (project) => project.status === "successful" || projectRaised(project) >= projectGoal(project),
  ).length;
  const pendingProjects = projects.filter((project) => project.status === "draft" || !project.is_verified).length;
  const totalRaised = projects.reduce((sum, project) => sum + projectRaised(project), 0);
  const totalInvestors = projects.reduce((sum, project) => sum + (project.investor_count ?? 0), 0);
  const monthly = groupInvestmentsByMonth(investments);
  const firstProject = projects[0];
  const isLoading = projectsQuery.isLoading || investmentsQuery.isLoading;

  const kpiCards = [
    {
      label: t("dashboard.totalProjects"),
      value: projects.length.toString(),
      subtext: t("dashboard.completedProjectCount", { count: completedProjects }),
      icon: FolderOpen,
      trend: "neutral" as const,
      iconColorClass: "text-secondary",
      iconBgClass: "bg-secondary/10",
    },
    {
      label: t("dashboard.activeProjects"),
      value: activeProjects.toString(),
      subtext: t("dashboard.liveProjectCount", { count: activeProjects }),
      icon: Zap,
      trend: "neutral" as const,
      iconColorClass: "text-success",
      iconBgClass: "bg-success/10",
    },
    {
      label: t("dashboard.totalFundingRaised"),
      value: currency(totalRaised),
      subtext: t("dashboard.acrossAllProjects"),
      icon: DollarSign,
      trend: "neutral" as const,
      iconColorClass: "text-primary",
      iconBgClass: "bg-primary/10",
    },
    {
      label: t("dashboard.pendingReview"),
      value: pendingProjects.toString(),
      subtext: t("dashboard.draftOrUnverified"),
      icon: Clock,
      trend: "neutral" as const,
      iconColorClass: "text-warning",
      iconBgClass: "bg-warning/10",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const cardHoverVariants = {
    rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <DashboardLayout roleBase="/dashboard/entrepreneur">
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-6 sm:p-8">
            <div className="space-y-2">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">{t("dashboard.entrepreneur")}</span>
              </motion.div>
              <motion.h1 
                className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {t("dashboard.welcomeBackName", { name: "" })}<br className="sm:hidden" />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                  <bdi dir="auto">{user?.full_name?.split(" ")[0] || t("dashboard.founder")}</bdi>
                </span>
              </motion.h1>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {isLoading ? t("dashboard.dashboardLoading") : t("dashboard.entrepreneurSummary", { investors: formatNumber(totalInvestors), projects: formatNumber(projects.length) })}
              </motion.p>
            </div>
            <motion.div 
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                asChild 
                className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-300"
              >
                <Link to="/start-project">
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <PlusSquare className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative">{t("projects.startTitle")}</span>
                </Link>
              </Button>
              {firstProject && (
                <Button 
                  size="lg"
                  asChild 
                  className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-secondary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  <Link to={`/projects/${firstProject.slug}`}>
                    <Eye className="me-2 h-4 w-4" />{t("dashboard.viewLatest")}<ArrowRight className="ms-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 rtl-flip" />
                  </Link>
                </Button>
              )}
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <AnimatePresence mode="wait">
            {kpiCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <StatCard {...card} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <motion.div 
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <SectionHeader 
              title={t("dashboard.fundingOverTime")} 
              subtitle={t("dashboard.monthlyInvestmentRecords")}
            />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174 78% 26%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(174 78% 26%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="raised" 
                  stroke="hsl(174 78% 26%)" 
                  strokeWidth={3}
                  fill="url(#fundingGradient)" 
                  dot={{ fill: "hsl(174 78% 26%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "white" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/50 via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <SectionHeader 
              title={t("dashboard.investorsPerMonth")} 
              subtitle={t("dashboard.uniqueInvestorActivity")}
            />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly} barSize={32}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(224 76% 48%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(224 76% 48%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="investors" 
                  fill="url(#barGradient)" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        <motion.div 
          id="projects-section"
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-card via-muted/20 to-card">
            <SectionHeader 
              title={t("dashboard.project")} 
              subtitle={t("dashboard.manageTrackProjects")}
              ctaLabel={t("dashboard.addNewProject")}
              ctaIcon={PlusSquare} 
              onCta={() => navigate("/start-project")} 
            />
          </div>

          <AnimatePresence mode="wait">
            {projects.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6"
              >
                <EmptyState 
                  icon={FolderOpen} 
                  title={t("dashboard.noProjects")} 
                  description={t("dashboard.createFirstProjectText")}
                  ctaLabel={t("dashboard.addNewProject")}
                  ctaHref="/start-project" 
                />
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                className="divide-y divide-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {projects.map((project: Project, index: number) => {
                  return (
                    <motion.div 
                      key={project.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ 
                        backgroundColor: "hsl(214 32% 98%)",
                        x: 4
                      }}
                      className="group relative flex flex-col gap-4 px-6 py-5 transition-all duration-300 md:flex-row md:items-center"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-primary to-secondary rounded-r-full group-hover:h-8 transition-all duration-300" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{project.title}</p>
                          <StatusBadge status={project.status} />
                          <Badge variant="outline" className="text-xs border-primary/20">{project.category_detail?.name ?? t("projects.projectFallback")}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200">
                            <Users className="h-3.5 w-3.5" /> 
                            <span className="font-medium">{project.investor_count}</span>{t("dashboard.investorsCount")}</span>
                          <span className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200">
                            <Clock className="h-3.5 w-3.5" /> 
                            <span className="font-medium">{project.days_left ?? 0}</span>{t("dashboard.daysCount")}</span>
                          <span className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200">
                            <Eye className="h-3.5 w-3.5" /> 
                            <span className="font-medium">{formatNumber(project.view_count ?? 0)}</span>{t("dashboard.viewsCount")}</span>
                        </div>
                        {project.status === "active" && (
                          <div className="mt-4">
                            <FundingProgressBar raised={projectRaised(project)} goal={projectGoal(project)} size="sm" />
                          </div>
                        )}
                        {!project.is_verified && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-1.5 rounded-full w-fit"
                          >
                            <AlertCircle className="h-3.5 w-3.5" /> 
                            <span>{t("dashboard.pendingReview")}</span>
                          </motion.div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          asChild 
                          className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
                        >
                          <Link to={`/projects/${project.slug}/edit`}>
                            <Edit className="mr-1.5 h-3.5 w-3.5" />{t("common.edit")}</Link>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          asChild 
                          className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                        >
                          <Link to={`/projects/${project.slug}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />{t("common.view")}</Link>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          <motion.div 
            className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm"
            whileHover={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
          >
            <SectionHeader 
              title={t("dashboard.investorActivity")} 
              subtitle={t("dashboard.recentContributions")}
            />
            <AnimatePresence mode="wait">
              {investments.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <EmptyState 
                    icon={Users} 
                    title={t("dashboard.noActivityYet")} 
                    description={t("dashboard.investmentRecordsAppear")}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="list"
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {investments.slice(0, 4).map((investment, index) => (
                    <motion.div
                      key={investment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 8, backgroundColor: "hsl(var(--muted))" }}
                      className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent px-4 py-3.5 border border-transparent hover:border-border transition-all duration-300 cursor-pointer"
                    >
                      <motion.div 
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {investment.investor?.[0]?.toUpperCase() ?? "I"}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{investment.investor}</p>
                        <p className="text-xs text-muted-foreground truncate">{investment.project_detail?.title ?? investment.project}</p>
                      </div>
                      <div className="text-right">
                        <motion.p 
                          className="text-sm font-bold text-success"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                        >
                          +{currency(amountOf(investment))}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">{shortDate(investment.investment_date)}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm"
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t("dashboard.messages")}</h3>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">{t("dashboard.newCount", { count: formatNumber(2) })}</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { id: 1, sender: "Sarah Ahmed", message: t("dashboard.sampleMessageInterest"), time: t("dashboard.minutesAgo", { count: 5 }), unread: true, initials: "SA" },
                  { id: 2, sender: "Layla Khaled", message: t("dashboard.sampleMessageProposal"), time: t("dashboard.daysAgo", { count: 1 }), unread: false, initials: "LK", status: "premium" },
                  { id: 3, sender: "Mohammad H.", message: t("dashboard.sampleMessageGoal"), time: t("dashboard.daysAgo", { count: 2 }), unread: false, initials: "MH" }
                ].map((msg) => (
                  <Link to="/dashboard/entrepreneur/messages" key={msg.id} className="block group">
                    <div className={`p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 ${msg.unread ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'bg-transparent border-border hover:border-primary/30 hover:bg-muted/50'}`}>
                      <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        msg.status === "premium"
                          ? 'bg-gradient-to-br from-warning to-warning/70 text-secondary-foreground shadow-sm'
                          : msg.unread 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {msg.initials}
                        {msg.status === "premium" && (
                          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warning text-secondary-foreground shadow-sm">
                            <Sparkles className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm truncate ${msg.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                              {msg.sender}
                            </p>
                            {msg.status === "premium" && (
                              <Badge variant="secondary" className="px-1 py-0 h-4 text-[10px] bg-warning/10 text-warning border-0">{t("dashboard.premium")}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{msg.time}</span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${msg.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {msg.message}
                        </p>
                      </div>
                      {msg.unread && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-2 text-xs text-muted-foreground hover:text-primary transition-colors" asChild>
                <Link to="/dashboard/entrepreneur/messages">{t("dashboard.messages")} <ArrowRight className="ms-1.5 h-3.5 w-3.5 rtl-flip" /></Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
};

export default EntrepreneurDashboard;
