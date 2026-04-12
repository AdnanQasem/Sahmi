import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";

const currency = (value: number) => `$${Math.round(value).toLocaleString()}`;
const monthLabel = (value: string) => new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(value));
const shortDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

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

const CustomTooltip = ({ active, payload, label }: any) => {
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "projects"],
    queryFn: projectsService.listMyProjects,
  });
  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "investments"],
    queryFn: investmentsService.listInvestments,
  });

  const projects = projectsQuery.data?.results ?? [];
  const investments = investmentsQuery.data?.results ?? [];
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const pendingProjects = projects.filter((project) => project.status === "draft" || !project.is_verified).length;
  const totalRaised = projects.reduce((sum, project) => sum + projectRaised(project), 0);
  const totalInvestors = projects.reduce((sum, project) => sum + (project.investor_count ?? 0), 0);
  const monthly = groupInvestmentsByMonth(investments);
  const firstProject = projects[0];
  const isLoading = projectsQuery.isLoading || investmentsQuery.isLoading;

  const kpiCards = [
    {
      label: "Total Projects",
      value: projects.length.toString(),
      subtext: `${activeProjects} active`,
      icon: FolderOpen,
      trend: "neutral" as const,
      trendValue: "From backend",
      iconColorClass: "text-secondary",
      iconBgClass: "bg-secondary/10",
    },
    {
      label: "Active Projects",
      value: activeProjects.toString(),
      subtext: "Currently live",
      icon: Zap,
      trend: "neutral" as const,
      trendValue: "Status active",
      iconColorClass: "text-success",
      iconBgClass: "bg-success/10",
    },
    {
      label: "Total Funding Raised",
      value: currency(totalRaised),
      subtext: "Across all projects",
      icon: DollarSign,
      trend: "neutral" as const,
      trendValue: "Synced totals",
      iconColorClass: "text-primary",
      iconBgClass: "bg-primary/10",
    },
    {
      label: "Pending Review",
      value: pendingProjects.toString(),
      subtext: "Draft or unverified",
      icon: Clock,
      trend: "neutral" as const,
      trendValue: "Needs review",
      iconColorClass: "text-warning",
      iconBgClass: "bg-warning/10",
    },
  ];

  return (
    <DashboardLayout roleBase="/dashboard/entrepreneur">
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Good morning, <span className="gradient-text">{user?.full_name?.split(" ")[0] || "Founder"}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? "Loading your project dashboard from the backend..." : `Your projects have ${totalInvestors} investor${totalInvestors === 1 ? "" : "s"} recorded.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <Link to="/start-project"><PlusSquare className="mr-1.5 h-4 w-4" /> Add Project</Link>
              </Button>
              {firstProject && (
                <Button size="sm" asChild className="cursor-pointer">
                  <Link to={`/projects/${firstProject.slug}`}>View Latest <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, index) => <StatCard key={card.label} {...card} index={index} />)}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader title="Funding Raised Over Time" subtitle="Monthly investment records from backend" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174 78% 26%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(174 78% 26%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="raised" stroke="hsl(174 78% 26%)" strokeWidth={2.5} fill="url(#fundingGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader title="Investors per Month" subtitle="Unique investor labels from investment records" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215 16% 35%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="investors" fill="hsl(224 76% 48%)" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <SectionHeader title="My Projects" subtitle="Manage and track your backend project records" ctaLabel="Add New Project" ctaIcon={PlusSquare} onCta={() => navigate("/start-project")} />
          </div>

          {projects.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={FolderOpen} title="No projects yet" description="Create your first project and start raising funds from the Sahmi community." ctaLabel="Add New Project" ctaHref="/start-project" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map((project: Project) => (
                <motion.div key={project.id} whileHover={{ backgroundColor: "hsl(214 32% 91% / 0.3)" }} className="group flex flex-col gap-4 px-6 py-5 transition-colors md:flex-row md:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{project.title}</p>
                      <StatusBadge status={project.status} />
                      <Badge variant="outline" className="text-xs">{project.category_detail?.name ?? "Project"}</Badge>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {project.investor_count} investors</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {project.days_left ?? 0} days left</span>
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {(project.view_count ?? 0).toLocaleString()} views</span>
                    </div>
                    <FundingProgressBar raised={projectRaised(project)} goal={projectGoal(project)} size="sm" />
                    {!project.is_verified && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-warning">
                        <AlertCircle className="h-3.5 w-3.5" /> Pending platform review
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="outline" asChild className="cursor-pointer text-xs">
                      <Link to={`/projects/${project.slug}/edit`}><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit</Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild className="cursor-pointer text-xs text-primary hover:bg-primary/5">
                      <Link to={`/projects/${project.slug}`}><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader title="Investor Activity" subtitle="Recent contributions from investment records" />
          {investments.length === 0 ? (
            <EmptyState icon={Users} title="No activity yet" description="Once your project receives investments, contribution records will appear here." />
          ) : (
            <div className="space-y-3">
              {investments.slice(0, 8).map((investment) => (
                <div key={investment.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold text-primary border border-primary/15">
                    {investment.investor?.[0]?.toUpperCase() ?? "I"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{investment.investor}</p>
                    <p className="text-xs text-muted-foreground truncate">{investment.project_detail?.title ?? investment.project}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">+{currency(amountOf(investment))}</p>
                    <p className="text-xs text-muted-foreground">{shortDate(investment.investment_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, hsl(224 76% 48%), hsl(174 78% 26%))" }}>
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-primary-foreground">Grow your vision</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">Add a new project or review your latest backend activity.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold" asChild>
                <Link to="/start-project"><PlusSquare className="mr-1.5 h-4 w-4" /> Add Project</Link>
              </Button>
              <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/projects"><Eye className="mr-1.5 h-4 w-4" /> View Platform</Link>
              </Button>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/5" />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default EntrepreneurDashboard;
