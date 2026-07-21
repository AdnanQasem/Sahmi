import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProjectReviewDialog from "@/components/admin/AdminProjectReviewDialog";
import AdminProjectListItem from "@/components/admin/AdminProjectListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import projectsService, {
  type Project,
  type ProjectModerationPayload,
} from "@/services/projectsService";
import adminProjectsService from "@/services/adminProjectsService";
import { getErrorMessage } from "@/services/api";

type StatusFilter = "all" | Project["status"];
type VerificationFilter = "all" | "verified" | "pending";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const AdminProjectsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reviewProject, setReviewProject] = useState<Project | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => adminProjectsService.listProjects({ page_size: 100, ordering: "-created_at" }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: projectsService.listCategories,
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

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.title.toLocaleLowerCase().includes(query) ||
        project.short_description.toLocaleLowerCase().includes(query) ||
        project.location.toLocaleLowerCase().includes(query) ||
        project.entrepreneur?.full_name?.toLocaleLowerCase().includes(query) ||
        project.entrepreneur?.email?.toLocaleLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" ? project.is_verified : !project.is_verified);
      const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesVerification && matchesCategory;
    });
  }, [categoryFilter, projects, search, statusFilter, verificationFilter]);

  const hasFilters =
    !!search || statusFilter !== "all" || verificationFilter !== "all" || categoryFilter !== "all";

  const refreshAdminData = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    void queryClient.invalidateQueries({ queryKey: ["project-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ project, notes }: { project: Project; notes: string }) =>
      adminProjectsService.verifyProject(project.id, notes),
    onSuccess: (_, variables) => {
      toast.success(variables.project.title + " is now live.");
      setReviewProject(null);
      setReviewNotes("");
      refreshAdminData();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not approve this project.")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ project, notes }: { project: Project; notes: string }) =>
      adminProjectsService.rejectProject(project.id, notes),
    onSuccess: (_, variables) => {
      toast.success(variables.project.title + " was returned to the project owner.");
      setReviewProject(null);
      setReviewNotes("");
      refreshAdminData();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not reject this project.")),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      project,
      status,
    }: {
      project: Project;
      status: ProjectModerationPayload["status"];
    }) =>
      adminProjectsService.setProjectStatus(project.id, {
        status,
      }),
    onSuccess: (_, variables) => {
      toast.success(variables.project.title + " is now " + variables.status + ".");
      refreshAdminData();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update project status.")),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (project: Project) => adminProjectsService.deleteProject(project.id),
    onSuccess: (_, project) => {
      toast.success(project.title + " was deleted.");
      setProjectToDelete(null);
      refreshAdminData();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete this project.")),
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setVerificationFilter("all");
    setCategoryFilter("all");
  };

  const openReview = (project: Project) => {
    setReviewNotes("");
    setReviewProject(project);
  };

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={FolderOpen}
          eyebrow="Project administration"
          title="Projects and reviews"
          description="Review submissions, update campaign status, edit project details, or remove projects from one focused workspace."
          actions={
            <>
              <Button
                variant="outline"
                className="bg-card/80"
                onClick={() => {
                  void projectsQuery.refetch();
                  void categoriesQuery.refetch();
                }}
                disabled={projectsQuery.isFetching || categoriesQuery.isFetching}
              >
                <RefreshCw
                  className={
                    "h-4 w-4 " +
                    (projectsQuery.isFetching || categoriesQuery.isFetching ? "animate-spin" : "")
                  }
                />
                Refresh
              </Button>
              <Button asChild>
                <Link to="/dashboard/admin/projects/new">
                  <Plus className="h-4 w-4" />
                  Add project
                </Link>
              </Button>
            </>
          }
        />

        {projectsQuery.isError ? (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Projects could not be loaded</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the backend connection and try loading the workspace again.
            </p>
            <Button variant="outline" className="mt-5" onClick={() => void projectsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </section>
        ) : (
          <>
            <section id="review-queue" className="scroll-mt-24">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">Review queue</h2>
                    {pendingProjects.length > 0 && (
                      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning">
                        {pendingProjects.length}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New submissions waiting for verification and publication.
                  </p>
                </div>
              </div>

              {projectsQuery.isLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Skeleton className="h-44 rounded-2xl" />
                  <Skeleton className="h-44 rounded-2xl" />
                </div>
              ) : pendingProjects.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pendingProjects.map((project, index) => (
                    <motion.article
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="overflow-hidden rounded-2xl border border-warning/20 bg-card shadow-sm"
                    >
                      <div className="flex h-full flex-col sm:flex-row">
                        <div className="h-36 bg-gradient-to-br from-primary/15 to-secondary/15 sm:h-auto sm:w-40 sm:shrink-0">
                          {project.cover_image ? (
                            <img src={project.cover_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full min-h-32 items-center justify-center">
                              <ClipboardCheck className="h-9 w-9 text-primary/35" />
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <StatusBadge status="pending_review" />
                              <h3 className="mt-2 line-clamp-1 font-semibold text-foreground">{project.title}</h3>
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {new Date(project.created_at).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {project.short_description}
                          </p>
                          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground">
                                {project.entrepreneur?.full_name ||
                                  project.entrepreneur?.email ||
                                  "Unknown owner"}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {project.category_detail?.name || "Uncategorized"} ·{" "}
                                {formatCurrency(Number(project.goal_amount))}
                              </p>
                            </div>
                            <Button size="sm" onClick={() => openReview(project)}>
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-2xl border border-success/20 bg-success/5 p-6 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">All caught up</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      There are no new project submissions waiting for review.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section id="projects-section" className="scroll-mt-24">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Project management</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Search, edit, moderate, or remove any project on the platform.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <div className="relative min-w-0 sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search projects or owners"
                          className="pl-9"
                          aria-label="Search projects or owners"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                        <SelectTrigger className="sm:w-36" aria-label="Filter by project status">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="successful">Successful</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={verificationFilter}
                        onValueChange={(value) => setVerificationFilter(value as VerificationFilter)}
                      >
                        <SelectTrigger className="sm:w-36" aria-label="Filter by verification">
                          <SelectValue placeholder="Verification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All reviews</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="sm:w-40" aria-label="Filter by category">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-b border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span>
                    Showing <strong className="text-foreground">{filteredProjects.length}</strong> of{" "}
                    <strong className="text-foreground">{projects.length}</strong> projects
                  </span>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-fit cursor-pointer font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  {projectsQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-36 rounded-2xl" />
                    ))
                  ) : filteredProjects.length ? (
                    filteredProjects.map((project) => (
                      <AdminProjectListItem
                        key={project.id}
                        project={project}
                        isBusy={
                          (statusMutation.isPending && statusMutation.variables?.project.id === project.id) ||
                          (deleteProjectMutation.isPending && deleteProjectMutation.variables?.id === project.id)
                        }
                        onReview={openReview}
                        onStatusChange={(selectedProject, status) =>
                          statusMutation.mutate({ project: selectedProject, status })
                        }
                        onDelete={setProjectToDelete}
                      />
                    ))
                  ) : (
                    <div className="py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Search className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-semibold text-foreground">
                        {projects.length ? "No projects match these filters" : "No projects yet"}
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        {projects.length
                          ? "Try a different search or reset the filters to see the full catalogue."
                          : "New project submissions will appear here as soon as they are created."}
                      </p>
                      {hasFilters && (
                        <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <AdminProjectReviewDialog
              project={reviewProject}
              notes={reviewNotes}
              onNotesChange={setReviewNotes}
              onOpenChange={(open) => {
                if (!open && !approveMutation.isPending && !rejectMutation.isPending) {
                  setReviewProject(null);
                  setReviewNotes("");
                }
              }}
              onApprove={() => {
                if (reviewProject) {
                  approveMutation.mutate({ project: reviewProject, notes: reviewNotes.trim() });
                }
              }}
              onReject={() => {
                if (reviewProject && reviewNotes.trim()) {
                  rejectMutation.mutate({ project: reviewProject, notes: reviewNotes.trim() });
                }
              }}
              isPending={approveMutation.isPending || rejectMutation.isPending}
            />

            <AlertDialog
              open={!!projectToDelete}
              onOpenChange={(open) => {
                if (!open && !deleteProjectMutation.isPending) setProjectToDelete(null);
              }}
            >
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong className="font-semibold text-foreground">{projectToDelete?.title}</strong> will be
                    permanently removed from Sahmi together with its linked investments, milestones, files,
                    and repayment records. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteProjectMutation.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteProjectMutation.isPending}
                    onClick={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete)}
                  >
                    {deleteProjectMutation.isPending ? "Deleting..." : "Delete project"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminProjectsPage;
