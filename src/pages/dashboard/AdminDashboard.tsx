import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FolderOpen,
  Gauge,
  Layers3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "./DashboardLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardPollingOptions } from "@/lib/dashboardPolling";
import { formatCurrency, formatDate } from "@/i18n/format";
import adminProjectsService from "@/services/adminProjectsService";

interface KpiCardProps {
  label: string;
  value: string;
  context: string;
  icon: typeof FolderOpen;
  tone: "primary" | "warning" | "success" | "secondary";
}

const toneClasses = {
  primary: "bg-primary/8 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  secondary: "bg-secondary/10 text-secondary",
};

const KpiCard = ({ label, value, context, icon: Icon, tone }: KpiCardProps) => (
  <article className="group flex min-h-40 flex-col justify-between rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
    </div>
    <div className="mt-7">
      <p className="break-words text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      <span className="mt-2 inline-flex max-w-full rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        {context}
      </span>
    </div>
  </article>
);

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => adminProjectsService.listProjects({ page_size: 100, ordering: "-created_at" }),
    staleTime: 30_000,
    ...dashboardPollingOptions,
  });
  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: adminProjectsService.listCategories,
    staleTime: 60_000,
  });

  const projects = useMemo(() => projectsQuery.data?.results || [], [projectsQuery.data?.results]);
  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  const visibleProjects = useMemo(() => projects.filter((project) => !project.deleted_at), [projects]);
  const pendingProjects = useMemo(
    () => visibleProjects.flatMap((project) => {
      const records: Array<{ project: typeof project; isEdit: boolean; submittedAt: string }> = [];
      if (!project.is_verified && project.status === "draft") {
        records.push({ project, isEdit: false, submittedAt: project.created_at });
      }
      if (project.pending_edit_request) {
        records.push({ project, isEdit: true, submittedAt: project.pending_edit_request.created_at });
      }
      return records;
    }),
    [visibleProjects],
  );
  const totalFunded = useMemo(
    () => visibleProjects.reduce((total, project) => total + (Number(project.funded_amount) || 0), 0),
    [visibleProjects],
  );
  const activeCount = visibleProjects.filter((project) => project.status === "fundraising").length;
  const verifiedCount = visibleProjects.filter((project) => project.is_verified).length;
  const verificationRate = visibleProjects.length ? Math.round((verifiedCount / visibleProjects.length) * 100) : 0;
  const usedCategoryIds = new Set(visibleProjects.map((project) => project.category).filter(Boolean));
  const categoryCoverage = categories.length ? Math.round((usedCategoryIds.size / categories.length) * 100) : 0;
  const statusBreakdown = ["draft", "fundraising", "implementation", "completed"].map((status) => ({
    status,
    count: visibleProjects.filter((project) => project.status === status).length,
  }));
  const recentProjects = visibleProjects.slice(0, 4);
  return (
    <DashboardLayout roleBase="/dashboard/admin" contentClassName="max-w-[1600px] lg:px-10 xl:px-12">
      <div className="space-y-10 pb-8">
        <AdminPageHeader
          icon={ShieldCheck}
          title={t("admin.dashboardTitle")}
          description={t("admin.dashboardDescription")}
        />

        <section aria-label={t("admin.platformOverview")}>
          {projectsQuery.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)}</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label={t("admin.totalProjects")} value={String(visibleProjects.length)} context={t("admin.verifiedContext", { rate: verificationRate })} icon={FolderOpen} tone="primary" />
              <KpiCard label={t("admin.awaitingReview")} value={String(pendingProjects.length)} context={t(pendingProjects.length ? "admin.needsDecision" : "admin.reviewQueueClear")} icon={ClipboardCheck} tone="warning" />
              <KpiCard label={t("admin.liveProjects")} value={String(activeCount)} context={t("admin.livePortfolioContext", { count: visibleProjects.length })} icon={CheckCircle2} tone="success" />
              <KpiCard label={t("admin.fundingRaised")} value={formatCurrency(totalFunded)} context={t("admin.confirmedAcrossProjects")} icon={CircleDollarSign} tone="secondary" />
            </div>
          )}
        </section>

        {projectsQuery.isError ? (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">{t("admin.overviewError")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.connectionRetry")}</p>
            <Button variant="outline" className="mt-5" onClick={() => void projectsQuery.refetch()}><RefreshCw className="h-4 w-4" />{t("admin.tryAgain")}</Button>
          </section>
        ) : (
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
            <section className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-4 border-b border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
                <div>
                  <div className="flex items-center gap-2.5"><ClipboardCheck className="h-5 w-5 text-warning" /><h2 className="text-xl font-semibold tracking-tight">{t("admin.needsAttention")}</h2></div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t("admin.actionQueueDescription")}</p>
                </div>
                <Button variant="outline" size="sm" asChild><Link to="/dashboard/admin/projects#review-queue">{t("admin.openReviewQueue")}<ArrowRight className="h-4 w-4 rtl-flip" /></Link></Button>
              </div>

              {projectsQuery.isLoading ? <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>
              : pendingProjects.length ? <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[680px] text-start text-sm">
                    <thead className="bg-muted/30 text-xs font-medium text-muted-foreground"><tr><th className="px-6 py-3.5 text-start">{t("admin.projectSubmission")}</th><th className="px-4 py-3.5 text-start">{t("admin.entrepreneur")}</th><th className="px-4 py-3.5 text-start">{t("admin.requestType")}</th><th className="px-4 py-3.5 text-start">{t("admin.submissionDate")}</th><th className="px-6 py-3.5 text-end">{t("admin.actions")}</th></tr></thead>
                    <tbody className="divide-y divide-border/50">{pendingProjects.slice(0, 6).map(({ project, isEdit, submittedAt }) => <tr key={`${project.id}-${isEdit}`} className="transition-colors duration-200 hover:bg-muted/20">
                      <td className="px-6 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/8">{project.cover_image ? <img src={project.cover_image} alt="" className="h-full w-full object-cover" /> : <FolderOpen className="h-4 w-4 text-primary/60" />}</div><p className="max-w-56 truncate font-medium text-foreground">{project.title}</p></div></td>
                      <td className="max-w-48 truncate px-4 py-4 text-muted-foreground">{project.entrepreneur?.full_name || project.entrepreneur?.email || t("admin.unknownOwner")}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${isEdit ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>{t(isEdit ? "admin.pendingEdit" : "admin.newSubmission")}</span></td>
                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatDate(submittedAt, { dateStyle: "medium" }, i18n.language)}</td>
                      <td className="px-6 py-4 text-end"><Button variant="ghost" size="sm" asChild><Link to="/dashboard/admin/projects#review-queue">{t("admin.reviewSubmission")}<ArrowRight className="h-3.5 w-3.5 rtl-flip" /></Link></Button></td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <div className="divide-y divide-border/50 md:hidden">{pendingProjects.slice(0, 6).map(({ project, isEdit, submittedAt }) => <article key={`${project.id}-${isEdit}`} className="space-y-4 p-6">
                  <div className="flex min-w-0 items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/8">{project.cover_image ? <img src={project.cover_image} alt="" className="h-full w-full object-cover" /> : <FolderOpen className="h-4 w-4 text-primary/60" />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{project.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{project.entrepreneur?.full_name || project.entrepreneur?.email || t("admin.unknownOwner")}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${isEdit ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>{t(isEdit ? "admin.pendingEdit" : "admin.newSubmission")}</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{formatDate(submittedAt, { dateStyle: "medium" }, i18n.language)}</span><Button variant="outline" size="sm" asChild><Link to="/dashboard/admin/projects#review-queue">{t("admin.reviewSubmission")}<ArrowRight className="h-3.5 w-3.5 rtl-flip" /></Link></Button></div>
                </article>)}</div>
              </> : <div className="flex items-center gap-4 p-7"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><CheckCircle2 className="h-5 w-5" /></span><div><h3 className="font-semibold">{t("admin.allCaughtUp")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("admin.noSubmissions")}</p></div></div>}
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm backdrop-blur-sm lg:p-7">
                <div className="flex items-center gap-2.5"><Gauge className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">{t("admin.platformHealth")}</h2></div>
                <div className="mt-6 space-y-6">
                  <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{t("admin.verificationRate")}</span><strong className="tabular-nums">{verificationRate}%</strong></div><Progress value={verificationRate} className="h-1.5" /><p className="mt-2 text-xs text-muted-foreground">{t("admin.verifiedProjectsCount", { verified: verifiedCount, total: visibleProjects.length })}</p></div>
                  <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{t("admin.categoryCoverage")}</span><strong className="tabular-nums">{categoryCoverage}%</strong></div><Progress value={categoryCoverage} className="h-1.5" /><p className="mt-2 text-xs text-muted-foreground">{t("admin.categoryUsageCount", { used: usedCategoryIds.size, total: categories.length })}</p></div>
                </div>
                <div className="mt-7 border-t border-border/50 pt-5"><div className="mb-3 flex items-center gap-2"><Layers3 className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">{t("admin.portfolioBreakdown")}</h3></div><div className="grid grid-cols-2 gap-2">{statusBreakdown.map(({ status, count }) => <div key={status} className="rounded-xl bg-muted/35 p-3"><p className="truncate text-xs text-muted-foreground">{t(`status.${status}`)}</p><p className="mt-1 text-lg font-semibold tabular-nums">{count}</p></div>)}</div></div>
              </section>
            </aside>
          </div>
        )}

        {!projectsQuery.isError && <section className="rounded-2xl border border-border/50 bg-card/70 p-6 shadow-sm backdrop-blur-sm lg:p-7">
          <div className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5 text-muted-foreground" /><div><h2 className="text-lg font-semibold">{t("admin.recentActivity")}</h2><p className="mt-0.5 text-sm text-muted-foreground">{t("admin.recentActivityDescription")}</p></div></div>
          {recentProjects.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{recentProjects.map((project) => <Link key={project.id} to="/dashboard/admin/projects" className="group min-w-0 rounded-xl border border-border/40 bg-background/60 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-card hover:shadow-sm"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-medium">{project.title}</p><span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t(`status.${project.status}`)}</span></div><p className="mt-3 truncate text-xs text-muted-foreground">{project.entrepreneur?.full_name || project.entrepreneur?.email || t("admin.unknownOwner")}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(project.created_at, { dateStyle: "medium" }, i18n.language)}</p></Link>)}</div> : <p className="mt-5 text-sm text-muted-foreground">{t("admin.noRecentActivity")}</p>}
        </section>}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
