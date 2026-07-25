import { useTranslation } from "react-i18next";
import { formatCurrency as formatLocaleCurrency } from "@/i18n/format";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Flag,
  FolderOpen,
  HandCoins,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import adminProjectsService from "@/services/adminProjectsService";

const formatCurrency = (value: number) => formatLocaleCurrency(value);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => adminProjectsService.listProjects({ page_size: 100, ordering: "-created_at" }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: adminProjectsService.listCategories,
    staleTime: 60_000,
  });

  const projects = useMemo(() => projectsQuery.data?.results || [], [projectsQuery.data?.results]);
  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  const pendingProjects = useMemo(
    () =>
      projects.filter(
        (project) => !project.deleted_at && !project.is_verified && project.status === "draft",
      ),
    [projects],
  );
  const totalFunded = useMemo(
    () => projects.reduce((total, project) => total + (Number(project.funded_amount) || 0), 0),
    [projects],
  );
  const activeCount = projects.filter(
    (project) => !project.deleted_at && project.status === "active",
  ).length;
  const isRefreshing = projectsQuery.isFetching || categoriesQuery.isFetching;

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={ShieldCheck}
          title={t("admin.dashboardTitle")}
          description={t("admin.dashboardDescription")}
          actions={
            <>
              <Button
                variant="outline"
                className="bg-card/80"
                onClick={() => {
                  void projectsQuery.refetch();
                  void categoriesQuery.refetch();
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={"h-4 w-4 " + (isRefreshing ? "animate-spin" : "")} />{t("admin.refresh")}</Button>
              <Button asChild>
                <Link to="/dashboard/admin/projects/new">
                  <Plus className="h-4 w-4" />{t("admin.addProject")}</Link>
              </Button>
            </>
          }
        />

        <section aria-label={t("admin.platformOverview")}>
          {projectsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Projects"
                value={String(projects.length)}
                subtext="Across every campaign status"
                icon={FolderOpen}
                iconBgClass="bg-primary/10"
                iconColorClass="text-primary"
                index={0}
              />
              <StatCard
                label="Awaiting Review"
                value={String(pendingProjects.length)}
                subtext={pendingProjects.length ? "Needs an admin decision" : "Review queue is clear"}
                icon={ClipboardCheck}
                iconBgClass="bg-warning/10"
                iconColorClass="text-warning"
                index={1}
              />
              <StatCard
                label="Live Projects"
                value={String(activeCount)}
                subtext="Visible to the Sahmi community"
                icon={CheckCircle2}
                iconBgClass="bg-success/10"
                iconColorClass="text-success"
                index={2}
              />
              <StatCard
                label="Funding Raised"
                value={formatCurrency(totalFunded)}
                subtext="Confirmed across all projects"
                icon={CircleDollarSign}
                iconBgClass="bg-secondary/10"
                iconColorClass="text-secondary"
                index={3}
              />
            </div>
          )}
        </section>

        {projectsQuery.isError ? (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">{t("admin.overviewError")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.connectionRetry")}</p>
            <Button variant="outline" className="mt-5" onClick={() => void projectsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />{t("admin.tryAgain")}</Button>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-warning" />
                    <h2 className="text-xl font-bold text-foreground">{t("admin.needsAttention")}</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t("admin.reviewQueueText")}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/admin/projects#review-queue">{t("admin.openReviewQueue")}<ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {projectsQuery.isLoading ? (
                <div className="space-y-3 p-5 sm:p-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : pendingProjects.length ? (
                <div className="divide-y divide-border">
                  {pendingProjects.slice(0, 4).map((project) => (
                    <Link
                      key={project.id}
                      to="/dashboard/admin/projects#review-queue"
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15">
                        {project.cover_image ? (
                          <img src={project.cover_image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <FolderOpen className="h-5 w-5 text-primary/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {project.entrepreneur?.full_name || project.entrepreneur?.email || "Unknown owner"}
                        </p>
                      </div>
                      <span className="hidden shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning sm:inline-flex">{t("admin.review")}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("admin.allCaughtUp")}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("admin.noSubmissions")}</p>
                  </div>
                </div>
              )}
            </section>

            <section aria-labelledby="management-heading">
              <div className="mb-4">
                <h2 id="management-heading" className="text-xl font-bold text-foreground">{t("admin.management")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("admin.chooseWorkspace")}</p>
              </div>
              <div className="space-y-3">
                <Link
                  to="/dashboard/admin/users"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{t("admin.usersRoles")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("admin.manageUsersText")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
                <Link
                  to="/dashboard/admin/projects"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{t("admin.projects")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Review and manage {projects.length} {projects.length === 1 ? "project" : "projects"}.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
                <Link
                  to="/dashboard/admin/categories"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Tags className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{t("admin.categories")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Organize {categories.length} {categories.length === 1 ? "category" : "categories"}.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
                <Link
                  to="/dashboard/admin/investments"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <CircleDollarSign className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{t("admin.investments")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("admin.investmentsText")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
                <Link
                  to="/dashboard/admin/milestones"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{t("admin.milestones")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("admin.milestonesManageText")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
                <Link
                  to="/dashboard/admin/repayments"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <HandCoins className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{t("admin.repayments")}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("admin.repaymentsManageText")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
