import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  HandCoins,
  Layers,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Send,
  Sparkles,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DashboardLayout from "./DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/i18n/format";
import { getErrorMessage } from "@/services/api";
import { calculateFundingSummary } from "@/lib/funding";
import adminProjectsService from "@/services/adminProjectsService";
import fundsService, { type WithdrawalPayload, type WithdrawalRequest } from "@/services/fundsService";
import projectsService, { type ProjectMilestone } from "@/services/projectsService";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { formDemoData } from "@/demo/formDemoData";
import { loadDemoProjectImage } from "@/demo/demoFiles";
import DemoFilePreview from "@/components/demo/DemoFilePreview";

const FundsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = Boolean(user?.is_staff || user?.user_type === "admin");
  const roleBase = isAdmin ? "/dashboard/admin" : "/dashboard/entrepreneur";
  const [projectId, setProjectId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeReviewRequest, setActiveReviewRequest] = useState<WithdrawalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [completionDialog, setCompletionDialog] = useState<ProjectMilestone | null>(null);
  const [completionSummary, setCompletionSummary] = useState("");
  const [completionEvidence, setCompletionEvidence] = useState<File | null>(null);
  const [activeCompletionReview, setActiveCompletionReview] = useState<ProjectMilestone | null>(null);
  const [completionReviewNotes, setCompletionReviewNotes] = useState("");
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [form, setForm] = useState<WithdrawalPayload>({ milestone: "", amount: "", evidence_description: "", planned_expenses: "", evidence_file: null });

  const projectsQuery = useQuery({
    queryKey: ["funds-projects", isAdmin],
    queryFn: () => isAdmin ? adminProjectsService.listProjects({ page_size: 100 }) : projectsService.listMyProjects(),
  });
  const withdrawalsQuery = useQuery({ queryKey: ["withdrawals"], queryFn: () => fundsService.list() });
  const projects = useMemo(() => projectsQuery.data?.results ?? [], [projectsQuery.data?.results]);
  const eligibleProjects = projects.filter((project) => project.status === "implementation");
  const selectedProject = eligibleProjects.find((project) => project.id === projectId) ?? eligibleProjects[0];
  const currentMilestone = selectedProject?.milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((milestone) => milestone.status !== "completed");
  const totals = useMemo(() => calculateFundingSummary(projects), [projects]);
  const selectedMilestones = selectedProject?.milestones.slice().sort((a, b) => a.order - b.order) ?? [];
  const selectedFundedAmount = Number(selectedProject?.funded_amount || 0);
  const visibleRequests = (withdrawalsQuery.data?.results ?? []).filter(
    (request) => statusFilter === "all" || request.status === statusFilter,
  );
  const pendingWithdrawalReviews = (withdrawalsQuery.data?.results ?? []).filter((request) =>
    ["requested", "under_review", "approved"].includes(request.status),
  );
  const pendingCompletionReviews = eligibleProjects.flatMap((project) =>
    project.milestones
      .filter((milestone) => ["submitted", "under_review"].includes(milestone.completion_status ?? ""))
      .map((milestone) => ({ project, milestone })),
  );
  const pendingReviewCount = pendingWithdrawalReviews.length + pendingCompletionReviews.length;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] }),
      queryClient.invalidateQueries({ queryKey: ["funds-projects"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "entrepreneur", "projects"] }),
    ]);
  };
  const create = useMutation({
    mutationFn: fundsService.create,
    onSuccess: async () => { setForm({ milestone: "", amount: "", evidence_description: "", planned_expenses: "", evidence_file: null }); await refresh(); toast.success(t("funds.requestSubmitted")); },
    onError: (error) => toast.error(getErrorMessage(error, t("funds.actionFailed"))),
  });
  const finalize = useMutation({
    mutationFn: adminProjectsService.finalizeFunding,
    onSuccess: async () => { await refresh(); toast.success(t("funds.finalized")); },
    onError: (error) => toast.error(getErrorMessage(error, t("funds.actionFailed"))),
  });
  const finalizeCompletion = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => adminProjectsService.finalizeCompletion(id, notes),
    onSuccess: async () => {
      setHandoverDialogOpen(false);
      setHandoverNotes("");
      await refresh();
      toast.success(t("funds.handoverApproved"));
    },
    onError: (error) => toast.error(getErrorMessage(error, t("funds.actionFailed"))),
  });
  const action = useMutation({
    mutationFn: async ({ type, request, notes = "" }: { type: string; request: WithdrawalRequest; notes?: string }) => {
      if (type === "review") return fundsService.review(request.id);
      if (type === "approve") return fundsService.approve(request.id, notes);
      if (type === "release") return fundsService.release(request.id);
      if (type === "cancel") return fundsService.cancel(request.id);
      return type === "reject" ? fundsService.reject(request.id, notes) : fundsService.requestRevision(request.id, notes);
    },
    onSuccess: async (result, variables) => {
      if (variables.type === "review") {
        setActiveReviewRequest(result);
        setReviewNotes(result.review_notes ?? "");
      } else if (activeReviewRequest?.id === result.id) {
        setActiveReviewRequest(null);
        setReviewNotes("");
      }
      await refresh();
      toast.success(t("funds.updated"));
    },
    onError: (error) => toast.error(getErrorMessage(error, error instanceof Error ? error.message : t("funds.actionFailed"))),
  });
  const submitCompletion = useMutation({
    mutationFn: ({ milestone, summary, evidence }: { milestone: ProjectMilestone; summary: string; evidence: File }) =>
      fundsService.submitMilestoneCompletion(milestone.id!, { summary, evidence }),
    onSuccess: async () => {
      setCompletionDialog(null);
      setCompletionSummary("");
      setCompletionEvidence(null);
      await refresh();
      toast.success(t("funds.completionSubmitted"));
    },
    onError: (error) => toast.error(getErrorMessage(error, t("funds.actionFailed"))),
  });
  const completionAction = useMutation({
    mutationFn: async ({ type, milestone, notes = "" }: { type: "review" | "approve" | "reject" | "revision"; milestone: ProjectMilestone; notes?: string }) => {
      if (type === "review") return fundsService.reviewMilestoneCompletion(milestone.id!);
      if (type === "approve") return fundsService.approveMilestoneCompletion(milestone.id!, notes);
      return type === "reject"
        ? fundsService.rejectMilestoneCompletion(milestone.id!, notes)
        : fundsService.requestMilestoneCompletionRevision(milestone.id!, notes);
    },
    onSuccess: async (result, variables) => {
      if (variables.type === "review") {
        setActiveCompletionReview(result);
        setCompletionReviewNotes(result.completion_review_notes ?? "");
      } else {
        setActiveCompletionReview(null);
        setCompletionReviewNotes("");
      }
      await refresh();
      toast.success(t("funds.completionUpdated"));
    },
    onError: (error) => toast.error(getErrorMessage(error, t("funds.actionFailed"))),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProject || !form.milestone) return;
    create.mutate(form);
  };

  const fillReleaseDemo = async () => {
    if (!currentMilestone?.id) return;
    const allocation = selectedFundedAmount * Number(currentMilestone.percentage_of_project || 0) / 100;
    const remaining = Math.max(allocation - Number(currentMilestone.funding_released || 0), 0.01);
    setForm((current) => ({
      ...current,
      milestone: currentMilestone.id!,
      amount: Math.min(500, remaining).toFixed(2),
      evidence_description: formDemoData.release.evidence,
      planned_expenses: formDemoData.release.expenses,
    }));
    const evidenceFile = await loadDemoProjectImage(selectedProject?.title, "milestone-evidence").catch(() => null);
    if (evidenceFile) setForm((current) => ({ ...current, evidence_file: evidenceFile }));
  };

  const fillCompletionDemo = async () => {
    setCompletionSummary(formDemoData.completionSummary);
    const evidenceFile = await loadDemoProjectImage(selectedProject?.title, "completion-evidence").catch(() => null);
    setCompletionEvidence(evidenceFile);
  };

  return <DashboardLayout roleBase={roleBase}>
    <div className="space-y-7">
      <div><h1 className="text-3xl font-bold">{t("funds.title")}</h1><p className="text-muted-foreground">{t("funds.subtitle")}</p></div>
      {isAdmin ? <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3 text-sm font-medium text-muted-foreground"><span>{t("funds.escrowBalance")}</span><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><LockKeyhole className="h-5 w-5"/></span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totals.available)}</p></div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3 text-sm font-medium text-muted-foreground"><span>{t("funds.totalDisbursed")}</span><span className="rounded-xl bg-success/10 p-2.5 text-success"><HandCoins className="h-5 w-5"/></span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totals.released)}</p></div>
        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${pendingReviewCount > 0 ? "border-warning/50 bg-gradient-to-br from-card via-card to-warning/10 ring-2 ring-warning/20 shadow-warning/5" : "border-border/60 bg-card"}`}>
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-muted-foreground">
            <span>{t("funds.pendingRequests")}</span>
            <span className={`rounded-xl p-2.5 ${pendingReviewCount > 0 ? "bg-warning text-warning-foreground font-bold shadow-xs animate-pulse" : "bg-warning/10 text-warning"}`}>
              <Clock className="h-5 w-5"/>
            </span>
          </div>
          <div className="mt-5 flex items-baseline justify-between gap-2">
            <p className="text-3xl font-semibold tracking-tight text-foreground">{pendingReviewCount}</p>
            {pendingReviewCount > 0 && (
              <a href="#admin-review-queue" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                <span>{t("funds.reviewNow", { defaultValue: "Review Queue" })}</span>
                <ArrowDown className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><WalletCards className="h-5 w-5"/>{t("funds.finalizedFunding")}</div><p className="mt-2 text-3xl font-bold text-primary">{formatCurrency(totals.totalFunding)}</p></div>
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><LockKeyhole className="h-5 w-5"/>{t("funds.availableBalance")}</div><p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(totals.available)}</p></div>
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><HandCoins className="h-5 w-5"/>{t("funds.releasedBalance")}</div><p className="mt-2 text-3xl font-bold text-success">{formatCurrency(totals.released)}</p></div>
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><RotateCcw className="h-5 w-5"/>{t("funds.refundedBalance")}</div><p className="mt-2 text-3xl font-bold text-muted-foreground">{formatCurrency(totals.refunded)}</p></div>
      </div>}
      <p className="-mt-4 text-sm text-muted-foreground">{t("funds.balanceEquation", {
        total: formatCurrency(totals.totalFunding),
        available: formatCurrency(totals.available),
        released: formatCurrency(totals.released),
        refunded: formatCurrency(totals.refunded),
      })}</p>

      {isAdmin && <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">{t("funds.awaitingFinalization")}</h2><div className="mt-4 space-y-3">{projects.filter((project) => project.status === "fully_funded").map((project) => <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold">{project.title}</p><p className="text-sm text-muted-foreground">{formatCurrency(Number(project.funded_amount))} / {formatCurrency(Number(project.goal_amount))}</p></div><Button disabled={finalize.isPending} onClick={() => finalize.mutate(project.id)}>{finalize.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="me-2 h-4 w-4"/>}{t("funds.finalize")}</Button></div>)}{!projects.some((project) => project.status === "fully_funded") && <p className="py-4 text-sm text-muted-foreground">{t("funds.noneAwaiting")}</p>}</div></section>}

      {isAdmin && pendingReviewCount > 0 && <section
        id="admin-review-queue"
        role="region"
        aria-labelledby="admin-review-queue-title"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-warning/30 bg-card shadow-sm"
      >
        <div className="border-b border-border/70 bg-muted/20 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                  {t("funds.actionRequired")}
                </span>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-warning px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
                  {pendingReviewCount}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <h2 id="admin-review-queue-title" className="text-xl font-semibold tracking-tight text-foreground">
                  {t("funds.adminReviewQueue")}
                </h2>
              </div>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
                {t("funds.adminReviewQueueHelp")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[21rem]">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 font-medium text-foreground shadow-sm">
              <HandCoins className="h-4 w-4 text-primary" />
              <span><bdi className="font-bold">{pendingWithdrawalReviews.length}</bdi> {t("funds.withdrawalApprovals")}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 font-medium text-foreground shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span><bdi className="font-bold">{pendingCompletionReviews.length}</bdi> {t("funds.completionApprovals")}</span>
            </span>
          </div>
          </div>
        </div>

        <div className="grid gap-4 bg-muted/20 p-4 sm:p-6 lg:grid-cols-2">
          <div className="space-y-3.5 rounded-2xl border border-primary/15 bg-card/90 p-3 sm:p-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-primary" />
                <span>{t("funds.withdrawalApprovals")}</span>
              </h3>
              <Badge variant="outline" className="text-[11px] font-semibold">
                {pendingWithdrawalReviews.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {pendingWithdrawalReviews.map((request) => (
                <div
                  key={request.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/80 border-s-4 border-s-primary bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                          {request.project_title}
                        </p>
                        <Badge variant={request.status === "approved" ? "success" : "outline"} className="text-[10px] uppercase font-bold">
                          {t(`funds.status.${request.status}`)}
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="font-medium text-foreground/80">{request.milestone_title}</span>
                      </p>

                      <div className="pt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary border border-primary/20 tabular-nums">
                          {formatCurrency(Number(request.amount))}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(request.created_at, { dateStyle: "medium" }, i18n.language)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <Button
                        size="sm"
                        variant={request.status === "under_review" ? "default" : "outline"}
                        className="w-full sm:w-auto font-semibold shadow-xs gap-1.5"
                        disabled={action.isPending}
                        onClick={() => {
                          if (request.status === "requested") action.mutate({ type: "review", request });
                          else if (request.status === "under_review") {
                            setActiveReviewRequest(request);
                            setReviewNotes(request.review_notes ?? "");
                          } else action.mutate({ type: "release", request });
                        }}
                      >
                        {request.status === "approved" ? (
                          <HandCoins className="me-1 h-4 w-4" />
                        ) : (
                          <Clock className="me-1 h-4 w-4" />
                        )}
                        {t(
                          request.status === "approved"
                            ? "funds.release"
                            : request.status === "under_review"
                            ? "funds.continueReview"
                            : "funds.review",
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingWithdrawalReviews.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/70 mb-2" />
                  <p className="text-sm font-medium text-foreground">{t("funds.noPendingWithdrawals")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3.5 rounded-2xl border border-success/20 bg-card/90 p-3 sm:p-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t("funds.completionApprovals")}</span>
              </h3>
              <Badge variant="outline" className="text-[11px] font-semibold">
                {pendingCompletionReviews.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {pendingCompletionReviews.map(({ project, milestone }) => (
                <div
                  key={milestone.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/80 border-s-4 border-s-success bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-success/40 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                          {project.title}
                        </p>
                        <Badge variant={milestone.completion_status === "under_review" ? "default" : "outline"} className="text-[10px] uppercase font-bold">
                          {t(`funds.completionStatus.${milestone.completion_status ?? "submitted"}`)}
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium text-foreground/80">{milestone.title}</span>
                      </p>

                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {milestone.completion_summary || t("funds.evidenceProvided", { defaultValue: "Deliverables submitted for review" })}
                      </p>
                    </div>

                    <div className="shrink-0 pt-1">
                      <Button
                        size="sm"
                        variant={milestone.completion_status === "under_review" ? "default" : "outline"}
                        className="w-full sm:w-auto font-semibold shadow-xs gap-1.5"
                        disabled={completionAction.isPending}
                        onClick={() => {
                          if (milestone.completion_status === "submitted") {
                            completionAction.mutate({ type: "review", milestone });
                          } else {
                            setActiveCompletionReview(milestone);
                            setCompletionReviewNotes(milestone.completion_review_notes ?? "");
                          }
                        }}
                      >
                        <Clock className="me-1 h-4 w-4" />
                        {t(
                          milestone.completion_status === "under_review"
                            ? "funds.continueCompletionReview"
                            : "funds.reviewCompletion",
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingCompletionReviews.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/70 mb-2" />
                  <p className="text-sm font-medium text-foreground">{t("funds.noPendingCompletions")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>}

      {eligibleProjects.length > 0 && <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-semibold">{t("funds.milestoneAllocations")}</h2><p className="text-sm text-muted-foreground">{t("funds.milestoneAllocationsHelp")}</p></div>
          <label className="min-w-56 space-y-1 text-sm"><span>{t("funds.project")}</span><Select value={selectedProject?.id} onValueChange={(value) => { setProjectId(value); setForm({ ...form, milestone: "" }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eligibleProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select></label>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {selectedMilestones.map((milestone, index) => {
            const allocation = selectedFundedAmount * Number(milestone.percentage_of_project || 0) / 100;
            const released = Number(milestone.funding_released || 0);
            const locked = selectedMilestones.slice(0, index).some((item) => item.status !== "completed");
            const completionStatus = milestone.completion_status ?? "not_submitted";
            const canSubmitCompletion = !isAdmin && !locked && milestone.status !== "completed" && released >= allocation
              && ["not_submitted", "revision_required", "rejected"].includes(completionStatus);
            return <article key={milestone.id ?? milestone.order} className={`rounded-xl border p-4 ${locked ? "bg-muted/35 opacity-75" : "bg-background"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{t("funds.milestoneNumber", { number: index + 1 })}</p><h3 className="font-semibold">{milestone.title}</h3></div><Badge variant={milestone.status === "completed" ? "success" : "outline"}>{locked ? t("funds.locked") : t(`status.${milestone.status ?? "pending"}`)}</Badge></div>
              <div className="mt-4"><div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{t("funds.escrowReleaseProgress")}</span><span>{Math.min(allocation > 0 ? Math.round((released / allocation) * 100) : 0, 100)}%</span></div><Progress value={allocation > 0 ? Math.min((released / allocation) * 100, 100) : 0} /></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-muted-foreground">{t("funds.allocation")}</p><p className="font-semibold">{formatCurrency(allocation)}</p></div><div><p className="text-xs text-muted-foreground">{t("funds.released")}</p><p className="font-semibold text-success">{formatCurrency(released)}</p></div><div><p className="text-xs text-muted-foreground">{t("funds.remaining")}</p><p className="font-semibold">{formatCurrency(Math.max(allocation - released, 0))}</p></div></div>
              {!locked && released >= allocation && <div className="mt-4 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t("funds.completionEvidence")}</p>
                  <Badge variant={completionStatus === "approved" ? "success" : "outline"}>{t(`funds.completionStatus.${completionStatus}`)}</Badge>
                </div>
                {milestone.completion_summary && <p className="mt-2 text-sm text-muted-foreground">{milestone.completion_summary}</p>}
                {milestone.completion_evidence && <a className="mt-2 inline-block text-sm font-medium text-primary underline" href={milestone.completion_evidence} target="_blank" rel="noreferrer">{t("funds.viewCompletionEvidence")}</a>}
                {milestone.completion_review_notes && <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"><p className="font-semibold">{t("reviewFeedback.adminNote")}</p><p className="mt-1 whitespace-pre-wrap text-foreground">{milestone.completion_review_notes}</p></div>}
                {canSubmitCompletion && <Button className="mt-3" size="sm" onClick={() => { setCompletionDialog(milestone); setCompletionSummary(milestone.completion_summary ?? ""); setCompletionEvidence(null); }}><Send className="me-1 h-4 w-4"/>{t(completionStatus === "not_submitted" ? "funds.submitCompletion" : "funds.resubmitCompletion")}</Button>}
              </div>}
            </article>;
          })}
        </div>
      </section>}

      {selectedProject?.quality_hold_started_at && <section className="rounded-2xl border border-primary/20 bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("funds.qualityHoldTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("funds.qualityHoldText")}</p>
            <p className="mt-3 text-sm font-medium">{t("funds.qualityHoldUntil", { date: formatDate(selectedProject.quality_hold_until!, { dateStyle: "medium", timeStyle: "short" }, i18n.language) })}</p>
          </div>
          {selectedProject.completion_handover_approved_at ? <Badge variant="success">{t("funds.handoverApproved")}</Badge>
          : isAdmin && <Button
              disabled={!selectedProject.quality_hold_until || Date.now() < new Date(selectedProject.quality_hold_until).getTime()}
              onClick={() => setHandoverDialogOpen(true)}
            ><CheckCircle2 className="me-2 h-4 w-4" />{t("funds.approveHandover")}</Button>}
        </div>
      </section>}

      {!isAdmin && <section className="rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{t("funds.requestRelease")}</h2><DemoFillButton onClick={() => void fillReleaseDemo()} disabled={!currentMilestone?.id} /></div>{eligibleProjects.length ? <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="space-y-2 text-sm"><span>{t("funds.project")}</span><Select value={selectedProject?.id} onValueChange={(value) => { setProjectId(value); setForm({...form,milestone:""}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eligibleProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-2 text-sm"><span>{t("funds.milestone")}</span><Select value={form.milestone || undefined} onValueChange={(value) => setForm({...form,milestone:value})}><SelectTrigger><SelectValue placeholder={t("funds.chooseMilestone")} /></SelectTrigger><SelectContent>{currentMilestone?.id && <SelectItem value={currentMilestone.id}>{currentMilestone.title}</SelectItem>}</SelectContent></Select></label>
        <label className="space-y-2 text-sm"><span>{t("common.amount")}</span><Input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})}/></label>
        <label className="space-y-2 text-sm"><span>{t("funds.evidenceFile")}</span><Input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(e) => setForm({...form,evidence_file:e.target.files?.[0] ?? null})}/>{form.evidence_file && <span className="block text-xs font-medium text-primary">{form.evidence_file.name}</span>}<DemoFilePreview file={form.evidence_file} alt={selectedProject?.title || t("funds.evidence")} /></label>
        <label className="space-y-2 text-sm sm:col-span-2"><span>{t("funds.evidence")}</span><textarea required minLength={10} className="min-h-24 w-full rounded-md border bg-background p-3" value={form.evidence_description} onChange={(e) => setForm({...form,evidence_description:e.target.value})}/></label>
        <label className="space-y-2 text-sm sm:col-span-2"><span>{t("funds.plannedExpenses")}</span><textarea required minLength={10} className="min-h-24 w-full rounded-md border bg-background p-3" value={form.planned_expenses} onChange={(e) => setForm({...form,planned_expenses:e.target.value})}/></label>
        <div className="sm:col-span-2"><Button disabled={create.isPending} type="submit">{create.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <Send className="me-2 h-4 w-4"/>}{t("funds.submitRequest")}</Button></div>
      </form> : <p className="mt-4 text-sm text-muted-foreground">{t("funds.noImplementationProjects")}</p>}</section>}

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">{withdrawalsQuery.isLoading ? t("funds.withdrawalHistory") : t("funds.withdrawalHistoryCount", { count: visibleRequests.length })}</h2>
          <label className="min-w-44 space-y-1 text-sm"><span>{t("funds.filterStatus")}</span><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("common.all")}</SelectItem>{["requested","under_review","approved","released","revision_required","rejected","cancelled"].map((status) => <SelectItem key={status} value={status}>{t(`funds.status.${status}`)}</SelectItem>)}</SelectContent></Select></label>
        </div>
        {withdrawalsQuery.isLoading && <Loader2 className="mt-5 h-5 w-5 animate-spin"/>}
        <div className="mt-4 space-y-3">
          {visibleRequests.map((request) => <div key={request.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{request.project_title} · {request.milestone_title}</p><p className="text-sm text-muted-foreground">{formatDate(request.created_at, { dateStyle: "medium" }, i18n.language)} · {formatCurrency(Number(request.amount))}</p></div><Badge variant="outline">{t(`funds.status.${request.status}`)}</Badge></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-medium text-muted-foreground">{t("funds.evidence")}</p><p className="text-sm">{request.evidence_description}</p></div><div><p className="text-xs font-medium text-muted-foreground">{t("funds.purpose")}</p><p className="text-sm">{request.planned_expenses}</p></div></div>
            {request.evidence_file && <a className="mt-3 inline-block text-sm font-medium text-primary underline" href={request.evidence_file} target="_blank" rel="noreferrer">{t("funds.viewEvidence")}</a>}
            {request.review_notes && <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"><p className="font-semibold">{t("reviewFeedback.adminNote")}</p><p className="mt-1 whitespace-pre-wrap text-foreground">{request.review_notes}</p></div>}
            {request.payout_reference && <p className="mt-2 text-xs text-muted-foreground">{t("funds.payoutReference")}: <bdi dir="ltr">{request.payout_reference}</bdi></p>}
            {request.project_status !== "completed" && !isAdmin && ["requested","revision_required"].includes(request.status) && <div className="mt-4"><Button size="sm" variant="outline" onClick={() => action.mutate({type:"cancel",request})}>{t("funds.cancelRequest")}</Button></div>}
          </div>)}
          {!withdrawalsQuery.isLoading && visibleRequests.length === 0 && <p className="py-4 text-sm text-muted-foreground">{t("funds.noRequests")}</p>}
        </div>
      </section>
      <Dialog open={!!activeReviewRequest} onOpenChange={(open) => { if (!open && !action.isPending) { setActiveReviewRequest(null); setReviewNotes(""); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
          {activeReviewRequest && <>
            <div className="border-b bg-muted/35 px-6 py-5 pe-12">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2"><DialogTitle>{t("funds.reviewRequestTitle")}</DialogTitle><Badge variant="outline">{t(`funds.status.${activeReviewRequest.status}`)}</Badge></div>
                <DialogDescription>{t("funds.reviewRequestDescription", { project: activeReviewRequest.project_title })}</DialogDescription>
              </DialogHeader>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">{t("common.amount")}</p><p className="mt-1 text-lg font-bold text-primary">{formatCurrency(Number(activeReviewRequest.amount))}</p></div>
                <div className="rounded-xl border bg-card p-3 sm:col-span-2"><p className="text-xs text-muted-foreground">{t("funds.milestone")}</p><p className="mt-1 font-semibold">{activeReviewRequest.milestone_title}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(activeReviewRequest.created_at, { dateStyle: "medium", timeStyle: "short" }, i18n.language)}</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4"><p className="text-sm font-semibold">{t("funds.evidence")}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{activeReviewRequest.evidence_description}</p></div>
                <div className="rounded-xl border p-4"><p className="text-sm font-semibold">{t("funds.purpose")}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{activeReviewRequest.planned_expenses}</p></div>
              </div>
              {activeReviewRequest.evidence_file && <a className="inline-flex text-sm font-semibold text-primary underline underline-offset-4" href={activeReviewRequest.evidence_file} target="_blank" rel="noreferrer">{t("funds.viewEvidence")}</a>}
              {activeReviewRequest.status === "under_review" && <label className="block space-y-2"><span className="flex items-center justify-between gap-3 text-sm font-semibold">{t("funds.reviewNotes")}<DemoFillButton onClick={() => setReviewNotes(formDemoData.withdrawalReview)} /></span><Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder={t("funds.reviewNotesPlaceholder")} rows={4} /></label>}
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-between sm:space-x-0">
              <Button variant="ghost" disabled={action.isPending} onClick={() => { setActiveReviewRequest(null); setReviewNotes(""); }}>{t("common.close")}</Button>
              <div className="flex flex-wrap justify-end gap-2"><Button variant="destructive" disabled={!reviewNotes.trim() || action.isPending} onClick={() => action.mutate({ type: "reject", request: activeReviewRequest, notes: reviewNotes.trim() })}><XCircle className="me-1 h-4 w-4"/>{t("funds.reject")}</Button><Button variant="outline" disabled={!reviewNotes.trim() || action.isPending} onClick={() => action.mutate({ type: "revision", request: activeReviewRequest, notes: reviewNotes.trim() })}>{t("funds.revision")}</Button><Button disabled={action.isPending} onClick={() => action.mutate({ type: "approve", request: activeReviewRequest, notes: reviewNotes.trim() })}>{action.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="me-2 h-4 w-4"/>}{t("funds.approve")}</Button></div>
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
      <Dialog open={!!completionDialog} onOpenChange={(open) => { if (!open && !submitCompletion.isPending) { setCompletionDialog(null); setCompletionSummary(""); setCompletionEvidence(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{t("funds.submitCompletionTitle")}</DialogTitle><DialogDescription>{t("funds.submitCompletionHelp")}</DialogDescription></DialogHeader>
          <DemoFillButton onClick={() => void fillCompletionDemo()} />
          <label className="space-y-2 text-sm"><span>{t("funds.completionSummary")}</span><Textarea minLength={10} rows={5} value={completionSummary} onChange={(event) => setCompletionSummary(event.target.value)} /></label>
          <label className="space-y-2 text-sm"><span>{t("funds.completionEvidenceFile")}</span><Input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(event) => setCompletionEvidence(event.target.files?.[0] ?? null)} />{completionEvidence && <span className="block text-xs font-medium text-primary">{completionEvidence.name}</span>}<DemoFilePreview file={completionEvidence} alt={selectedProject?.title || t("funds.completionEvidenceFile")} /></label>
          <DialogFooter><Button variant="outline" disabled={submitCompletion.isPending} onClick={() => setCompletionDialog(null)}>{t("common.cancel")}</Button><Button disabled={!completionDialog || completionSummary.trim().length < 10 || !completionEvidence || submitCompletion.isPending} onClick={() => completionDialog && completionEvidence && submitCompletion.mutate({ milestone: completionDialog, summary: completionSummary.trim(), evidence: completionEvidence })}>{submitCompletion.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <Send className="me-2 h-4 w-4"/>}{t("funds.submitCompletion")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!activeCompletionReview} onOpenChange={(open) => { if (!open && !completionAction.isPending) { setActiveCompletionReview(null); setCompletionReviewNotes(""); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
          {activeCompletionReview && <>
            <div className="border-b bg-muted/35 px-6 py-5 pe-12">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2"><DialogTitle>{t("funds.reviewCompletionTitle")}</DialogTitle><Badge variant="outline">{t(`funds.completionStatus.${activeCompletionReview.completion_status ?? "under_review"}`)}</Badge></div>
                <DialogDescription>{t("funds.reviewCompletionDescription", { milestone: activeCompletionReview.title })}</DialogDescription>
              </DialogHeader>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("funds.milestone")}</p>
                <p className="mt-1 font-semibold">{activeCompletionReview.title}</p>
                {activeCompletionReview.completion_submitted_at && <p className="mt-1 text-xs text-muted-foreground">{formatDate(activeCompletionReview.completion_submitted_at, { dateStyle: "medium", timeStyle: "short" }, i18n.language)}</p>}
              </div>
              <div className="rounded-xl border p-4"><p className="text-sm font-semibold">{t("funds.completionSummary")}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{activeCompletionReview.completion_summary}</p></div>
              {activeCompletionReview.completion_evidence && <a className="inline-flex text-sm font-semibold text-primary underline underline-offset-4" href={activeCompletionReview.completion_evidence} target="_blank" rel="noreferrer">{t("funds.viewCompletionEvidence")}</a>}
              <label className="block space-y-2"><span className="flex items-center justify-between gap-3 text-sm font-semibold">{t("funds.reviewNotes")}<DemoFillButton onClick={() => setCompletionReviewNotes(formDemoData.completionRevision)} /></span><Textarea value={completionReviewNotes} onChange={(event) => setCompletionReviewNotes(event.target.value)} placeholder={t("funds.reviewNotesPlaceholder")} rows={4} /></label>
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-between sm:space-x-0">
              <Button variant="ghost" disabled={completionAction.isPending} onClick={() => { setActiveCompletionReview(null); setCompletionReviewNotes(""); }}>{t("common.close")}</Button>
              <div className="flex flex-wrap justify-end gap-2"><Button variant="destructive" disabled={!completionReviewNotes.trim() || completionAction.isPending} onClick={() => completionAction.mutate({ type: "reject", milestone: activeCompletionReview, notes: completionReviewNotes.trim() })}><XCircle className="me-1 h-4 w-4"/>{t("funds.reject")}</Button><Button variant="outline" disabled={!completionReviewNotes.trim() || completionAction.isPending} onClick={() => completionAction.mutate({ type: "revision", milestone: activeCompletionReview, notes: completionReviewNotes.trim() })}>{t("funds.revision")}</Button><Button disabled={completionAction.isPending} onClick={() => completionAction.mutate({ type: "approve", milestone: activeCompletionReview, notes: completionReviewNotes.trim() })}>{completionAction.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="me-2 h-4 w-4"/>}{t("funds.approveCompletion")}</Button></div>
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
      <Dialog open={handoverDialogOpen} onOpenChange={(open) => { if (!open && !finalizeCompletion.isPending) { setHandoverDialogOpen(false); setHandoverNotes(""); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{t("funds.approveHandoverTitle")}</DialogTitle><DialogDescription>{t("funds.approveHandoverHelp")}</DialogDescription></DialogHeader>
          <DemoFillButton onClick={() => setHandoverNotes(formDemoData.handover)} />
          <Textarea minLength={10} rows={5} value={handoverNotes} onChange={(event) => setHandoverNotes(event.target.value)} placeholder={t("funds.handoverNotesPlaceholder")} />
          <DialogFooter><Button variant="outline" disabled={finalizeCompletion.isPending} onClick={() => setHandoverDialogOpen(false)}>{t("common.cancel")}</Button><Button disabled={!selectedProject || handoverNotes.trim().length < 10 || finalizeCompletion.isPending} onClick={() => selectedProject && finalizeCompletion.mutate({ id: selectedProject.id, notes: handoverNotes.trim() })}>{finalizeCompletion.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}{t("funds.approveHandover")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </DashboardLayout>;
};

export default FundsPage;
