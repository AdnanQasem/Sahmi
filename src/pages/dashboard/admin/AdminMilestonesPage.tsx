import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatCurrency as formatLocaleCurrency, formatDate, formatNumber } from "@/i18n/format";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Flag, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../DashboardLayout";
import AdminDeleteDialog from "@/components/admin/AdminDeleteDialog";
import AdminMilestoneDialog from "@/components/admin/AdminMilestoneDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusBadge from "@/components/dashboard/StatusBadge";
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
  type AdminMilestone,
  type AdminMilestonePayload,
} from "@/services/adminFinanceService";

const PAGE_SIZE = 12;

const currency = (value: string | number) => formatLocaleCurrency(Number(value) || 0);

const date = (value: string) => formatDate(value + (value.length === 10 ? "T00:00:00" : ""), { dateStyle: "medium" });

const projectName = (milestone: AdminMilestone) =>
  milestone.project_detail?.title || milestone.project_title || i18n.t("admin.unknownProject");

const AdminMilestonesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [project, setProject] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMilestone | null>(null);
  const [deleting, setDeleting] = useState<AdminMilestone | null>(null);

  const milestonesQuery = useQuery({
    queryKey: ["admin", "milestones", page, search, status, project],
    queryFn: () =>
      adminFinanceService.listMilestones({
        page,
        page_size: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        project: project === "all" ? undefined : project,
        ordering: "project,order",
      }),
  });

  const projectsQuery = useQuery({
    queryKey: ["admin", "project-options"],
    queryFn: adminFinanceService.listProjectOptions,
    staleTime: 60_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "milestones"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      milestone,
      payload,
    }: {
      milestone: AdminMilestone | null;
      payload: AdminMilestonePayload;
    }) =>
      milestone
        ? adminFinanceService.updateMilestone(milestone.id, payload)
        : adminFinanceService.createMilestone(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.milestone ? "admin.updated" : "admin.created", { item: t("admin.milestoneItem") }));
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.milestoneItem") }))),
  });

  const deleteMutation = useMutation({
    mutationFn: (milestone: AdminMilestone) =>
      adminFinanceService.deleteMilestone(milestone.id),
    onSuccess: (_, milestone) => {
      toast.success(t("admin.deleted", { item: milestone.title }));
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.deleteFailed", { item: t("admin.milestoneItem") }))),
  });

  const openEdit = (milestone: AdminMilestone) => {
    setEditing(milestone);
    setDialogOpen(true);
  };

  const data = milestonesQuery.data;
  const records = data?.results || [];

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={Flag}
          title={t("admin.milestonesTitle")}
          description={t("admin.milestonesText")}
        />

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-foreground">{t("admin.deliverySchedule")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? t("admin.milestoneRecords", { count: data.count }) : t("admin.loadingMilestones")}
              </p>
            </div>
            <div className="mt-5 grid gap-2 rounded-2xl border border-border/60 bg-muted/25 p-2 sm:grid-cols-[minmax(14rem,1fr)_12rem_minmax(12rem,0.8fr)]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t("admin.searchMilestonesLabel")}
                  className="border-0 bg-background ps-9 shadow-sm"
                  placeholder={t("admin.searchMilestones")}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="border-0 bg-background shadow-sm" aria-label={t("admin.filterMilestoneStatus")}><SelectValue placeholder={t("admin.status")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                  <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  <SelectItem value="delayed">{t("status.delayed")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={project}
                onValueChange={(value) => {
                  setProject(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="border-0 bg-background shadow-sm" aria-label={t("admin.filterMilestoneProject")}><SelectValue placeholder={t("dashboard.project")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allProjects")}</SelectItem>
                  {(projectsQuery.data || []).map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {milestonesQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : milestonesQuery.isError ? (
            <div className="p-10 text-center">
              <p className="font-medium text-destructive">{t("admin.milestonesLoadError")}</p>
              <Button className="mt-4" variant="outline" onClick={() => void milestonesQuery.refetch()}>{t("admin.tryAgain")}</Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <Flag className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">{t("admin.noMilestones")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.adjustOrMilestone")}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/25">
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead>{t("admin.milestoneProject")}</TableHead>
                      <TableHead>{t("admin.progress")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("admin.target")}</TableHead>
                      <TableHead>{t("admin.fundingReleased")}</TableHead>
                      <TableHead className="w-24 text-right">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((milestone) => (
                      <TableRow key={milestone.id} className="h-20 border-border/50">
                        <TableCell className="py-4">
                          <p className="max-w-64 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{projectName(milestone)}</p>
                          <p className="mt-1 font-semibold text-foreground">{milestone.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{t("admin.order")} <bdi dir="ltr">#{milestone.order}</bdi></p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            <bdi dir="ltr">{formatNumber(milestone.percentage_of_project)}%</bdi>
                          </p>
                          <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Number(milestone.percentage_of_project), 100)}%` }} /></div>
                        </TableCell>
                        <TableCell><StatusBadge status={milestone.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{date(milestone.target_date)}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {currency(milestone.funding_released)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(milestone)}>
                              <Edit3 className="h-4 w-4" />
                              <span className="sr-only">{t("admin.editMilestone")}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleting(milestone)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t("admin.deleteMilestone")}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {records.map((milestone) => (
                  <article key={milestone.id} className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{milestone.title}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{projectName(milestone)}</p>
                      </div>
                      <StatusBadge status={milestone.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("admin.target")}</p>
                        <p className="mt-1 font-medium text-foreground">{date(milestone.target_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("admin.projectShare")}</p>
                        <p className="mt-1 font-semibold text-foreground">
                          <bdi dir="ltr">{formatNumber(milestone.percentage_of_project)}%</bdi>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {t("admin.releasedAmount", { amount: currency(milestone.funding_released) })}
                      </p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(milestone)}>
                          <Edit3 className="h-4 w-4" />{t("common.edit")}</Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleting(milestone)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("admin.deleteMilestone")}</span>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <AdminPagination
                page={page}
                count={data?.count || 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </div>

      <AdminMilestoneDialog
        open={dialogOpen}
        milestone={editing}
        projects={projectsQuery.data || []}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={(payload) => saveMutation.mutate({ milestone: editing, payload })}
      />

      <AdminDeleteDialog
        open={!!deleting}
        title={t("admin.deleteMilestoneQuestion")}
        description={t("admin.deleteMilestoneText")}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminMilestonesPage;
