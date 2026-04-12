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
import {
  ArrowRight,
  BookMarked,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  TrendingUp,
  Wallet,
} from "lucide-react";

const currency = (value: number) => `$${Math.round(value).toLocaleString()}`;
const shortDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
const monthLabel = (value: string) => new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(value));

const colors = [
  "hsl(174 78% 26%)",
  "hsl(224 76% 48%)",
  "hsl(38 92% 50%)",
  "hsl(142 72% 36%)",
  "hsl(215 16% 35%)",
];

const amountOf = (investment: Investment) => Number(investment.amount || 0);
const expectedOf = (investment: Investment) => Number(investment.expected_return || 0);

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
  const { user } = useAuth();
  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "investor", "investments"],
    queryFn: investmentsService.listInvestments,
  });
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "investor", "available-projects"],
    queryFn: () => projectsService.listProjects({ page_size: 3, ordering: "-created_at" }),
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
      label: "Total Invested",
      value: currency(totalInvested),
      subtext: `Across ${investments.length} investment${investments.length === 1 ? "" : "s"}`,
      icon: DollarSign,
      trend: "neutral" as const,
      trendValue: "Live backend data",
      iconColorClass: "text-primary",
      iconBgClass: "bg-primary/10",
    },
    {
      label: "Active Investments",
      value: activeInvestments.toString(),
      subtext: "Pending or confirmed",
      icon: Briefcase,
      trend: "neutral" as const,
      trendValue: "From investment status",
      iconColorClass: "text-secondary",
      iconBgClass: "bg-secondary/10",
    },
    {
      label: "Expected Returns",
      value: currency(expectedReturns),
      subtext: "Calculated by backend",
      icon: TrendingUp,
      trend: "neutral" as const,
      trendValue: "Projected return",
      iconColorClass: "text-success",
      iconBgClass: "bg-success/10",
    },
    {
      label: "Available Projects",
      value: availableProjects.length.toString(),
      subtext: "Verified projects to review",
      icon: Wallet,
      trend: "neutral" as const,
      trendValue: "Explore marketplace",
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
                Good morning, <span className="gradient-text">{user?.full_name?.split(" ")[0] || "Investor"}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? "Loading your portfolio from the backend..." : `You have ${investments.length} investment${investments.length === 1 ? "" : "s"} in your portfolio.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <Link to="/projects"><Eye className="mr-1.5 h-4 w-4" /> Explore Projects</Link>
              </Button>
              <Button size="sm" asChild className="cursor-pointer">
                <Link to="/projects">Invest Now <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, index) => <StatCard key={card.label} {...card} index={index} />)}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader title="Portfolio Performance" subtitle="Investment amount grouped by month" />
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
            <SectionHeader title="Portfolio Allocation" subtitle="By project category" />
            {allocation.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={allocation} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                      {allocation.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {allocation.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={BookMarked} title="No allocation yet" description="Make your first investment to see category allocation." ctaLabel="Explore Projects" ctaHref="/projects" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <SectionHeader title="Recent Investments" subtitle="Your latest backend investment records" />
          </div>
          {investments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Briefcase} title="No investments yet" description="Start exploring verified Palestinian projects and make your first investment today." ctaLabel="Explore Projects" ctaHref="/projects" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Project", "Category", "Amount", "Expected Return", "Status", "Date"].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {investments.slice(0, 8).map((investment) => (
                    <tr key={investment.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{investment.project_detail?.title ?? investment.project}</td>
                      <td className="px-6 py-4"><Badge variant="outline" className="text-xs">{investment.project_detail?.category_detail?.name ?? "Project"}</Badge></td>
                      <td className="px-6 py-4 font-semibold text-foreground">{currency(amountOf(investment))}</td>
                      <td className="px-6 py-4 text-success font-semibold">{currency(expectedOf(investment))}</td>
                      <td className="px-6 py-4"><StatusBadge status={investment.status} /></td>
                      <td className="px-6 py-4 text-muted-foreground">{shortDate(investment.investment_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader title="Available Projects" subtitle="Live verified projects from the backend" />
          {availableProjects.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No live projects" description="No verified projects are available right now." />
          ) : (
            <div className="space-y-4">
              {availableProjects.map((project: Project) => (
                <motion.div key={project.id} whileHover={{ x: 2 }} className="group rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{project.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{project.category_detail?.name ?? "Project"}</Badge>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {project.days_left ?? 0}d left</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild className="h-8 text-xs text-primary hover:bg-primary/5">
                      <Link to={`/projects/${project.slug}`}>View <ArrowRight className="ml-1 h-3 w-3" /></Link>
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
              <h3 className="text-xl font-bold text-primary-foreground">Ready to grow your portfolio?</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">Discover verified Palestinian projects seeking investors like you.</p>
            </div>
            <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold" asChild>
              <Link to="/projects">Explore Projects <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/5" />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default InvestorDashboard;
