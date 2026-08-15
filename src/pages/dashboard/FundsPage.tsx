import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, HandCoins, Loader2, LockKeyhole, Send, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DashboardLayout from "./DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import adminProjectsService from "@/services/adminProjectsService";
import fundsService, { type WithdrawalPayload, type WithdrawalRequest } from "@/services/fundsService";
import projectsService, { type ProjectMilestone } from "@/services/projectsService";

type ReviewDecision = "reject" | "revision";
type CompletionDecision = "reject" | "revision";

const FundsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = Boolean(user?.is_staff || user?.user_type === "admin");
  const roleBase = isAdmin ? "/dashboard/admin" : "/dashboard/entrepreneur";
  const [projectId, setProjectId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewDialog, setReviewDialog] = useState<{
    type: ReviewDecision;
    request: WithdrawalRequest;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [completionDialog, setCompletionDialog] = useState<ProjectMilestone | null>(null);
  const [completionSummary, setCompletionSummary] = useState("");
  const [completionEvidence, setCompletionEvidence] = useState<File | null>(null);
  const [completionReviewDialog, setCompletionReviewDialog] = useState<{
    type: CompletionDecision;
    milestone: ProjectMilestone;
  } | null>(null);
  const [completionReviewNotes, setCompletionReviewNotes] = useState("");
  const [form, setForm] = useState<WithdrawalPayload>({ milestone: "", amount: "", evidence_description: "", planned_expenses: "", evidence_file: null });

  const projectsQuery = useQuery({
    queryKey: ["funds-projects", isAdmin],
    queryFn: () => isAdmin ? adminProjectsService.listProjects({ page_size: 100 }) : projectsService.listMyProjects(),
  });
  const withdrawalsQuery = useQuery({ queryKey: ["withdrawals"], queryFn: () => fundsService.list() });
  const projects = projectsQuery.data?.results ?? [];
  const eligibleProjects = projects.filter((project) => project.status === "implementation");
  const selectedProject = eligibleProjects.find((project) => project.id === projectId) ?? eligibleProjects[0];
  const currentMilestone = selectedProject?.milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((milestone) => milestone.status !== "completed");
  const totals = useMemo(() => projects.reduce((result, project) => ({
    secured: result.secured + Number(project.funding_account?.secured || 0),
    released: result.released + Number(project.funding_account?.released || 0),
    refunded: result.refunded + Number(project.funding_account?.refunded || 0),
  }), { secured: 0, released: 0, refunded: 0 }), [projects]);
  const selectedMilestones = selectedProject?.milestones.slice().sort((a, b) => a.order - b.order) ?? [];
  const selectedFundedAmount = Number(selectedProject?.funded_amount || 0);
  const visibleRequests = (withdrawalsQuery.data?.results ?? []).filter(
    (request) => statusFilter === "all" || request.status === statusFilter,
  );

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
  const action = useMutation({
    mutationFn: async ({ type, request, notes = "" }: { type: string; request: WithdrawalRequest; notes?: string }) => {
      if (type === "review") return fundsService.review(request.id);
      if (type === "approve") return fundsService.approve(request.id);
      if (type === "release") return fundsService.release(request.id);
      if (type === "cancel") return fundsService.cancel(request.id);
      if (!notes.trim() && (type === "reject" || type === "revision")) {
        setReviewNotes("");
        setReviewDialog({ type: type as ReviewDecision, request });
        return null;
      }
      return type === "reject" ? fundsService.reject(request.id, notes) : fundsService.requestRevision(request.id, notes);
    },
    onSuccess: async (result) => {
      if (!result) return;
      setReviewDialog(null);
      setReviewNotes("");
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
    mutationFn: async ({ type, milestone, notes = "" }: { type: "review" | "approve" | CompletionDecision; milestone: ProjectMilestone; notes?: string }) => {
      if (type === "review") return fundsService.reviewMilestoneCompletion(milestone.id!);
      if (type === "approve") return fundsService.approveMilestoneCompletion(milestone.id!, notes);
      if (!notes.trim()) {
        setCompletionReviewDialog({ type, milestone });
        return null;
      }
      return type === "reject"
        ? fundsService.rejectMilestoneCompletion(milestone.id!, notes)
        : fundsService.requestMilestoneCompletionRevision(milestone.id!, notes);
    },
    onSuccess: async (result) => {
      if (!result) return;
      setCompletionReviewDialog(null);
      setCompletionReviewNotes("");
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

  return <DashboardLayout roleBase={roleBase}>
    <div className="space-y-7">
      <div><h1 className="text-3xl font-bold">{t("funds.title")}</h1><p className="text-muted-foreground">{t("funds.subtitle")}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><LockKeyhole className="h-5 w-5"/>{t("funds.securedFunding")}</div><p className="mt-2 text-3xl font-bold text-primary">{formatCurrency(totals.secured + totals.released + totals.refunded)}</p></div>
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><HandCoins className="h-5 w-5"/>{t("funds.releasedBalance")}</div><p className="mt-2 text-3xl font-bold text-success">{formatCurrency(totals.released)}</p></div>
        <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-5 w-5"/>{t("funds.availableBalance")}</div><p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(totals.secured)}</p></div>
      </div>

      {isAdmin && <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">{t("funds.awaitingFinalization")}</h2><div className="mt-4 space-y-3">{projects.filter((project) => project.status === "fully_funded").map((project) => <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold">{project.title}</p><p className="text-sm text-muted-foreground">{formatCurrency(Number(project.funded_amount))} / {formatCurrency(Number(project.goal_amount))}</p></div><Button disabled={finalize.isPending} onClick={() => finalize.mutate(project.id)}>{finalize.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="me-2 h-4 w-4"/>}{t("funds.finalize")}</Button></div>)}{!projects.some((project) => project.status === "fully_funded") && <p className="py-4 text-sm text-muted-foreground">{t("funds.noneAwaiting")}</p>}</div></section>}

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
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-muted-foreground">{t("funds.allocation")}</p><p className="font-semibold">{formatCurrency(allocation)}</p></div><div><p className="text-xs text-muted-foreground">{t("funds.released")}</p><p className="font-semibold text-success">{formatCurrency(released)}</p></div><div><p className="text-xs text-muted-foreground">{t("funds.remaining")}</p><p className="font-semibold">{formatCurrency(Math.max(allocation - released, 0))}</p></div></div>
              {!locked && released >= allocation && <div className="mt-4 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t("funds.completionEvidence")}</p>
                  <Badge variant={completionStatus === "approved" ? "success" : "outline"}>{t(`funds.completionStatus.${completionStatus}`)}</Badge>
                </div>
                {milestone.completion_summary && <p className="mt-2 text-sm text-muted-foreground">{milestone.completion_summary}</p>}
                {milestone.completion_evidence && <a className="mt-2 inline-block text-sm font-medium text-primary underline" href={milestone.completion_evidence} target="_blank" rel="noreferrer">{t("funds.viewCompletionEvidence")}</a>}
                {milestone.completion_review_notes && <p className="mt-2 rounded-lg bg-muted p-3 text-sm">{milestone.completion_review_notes}</p>}
                {canSubmitCompletion && <Button className="mt-3" size="sm" onClick={() => { setCompletionDialog(milestone); setCompletionSummary(milestone.completion_summary ?? ""); setCompletionEvidence(null); }}><Send className="me-1 h-4 w-4"/>{t(completionStatus === "not_submitted" ? "funds.submitCompletion" : "funds.resubmitCompletion")}</Button>}
                {isAdmin && completionStatus === "submitted" && <Button className="mt-3" size="sm" variant="outline" disabled={completionAction.isPending} onClick={() => completionAction.mutate({ type: "review", milestone })}><Clock className="me-1 h-4 w-4"/>{t("funds.reviewCompletion")}</Button>}
                {isAdmin && completionStatus === "under_review" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={completionAction.isPending} onClick={() => completionAction.mutate({ type: "approve", milestone })}><CheckCircle2 className="me-1 h-4 w-4"/>{t("funds.approveCompletion")}</Button><Button size="sm" variant="outline" onClick={() => completionAction.mutate({ type: "revision", milestone })}>{t("funds.revision")}</Button><Button size="sm" variant="destructive" onClick={() => completionAction.mutate({ type: "reject", milestone })}><XCircle className="me-1 h-4 w-4"/>{t("funds.reject")}</Button></div>}
              </div>}
            </article>;
          })}
        </div>
      </section>}

      {!isAdmin && <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">{t("funds.requestRelease")}</h2>{eligibleProjects.length ? <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="space-y-2 text-sm"><span>{t("funds.project")}</span><Select value={selectedProject?.id} onValueChange={(value) => { setProjectId(value); setForm({...form,milestone:""}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eligibleProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-2 text-sm"><span>{t("funds.milestone")}</span><Select value={form.milestone || undefined} onValueChange={(value) => setForm({...form,milestone:value})}><SelectTrigger><SelectValue placeholder={t("funds.chooseMilestone")} /></SelectTrigger><SelectContent>{currentMilestone?.id && <SelectItem value={currentMilestone.id}>{currentMilestone.title}</SelectItem>}</SelectContent></Select></label>
        <label className="space-y-2 text-sm"><span>{t("common.amount")}</span><Input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})}/></label>
        <label className="space-y-2 text-sm"><span>{t("funds.evidenceFile")}</span><Input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(e) => setForm({...form,evidence_file:e.target.files?.[0] ?? null})}/></label>
        <label className="space-y-2 text-sm sm:col-span-2"><span>{t("funds.evidence")}</span><textarea required minLength={10} className="min-h-24 w-full rounded-md border bg-background p-3" value={form.evidence_description} onChange={(e) => setForm({...form,evidence_description:e.target.value})}/></label>
        <label className="space-y-2 text-sm sm:col-span-2"><span>{t("funds.plannedExpenses")}</span><textarea required minLength={10} className="min-h-24 w-full rounded-md border bg-background p-3" value={form.planned_expenses} onChange={(e) => setForm({...form,planned_expenses:e.target.value})}/></label>
        <div className="sm:col-span-2"><Button disabled={create.isPending} type="submit">{create.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <Send className="me-2 h-4 w-4"/>}{t("funds.submitRequest")}</Button></div>
      </form> : <p className="mt-4 text-sm text-muted-foreground">{t("funds.noImplementationProjects")}</p>}</section>}

      <section className="rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="text-xl font-semibold">{withdrawalsQuery.isLoading ? t("funds.withdrawalHistory") : t("funds.withdrawalHistoryCount", { count: visibleRequests.length })}</h2><label className="min-w-44 space-y-1 text-sm"><span>{t("funds.filterStatus")}</span><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("common.all")}</SelectItem>{["requested","under_review","approved","released","revision_required","rejected","cancelled"].map((status) => <SelectItem key={status} value={status}>{t(`funds.status.${status}`)}</SelectItem>)}</SelectContent></Select></label></div>{withdrawalsQuery.isLoading && <Loader2 className="mt-5 h-5 w-5 animate-spin"/>}<div className="mt-4 space-y-3">{visibleRequests.map((request) => <div key={request.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{request.project_title} · {request.milestone_title}</p><p className="text-sm text-muted-foreground">{formatDate(request.created_at, { dateStyle: "medium" }, i18n.language)} · {formatCurrency(Number(request.amount))}</p></div><Badge variant="outline">{t(`funds.status.${request.status}`)}</Badge></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-medium text-muted-foreground">{t("funds.evidence")}</p><p className="text-sm">{request.evidence_description}</p></div><div><p className="text-xs font-medium text-muted-foreground">{t("funds.purpose")}</p><p className="text-sm">{request.planned_expenses}</p></div></div>{request.evidence_file && <a className="mt-3 inline-block text-sm font-medium text-primary underline" href={request.evidence_file} target="_blank" rel="noreferrer">{t("funds.viewEvidence")}</a>}{request.review_notes && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{request.review_notes}</p>}{request.simulated_transaction_id && <p className="mt-2 text-xs text-muted-foreground">{t("funds.simulatedPayout")}: <bdi dir="ltr">{request.simulated_transaction_id}</bdi></p>}{request.project_status !== "completed" && !isAdmin && ["requested","revision_required"].includes(request.status) && <div className="mt-4"><Button size="sm" variant="outline" onClick={() => action.mutate({type:"cancel",request})}>{t("funds.cancelRequest")}</Button></div>}{request.project_status !== "completed" && isAdmin && <div className="mt-4 flex flex-wrap gap-2">{request.status === "requested" && <Button size="sm" variant="outline" onClick={() => action.mutate({type:"review",request})}><Clock className="me-1 h-4 w-4"/>{t("funds.review")}</Button>}{request.status === "under_review" && <><Button size="sm" onClick={() => action.mutate({type:"approve",request})}><CheckCircle2 className="me-1 h-4 w-4"/>{t("funds.approve")}</Button><Button size="sm" variant="outline" onClick={() => action.mutate({type:"revision",request})}>{t("funds.revision")}</Button><Button size="sm" variant="destructive" onClick={() => action.mutate({type:"reject",request})}><XCircle className="me-1 h-4 w-4"/>{t("funds.reject")}</Button></>}{request.status === "approved" && <Button size="sm" onClick={() => action.mutate({type:"release",request})}><HandCoins className="me-1 h-4 w-4"/>{t("funds.release")}</Button>}</div>}</div>)}{!withdrawalsQuery.isLoading && visibleRequests.length === 0 && <p className="py-4 text-sm text-muted-foreground">{t("funds.noRequests")}</p>}</div></section>
      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open && !action.isPending) { setReviewDialog(null); setReviewNotes(""); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t(reviewDialog?.type === "reject" ? "funds.rejectRequestTitle" : "funds.revisionRequestTitle")}</DialogTitle>
            <DialogDescription>{t("funds.reviewNotesPrompt")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reviewNotes}
            onChange={(event) => setReviewNotes(event.target.value)}
            placeholder={t("funds.reviewNotesPlaceholder")}
            rows={5}
            autoFocus
          />
          {!reviewNotes.trim() && <p className="text-xs text-muted-foreground">{t("funds.notesRequired")}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={action.isPending} onClick={() => { setReviewDialog(null); setReviewNotes(""); }}>{t("common.cancel")}</Button>
            <Button
              variant={reviewDialog?.type === "reject" ? "destructive" : "default"}
              disabled={!reviewDialog || !reviewNotes.trim() || action.isPending}
              onClick={() => reviewDialog && action.mutate({ type: reviewDialog.type, request: reviewDialog.request, notes: reviewNotes.trim() })}
            >
              {action.isPending ? t("common.submitting") : t(reviewDialog?.type === "reject" ? "funds.reject" : "funds.revision")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!completionDialog} onOpenChange={(open) => { if (!open && !submitCompletion.isPending) { setCompletionDialog(null); setCompletionSummary(""); setCompletionEvidence(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{t("funds.submitCompletionTitle")}</DialogTitle><DialogDescription>{t("funds.submitCompletionHelp")}</DialogDescription></DialogHeader>
          <label className="space-y-2 text-sm"><span>{t("funds.completionSummary")}</span><Textarea minLength={10} rows={5} value={completionSummary} onChange={(event) => setCompletionSummary(event.target.value)} /></label>
          <label className="space-y-2 text-sm"><span>{t("funds.completionEvidenceFile")}</span><Input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(event) => setCompletionEvidence(event.target.files?.[0] ?? null)} /></label>
          <DialogFooter><Button variant="outline" disabled={submitCompletion.isPending} onClick={() => setCompletionDialog(null)}>{t("common.cancel")}</Button><Button disabled={!completionDialog || completionSummary.trim().length < 10 || !completionEvidence || submitCompletion.isPending} onClick={() => completionDialog && completionEvidence && submitCompletion.mutate({ milestone: completionDialog, summary: completionSummary.trim(), evidence: completionEvidence })}>{submitCompletion.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <Send className="me-2 h-4 w-4"/>}{t("funds.submitCompletion")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!completionReviewDialog} onOpenChange={(open) => { if (!open && !completionAction.isPending) { setCompletionReviewDialog(null); setCompletionReviewNotes(""); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{t(completionReviewDialog?.type === "reject" ? "funds.rejectCompletionTitle" : "funds.reviseCompletionTitle")}</DialogTitle><DialogDescription>{t("funds.reviewNotesPrompt")}</DialogDescription></DialogHeader>
          <Textarea rows={5} value={completionReviewNotes} onChange={(event) => setCompletionReviewNotes(event.target.value)} placeholder={t("funds.reviewNotesPlaceholder")} />
          <DialogFooter><Button variant="outline" disabled={completionAction.isPending} onClick={() => setCompletionReviewDialog(null)}>{t("common.cancel")}</Button><Button variant={completionReviewDialog?.type === "reject" ? "destructive" : "default"} disabled={!completionReviewDialog || !completionReviewNotes.trim() || completionAction.isPending} onClick={() => completionReviewDialog && completionAction.mutate({ type: completionReviewDialog.type, milestone: completionReviewDialog.milestone, notes: completionReviewNotes.trim() })}>{t(completionReviewDialog?.type === "reject" ? "funds.reject" : "funds.revision")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </DashboardLayout>;
};

export default FundsPage;
