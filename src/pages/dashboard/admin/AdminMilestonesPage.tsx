import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Flag, Plus, Search, Trash2 } from "lucide-react";
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

const currency = (value: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value + (value.length === 10 ? "T00:00:00" : "")),
  );

const projectName = (milestone: AdminMilestone) =>
  milestone.project_detail?.title || milestone.project_title || "Unknown project";

const AdminMilestonesPage = () => {
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
      toast.success(variables.milestone ? "Milestone updated." : "Milestone created.");
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save this milestone.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (milestone: AdminMilestone) =>
      adminFinanceService.deleteMilestone(milestone.id),
    onSuccess: (_, milestone) => {
      toast.success(milestone.title + " was deleted.");
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete this milestone.")),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

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
          title="Project milestones"
          description="Control delivery schedules, progress states, project percentages, and the funding released at every stage."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New milestone
            </Button>
          }
        />

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Delivery schedule</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? data.count.toLocaleString() + " milestones" : "Loading milestones..."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[42rem]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search milestones"
                  className="pl-9"
                  placeholder="Search milestones"
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
                <SelectTrigger aria-label="Filter milestones by status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={project}
                onValueChange={(value) => {
                  setProject(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter milestones by project"><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
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
              <p className="font-medium text-destructive">Milestones could not be loaded.</p>
              <Button className="mt-4" variant="outline" onClick={() => void milestonesQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <Flag className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">No milestones found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adjust the filters or add a delivery target.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone / project</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Funding released</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell>
                          <p className="font-semibold text-foreground">{milestone.title}</p>
                          <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">
                            {projectName(milestone)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            {Number(milestone.percentage_of_project).toLocaleString()}%
                          </p>
                          <p className="text-xs text-muted-foreground">Order {milestone.order}</p>
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
                              <span className="sr-only">Edit milestone</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleting(milestone)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete milestone</span>
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
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="mt-1 font-medium text-foreground">{date(milestone.target_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Project share</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {Number(milestone.percentage_of_project).toLocaleString()}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {currency(milestone.funding_released)} released
                      </p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(milestone)}>
                          <Edit3 className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleting(milestone)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete milestone</span>
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
        title="Delete this milestone?"
        description="This permanently removes the delivery target and its recorded progress. This cannot be undone."
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminMilestonesPage;
