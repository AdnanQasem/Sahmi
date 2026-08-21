import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, ClipboardList, HandCoins, Landmark, Loader2, Pencil, Plus, WalletCards } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DashboardLayout from "./DashboardLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import RepaymentPlanSubmissionDialog from "@/components/repayments/RepaymentPlanSubmissionDialog";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { createDemoRepaymentReference, formDemoData } from "@/demo/formDemoData";
import { createRepaymentReceiptDemo } from "@/demo/demoFiles";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { formatCurrency, formatDate, formatPercent } from "@/i18n/format";
import repaymentService, { type RepaymentPlan, type RepaymentRecord } from "@/services/repaymentService";

const statuses = ["all", "pending", "due", "paid", "overdue", "cancelled"] as const;

const RepaymentsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [fundingRepayment, setFundingRepayment] = useState<RepaymentRecord | null>(null);
  const [transferReference, setTransferReference] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferReceipt, setTransferReceipt] = useState<File | null>(null);
  const [sourceDeclaration, setSourceDeclaration] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RepaymentPlan | null>(null);
  const isEntrepreneur = user?.user_type === "entrepreneur";
  const roleBase = isEntrepreneur ? "/dashboard/entrepreneur" : "/dashboard/investor";
  const recordsQuery = useQuery({
    queryKey: ["repayments", status],
    queryFn: () => repaymentService.list({ status: status === "all" ? undefined : status, ordering: "scheduled_date" }),
  });
  const summaryQuery = useQuery({ queryKey: ["repayments", "summary"], queryFn: repaymentService.summary });
  const plansQuery = useQuery({ queryKey: ["repayment-plans"], queryFn: () => repaymentService.listPlans({ ordering: "-submitted_at" }) });
  const eligibleInvestmentsQuery = useQuery({ queryKey: ["repayment-plans", "eligible"], queryFn: repaymentService.listEligibleInvestments, enabled: isEntrepreneur });
  const records = recordsQuery.data?.results ?? [];
  const summary = summaryQuery.data;
  const scheduledTotal = Number(summary?.scheduled_total || 0);
  const paidTotal = Number(summary?.paid_total || 0);
  const obligationTotal = Number(summary?.obligation_total || scheduledTotal);
  const planProgress = obligationTotal > 0 ? Math.min((paidTotal / obligationTotal) * 100, 100) : 0;
  const plans = plansQuery.data?.results || [];
  const fillFundingDemo = () => {
    const reference = createDemoRepaymentReference();
    const transferDate = new Date().toISOString().slice(0, 10);
    setTransferReference(reference);
    setTransferDate(transferDate);
    if (fundingRepayment) {
      setTransferReceipt(createRepaymentReceiptDemo({
        projectTitle: fundingRepayment.project_title,
        amount: fundingRepayment.amount,
        reference,
        transferDate,
      }));
    }
    setSourceDeclaration(formDemoData.repayment.fundingNotes);
    setAgreementAccepted(true);
  };
  const savePlan = useMutation({
    mutationFn: (payload: Parameters<typeof repaymentService.submitPlan>[0]) => editingPlan
      ? repaymentService.resubmitPlan(editingPlan.id, payload)
      : repaymentService.submitPlan(payload),
    onSuccess: async () => {
      setPlanDialogOpen(false);
      setEditingPlan(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["repayment-plans"] }),
        queryClient.invalidateQueries({ queryKey: ["repayments"] }),
      ]);
      toast.success(t(editingPlan ? "repaymentPlanSubmission.resubmitted" : "repaymentPlanSubmission.submitted"));
    },
    onError: (error) => toast.error(getErrorMessage(error, t("repaymentPlanSubmission.submitFailed"))),
  });
  const submitFunding = useMutation({
    mutationFn: () => repaymentService.submitTransfer({
      repayment: fundingRepayment!.id,
      inbound_reference: transferReference.trim(),
      inbound_transfer_date: transferDate,
      receipt: transferReceipt,
      source_of_funds_declaration: sourceDeclaration.trim(),
      agreement_accepted: agreementAccepted,
    }),
    onSuccess: async () => {
      setFundingRepayment(null);
      setTransferReference("");
      setTransferReceipt(null);
      setSourceDeclaration("");
      setAgreementAccepted(false);
      await queryClient.invalidateQueries({ queryKey: ["repayments"] });
      toast.success(t("repaymentFunding.submitted"));
    },
    onError: (error) => toast.error(getErrorMessage(error, t("repaymentFunding.submitFailed"))),
  });
  const cards = [
    { label: t("repaymentDashboard.scheduled"), value: summary?.scheduled_total, icon: WalletCards },
    { label: t("repaymentDashboard.paid"), value: summary?.paid_total, icon: CheckCircle2 },
    { label: t("repaymentDashboard.remaining"), value: summary?.remaining_total, icon: HandCoins },
  ];

  return (
    <DashboardLayout roleBase={roleBase}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-3xl font-bold text-foreground">{t("repaymentDashboard.title")}</h1><p className="mt-2 text-muted-foreground">{t(isEntrepreneur ? "repaymentDashboard.entrepreneurHelp" : "repaymentDashboard.investorHelp")}</p></div>
          <div className="flex flex-wrap gap-2">{isEntrepreneur && <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}><Plus className="h-4 w-4" />{t("repaymentPlanSubmission.create")}</Button>}<Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger className="w-48" aria-label={t("repaymentDashboard.filterStatus")}><SelectValue /></SelectTrigger><SelectContent>{statuses.map((value) => <SelectItem key={value} value={value}>{value === "all" ? t("admin.allStatuses") : t(`status.${value}`)}</SelectItem>)}</SelectContent></Select></div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-3 text-muted-foreground"><Icon className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{label}</span></div><p className="mt-3 text-2xl font-bold text-foreground">{summaryQuery.isLoading ? "—" : formatCurrency(Number(value || 0))}</p></article>)}
        </div>

        {isEntrepreneur && Number(summary?.platform_fee_total || 0) > 0 && <aside className="flex items-start gap-3 rounded-xl border-2 border-primary/25 bg-primary/5 p-4"><Landmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">{t("repaymentDashboard.platformFeeDue", { rate: summary?.platform_fee_rate || "3.00", amount: formatCurrency(Number(summary?.platform_fee_total || 0)) })}</p><p className="mt-1 text-sm font-medium">{t("repaymentDashboard.platformFeeProgress", { paid: formatCurrency(Number(summary?.platform_fee_paid || 0)), remaining: formatCurrency(Number(summary?.platform_fee_remaining || 0)) })}</p><p className="mt-1 text-xs text-muted-foreground">{t("repaymentDashboard.platformFeeSeparate")}</p></div></aside>}

        {scheduledTotal > 0 && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">{t("repaymentPlan.progress")}</h2>
            <span className="text-sm font-semibold text-primary">{formatPercent(planProgress)}</span>
          </div>
          <Progress value={planProgress} aria-label={t("repaymentPlan.progress")} />
          <p className="mt-2 text-xs text-muted-foreground">{t("repaymentPlan.progressHelp")}</p>
        </section>}

        {summary?.next_repayment_date && <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><CalendarClock className="h-5 w-5 text-primary" /><p className="text-sm"><span className="font-semibold">{t("repaymentDashboard.nextPayment")}:</span> {formatDate(summary.next_repayment_date + "T00:00:00", { dateStyle: "medium" })}</p></div>}

        <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">{t("repaymentPlanSubmission.plansTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{t(isEntrepreneur ? "repaymentPlanSubmission.ownerPlansHelp" : "repaymentPlanSubmission.investorPlansHelp")}</p></div>
          {plansQuery.isLoading ? <Skeleton className="h-40" /> : plans.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-3 h-9 w-9 opacity-50" />{t("repaymentPlanSubmission.noPlans")}</div> : <div className="grid gap-4 lg:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{plan.project_title}</p>{isEntrepreneur && <p className="text-sm text-muted-foreground">{plan.recipient === "platform" ? t("repaymentPlanSubmission.platformFeeTitle") : plan.investor_name}</p>}</div><StatusBadge status={plan.status} label={t(`repaymentPlanSubmission.status.${plan.status}`)} /></div>
            <div className="mt-4 space-y-2">{(plan.installments || []).map((item) => <div key={item.id || `${item.recipient}-${item.scheduled_date}-${item.amount}`} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${item.recipient === "platform" ? "border border-primary/25 bg-primary/5" : "bg-muted/40"}`}><span>{item.recipient === "platform" ? `${t("repaymentPlanSubmission.platformRecipient")} · ` : ""}{formatDate(item.scheduled_date + "T00:00:00", { dateStyle: "medium" })}</span><span className="font-semibold">{formatCurrency(item.amount)}</span></div>)}</div>
            <p className="mt-3 text-sm font-semibold">{t(plan.recipient === "platform" ? "repaymentPlanSubmission.sahmiPlanTotal" : "repaymentPlanSubmission.planTotal", { amount: formatCurrency(plan.obligation_total) })}</p>
            {plan.review_notes && <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"><p className="font-semibold">{t("repaymentPlanSubmission.adminNotes")}</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{plan.review_notes}</p></div>}
            {isEntrepreneur && ["revision_required", "rejected"].includes(plan.status) && <Button className="mt-4" variant="outline" size="sm" onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true); }}><Pencil className="h-4 w-4" />{t("repaymentPlanSubmission.fixAndResubmit")}</Button>}
          </article>)}</div>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5"><h2 className="font-semibold">{t(isEntrepreneur ? "repaymentDashboard.obligations" : "repaymentDashboard.history")}</h2></div>
          {recordsQuery.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-20" />)}</div>
          : recordsQuery.isError ? <div className="p-10 text-center"><p className="text-destructive">{t("repaymentDashboard.loadError")}</p><Button variant="outline" className="mt-4" onClick={() => void recordsQuery.refetch()}>{t("admin.tryAgain")}</Button></div>
          : records.length === 0 ? <div className="p-12 text-center text-muted-foreground"><HandCoins className="mx-auto mb-3 h-10 w-10 opacity-50" /><p>{t("repaymentDashboard.empty")}</p></div>
          : <div className="divide-y divide-border">{records.map((record) => <article key={record.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div><p className="font-semibold text-foreground">{record.project_title}</p>{isEntrepreneur && <p className="mt-1 text-sm text-muted-foreground">{record.recipient === "platform" ? t("repaymentPlanSubmission.platformRecipient") : record.investor_name}</p>}{record.transaction_id && <p className="mt-1 text-xs text-muted-foreground">#{record.transaction_id}</p>}{record.funding_transfer && <p className="mt-1 text-xs font-medium text-primary">{t(`repaymentFunding.status.${record.funding_transfer.status}`)}</p>}{isEntrepreneur && record.funding_transfer?.review_notes && <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"><p className="font-semibold">{t("reviewFeedback.adminNote")}</p><p className="mt-1 whitespace-pre-wrap text-foreground">{record.funding_transfer.review_notes}</p></div>}</div>
            <div><p className="text-lg font-bold text-primary">{formatCurrency(Number(record.amount))}</p><p className="text-xs text-muted-foreground">{formatDate(record.scheduled_date + "T00:00:00", { dateStyle: "medium" })}</p></div>
            <div className="flex flex-col items-start gap-2 sm:items-end"><StatusBadge status={record.status} />{record.actual_payment_date && <p className="text-xs text-muted-foreground">{formatDate(record.actual_payment_date + "T00:00:00", { dateStyle: "medium" })}</p>}{isEntrepreneur && !["paid", "cancelled"].includes(record.status) && !record.funding_transfer && <Button size="sm" onClick={() => setFundingRepayment(record)}><Landmark className="h-4 w-4" />{t("repaymentFunding.fund")}</Button>}</div>
          </article>)}</div>}
        </section>
        <p className="text-xs text-muted-foreground">{t("repaymentDashboard.internalOnly")}</p>
      </div>

      <Dialog open={!!fundingRepayment} onOpenChange={(open) => !open && !submitFunding.isPending && setFundingRepayment(null)}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[90dvh] sm:max-w-xl">
          <DialogHeader className="border-b border-border px-4 py-4 pe-11 text-start sm:px-5">
            <DialogTitle>{t("repaymentFunding.title")}</DialogTitle>
            <DialogDescription>{t("repaymentFunding.description")}</DialogDescription>
          </DialogHeader>
          {fundingRepayment && <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            <DemoFillButton onClick={fillFundingDemo} disabled={submitFunding.isPending} />
            <div className="rounded-xl border bg-muted/30 p-3"><p className="text-sm text-muted-foreground">{fundingRepayment.project_title}{fundingRepayment.recipient === "platform" ? ` · ${t("repaymentPlanSubmission.platformRecipient")}` : ""}</p><div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-xl font-bold text-primary">{formatCurrency(Number(fundingRepayment.amount))}</p><p className="text-xs text-muted-foreground">{t("repaymentFunding.exactAmount")}</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm"><span>{t("repaymentFunding.inboundReference")}</span><Input value={transferReference} onChange={(event) => setTransferReference(event.target.value)} /></label>
              <label className="block space-y-1.5 text-sm"><span>{t("repaymentFunding.transferDate")}</span><Input type="date" max={new Date().toISOString().slice(0, 10)} value={transferDate} onChange={(event) => setTransferDate(event.target.value)} /></label>
            </div>
            <label className="block space-y-2 text-sm"><span>{t("repaymentFunding.receiptOptional")}</span><Input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(event) => setTransferReceipt(event.target.files?.[0] ?? null)} />{transferReceipt && <span className="block text-xs font-medium text-primary">{transferReceipt.name}</span>}</label>
            <label className="block space-y-1.5 text-sm"><span>{t("repaymentFunding.sourceOfFundsOptional")}</span><Textarea rows={2} value={sourceDeclaration} onChange={(event) => setSourceDeclaration(event.target.value)} /></label>
            <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><input className="mt-1" type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} /><span>{t("repaymentFunding.agreementAcceptance")}</span></label>
          </div>}
          <DialogFooter className="gap-2 border-t border-border bg-background px-4 py-3 sm:px-5"><Button variant="outline" disabled={submitFunding.isPending} onClick={() => setFundingRepayment(null)}>{t("common.cancel")}</Button><Button disabled={!fundingRepayment || !transferReference.trim() || !transferDate || !agreementAccepted || submitFunding.isPending} onClick={() => submitFunding.mutate()}>{submitFunding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}{t("repaymentFunding.submit")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {isEntrepreneur && <RepaymentPlanSubmissionDialog
        open={planDialogOpen}
        investments={Array.isArray(eligibleInvestmentsQuery.data) ? eligibleInvestmentsQuery.data : []}
        plan={editingPlan}
        pending={savePlan.isPending}
        onOpenChange={(open) => { setPlanDialogOpen(open); if (!open) setEditingPlan(null); }}
        onSubmit={(payload) => savePlan.mutate(payload)}
      />}
    </DashboardLayout>
  );
};

export default RepaymentsPage;
