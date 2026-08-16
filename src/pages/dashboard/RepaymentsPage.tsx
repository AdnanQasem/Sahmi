import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, HandCoins, Landmark, Loader2, WalletCards } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { formatCurrency, formatDate, formatPercent } from "@/i18n/format";
import repaymentService, { type RepaymentRecord } from "@/services/repaymentService";

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
  const isEntrepreneur = user?.user_type === "entrepreneur";
  const roleBase = isEntrepreneur ? "/dashboard/entrepreneur" : "/dashboard/investor";
  const recordsQuery = useQuery({
    queryKey: ["repayments", status],
    queryFn: () => repaymentService.list({ status: status === "all" ? undefined : status, ordering: "scheduled_date" }),
  });
  const summaryQuery = useQuery({ queryKey: ["repayments", "summary"], queryFn: repaymentService.summary });
  const records = recordsQuery.data?.results ?? [];
  const summary = summaryQuery.data;
  const obligations = summary?.obligations || [];
  const scheduledTotal = Number(summary?.scheduled_total || 0);
  const paidTotal = Number(summary?.paid_total || 0);
  const obligationTotal = Number(summary?.obligation_total || scheduledTotal);
  const planProgress = obligationTotal > 0 ? Math.min((paidTotal / obligationTotal) * 100, 100) : 0;
  const submitFunding = useMutation({
    mutationFn: () => repaymentService.submitTransfer({
      repayment: fundingRepayment!.id,
      inbound_reference: transferReference.trim(),
      inbound_transfer_date: transferDate,
      receipt: transferReceipt!,
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
          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger className="w-48" aria-label={t("repaymentDashboard.filterStatus")}><SelectValue /></SelectTrigger><SelectContent>{statuses.map((value) => <SelectItem key={value} value={value}>{value === "all" ? t("admin.allStatuses") : t(`status.${value}`)}</SelectItem>)}</SelectContent></Select>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-3 text-muted-foreground"><Icon className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{label}</span></div><p className="mt-3 text-2xl font-bold text-foreground">{summaryQuery.isLoading ? "—" : formatCurrency(Number(value || 0))}</p></article>)}
        </div>

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
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t(isEntrepreneur ? "repaymentObligations.entrepreneurTitle" : "repaymentObligations.investorTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("repaymentObligations.help")}</p>
          </div>
          {summaryQuery.isLoading ? <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
          : obligations.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{t("repaymentObligations.empty")}</div>
          : <div className="grid gap-4 lg:grid-cols-2">{obligations.map((obligation) => (
            <article key={`${obligation.project_id}-${obligation.investor_id}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/projects/${obligation.project_slug}`} className="font-semibold text-foreground hover:text-primary">{obligation.project_title}</Link>
                  {isEntrepreneur && <p className="mt-1 text-sm text-muted-foreground">{obligation.investor_name}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{t("repaymentObligations.investmentCount", { count: obligation.investment_count })}</p>
                </div>
                <StatusBadge status={obligation.status === "scheduled" ? "pending" : obligation.status === "pending_schedule" ? "pending" : obligation.status} label={t(`repaymentObligations.status.${obligation.status}`)} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">{t("repaymentObligations.invested")}</p><p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(obligation.invested_total)}</p></div>
                <div className="rounded-xl bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{t("repaymentObligations.totalExpected")}</p><p className="mt-1 text-xl font-bold text-primary">{formatCurrency(obligation.expected_repayment_total)}</p></div>
                <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">{t("repaymentObligations.actualReturned")}</p><p className="mt-1 font-semibold text-success">{formatCurrency(obligation.actual_return)}</p></div>
                <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">{t("repaymentObligations.remaining")}</p><p className="mt-1 font-semibold text-foreground">{formatCurrency(obligation.remaining_total)}</p></div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t("repaymentObligations.expectedRoi", { rate: formatPercent(Number(obligation.expected_roi_percent)), amount: formatCurrency(obligation.expected_return) })}</p>
              {obligation.next_repayment_date && <p className="mt-2 text-xs font-medium text-primary">{t("repaymentObligations.nextDate", { date: formatDate(obligation.next_repayment_date + "T00:00:00", { dateStyle: "medium" }) })}</p>}
            </article>
          ))}</div>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5"><h2 className="font-semibold">{t(isEntrepreneur ? "repaymentDashboard.obligations" : "repaymentDashboard.history")}</h2></div>
          {recordsQuery.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-20" />)}</div>
          : recordsQuery.isError ? <div className="p-10 text-center"><p className="text-destructive">{t("repaymentDashboard.loadError")}</p><Button variant="outline" className="mt-4" onClick={() => void recordsQuery.refetch()}>{t("admin.tryAgain")}</Button></div>
          : records.length === 0 ? <div className="p-12 text-center text-muted-foreground"><HandCoins className="mx-auto mb-3 h-10 w-10 opacity-50" /><p>{t("repaymentDashboard.empty")}</p></div>
          : <div className="divide-y divide-border">{records.map((record) => <article key={record.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div><p className="font-semibold text-foreground">{record.project_title}</p>{isEntrepreneur && <p className="mt-1 text-sm text-muted-foreground">{record.investor_name}</p>}{record.transaction_id && <p className="mt-1 text-xs text-muted-foreground">#{record.transaction_id}</p>}{record.funding_transfer && <p className="mt-1 text-xs font-medium text-primary">{t(`repaymentFunding.status.${record.funding_transfer.status}`)}</p>}</div>
            <div><p className="text-lg font-bold text-primary">{formatCurrency(Number(record.amount))}</p><p className="text-xs text-muted-foreground">{formatDate(record.scheduled_date + "T00:00:00", { dateStyle: "medium" })}</p></div>
            <div className="flex flex-col items-start gap-2 sm:items-end"><StatusBadge status={record.status} />{record.actual_payment_date && <p className="text-xs text-muted-foreground">{formatDate(record.actual_payment_date + "T00:00:00", { dateStyle: "medium" })}</p>}{isEntrepreneur && !["paid", "cancelled"].includes(record.status) && !record.funding_transfer && <Button size="sm" disabled={!user?.is_kyc_verified} onClick={() => setFundingRepayment(record)}><Landmark className="h-4 w-4" />{t("repaymentFunding.fund")}</Button>}</div>
          </article>)}</div>}
        </section>
        {isEntrepreneur && !user?.is_kyc_verified && <p className="text-xs font-medium text-destructive">{t("repaymentFunding.kycRequired")}</p>}
        <p className="text-xs text-muted-foreground">{t("repaymentDashboard.internalOnly")}</p>
      </div>

      <Dialog open={!!fundingRepayment} onOpenChange={(open) => !open && !submitFunding.isPending && setFundingRepayment(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{t("repaymentFunding.title")}</DialogTitle><DialogDescription>{t("repaymentFunding.description")}</DialogDescription></DialogHeader>
          {fundingRepayment && <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4"><p className="text-sm text-muted-foreground">{fundingRepayment.project_title}</p><p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(Number(fundingRepayment.amount))}</p><p className="mt-1 text-xs text-muted-foreground">{t("repaymentFunding.exactAmount")}</p></div>
            <label className="block space-y-2 text-sm"><span>{t("repaymentFunding.inboundReference")}</span><Input value={transferReference} onChange={(event) => setTransferReference(event.target.value)} /></label>
            <label className="block space-y-2 text-sm"><span>{t("repaymentFunding.transferDate")}</span><Input type="date" max={new Date().toISOString().slice(0, 10)} value={transferDate} onChange={(event) => setTransferDate(event.target.value)} /></label>
            <label className="block space-y-2 text-sm"><span>{t("repaymentFunding.receipt")}</span><Input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(event) => setTransferReceipt(event.target.files?.[0] ?? null)} /></label>
            <label className="block space-y-2 text-sm"><span>{t("repaymentFunding.sourceOfFunds")}</span><Textarea rows={3} minLength={20} value={sourceDeclaration} onChange={(event) => setSourceDeclaration(event.target.value)} /></label>
            <label className="flex items-start gap-3 rounded-xl border p-4 text-sm"><input className="mt-1" type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} /><span>{t("repaymentFunding.agreementAcceptance")}</span></label>
          </div>}
          <DialogFooter><Button variant="outline" disabled={submitFunding.isPending} onClick={() => setFundingRepayment(null)}>{t("common.cancel")}</Button><Button disabled={!fundingRepayment || !transferReference.trim() || !transferDate || !transferReceipt || sourceDeclaration.trim().length < 20 || !agreementAccepted || submitFunding.isPending} onClick={() => submitFunding.mutate()}>{submitFunding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}{t("repaymentFunding.submit")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RepaymentsPage;
