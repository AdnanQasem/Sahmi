import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatCurrency as formatLocaleCurrency, formatDate, formatPercent } from "@/i18n/format";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CircleCheckBig, ClipboardCheck, Edit3, HandCoins, Landmark, Search, Trash2, TriangleAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../DashboardLayout";
import AdminDeleteDialog from "@/components/admin/AdminDeleteDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminRepaymentDialog from "@/components/admin/AdminRepaymentDialog";
import StatusBadge from "@/components/dashboard/StatusBadge";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  type AdminRepayment,
  type AdminRepaymentPayload,
} from "@/services/adminFinanceService";
import repaymentService, { type RepaymentPlan } from "@/services/repaymentService";
import { createDemoPayoutReference, formDemoData } from "@/demo/formDemoData";

const PAGE_SIZE = 12;

const currency = (value: string | number) => formatLocaleCurrency(Number(value) || 0);

const date = (value: string) => formatDate(value + (value.length === 10 ? "T00:00:00" : ""), { dateStyle: "medium" });

const paymentLabel = (method: string) =>
  i18n.t(`payment.${method}`, { defaultValue: method });

const repaymentIdentity = (repayment: AdminRepayment) => {
  return {
    investor: repayment.recipient === "platform"
      ? i18n.t("repaymentPlanSubmission.platformRecipient")
      :
      repayment.investor_detail?.full_name ||
      repayment.investor_detail?.email ||
      i18n.t("admin.unknownInvestor"),
    project: repayment.project_detail?.title || i18n.t("admin.unknownProject"),
  };
};

const AdminRepaymentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRepayment | null>(null);
  const [deleting, setDeleting] = useState<AdminRepayment | null>(null);
  const [transferDialog, setTransferDialog] = useState<AdminRepayment | null>(null);
  const [transferNotes, setTransferNotes] = useState("");
  const [outboundReference, setOutboundReference] = useState("");
  const [cancelling, setCancelling] = useState<AdminRepayment | null>(null);
  const [reviewingPlan, setReviewingPlan] = useState<RepaymentPlan | null>(null);
  const [planReviewNotes, setPlanReviewNotes] = useState("");

  const repaymentsQuery = useQuery({
    queryKey: ["admin", "repayments", page, search, status, paymentMethod],
    queryFn: () =>
      adminFinanceService.listRepayments({
        page,
        page_size: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        payment_method: paymentMethod === "all" ? undefined : paymentMethod,
        ordering: "scheduled_date",
      }),
  });

  const investmentsQuery = useQuery({
    queryKey: ["admin", "investment-options"],
    queryFn: adminFinanceService.listInvestmentOptions,
    staleTime: 30_000,
  });

  const summaryQuery = useQuery({
    queryKey: ["repayments", "summary"],
    queryFn: repaymentService.summary,
  });
  const transfersQuery = useQuery({
    queryKey: ["admin", "repayment-transfers"],
    queryFn: () => repaymentService.listTransfers(),
  });
  const plansQuery = useQuery({
    queryKey: ["admin", "repayment-plans"],
    queryFn: () => repaymentService.listPlans({ ordering: "-submitted_at" }),
  });
  const scheduledTotal = Number(summaryQuery.data?.scheduled_total || 0);
  const paidTotal = Number(summaryQuery.data?.paid_total || 0);
  const obligationTotal = Number(summaryQuery.data?.obligation_total || scheduledTotal);
  const planProgress = obligationTotal > 0 ? Math.min((paidTotal / obligationTotal) * 100, 100) : 0;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "repayments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "investment-options"] });
    void queryClient.invalidateQueries({ queryKey: ["repayments", "summary"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "repayment-transfers"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "repayment-plans"] });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      repayment,
      payload,
    }: {
      repayment: AdminRepayment | null;
      payload: AdminRepaymentPayload;
    }) =>
      repayment
        ? adminFinanceService.updateRepayment(repayment.id, payload)
        : adminFinanceService.createRepayment(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.repayment ? "admin.updated" : "admin.created", { item: t("admin.repaymentItem") }));
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.repaymentItem") }))),
  });

  const deleteMutation = useMutation({
    mutationFn: (repayment: AdminRepayment) =>
      adminFinanceService.deleteRepayment(repayment.id),
    onSuccess: () => {
      toast.success(t("admin.deleted", { item: t("admin.repaymentItem") }));
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.deleteFailed", { item: t("admin.repaymentItem") }))),
  });

  const planReviewMutation = useMutation({
    mutationFn: ({ plan, action }: { plan: RepaymentPlan; action: "approve" | "revision" | "reject" }) => {
      if (action === "approve") return repaymentService.approvePlan(plan.id, planReviewNotes.trim());
      if (action === "revision") return repaymentService.requestPlanRevision(plan.id, planReviewNotes.trim());
      return repaymentService.rejectPlan(plan.id, planReviewNotes.trim());
    },
    onSuccess: () => {
      toast.success(t("repaymentPlanReview.updated"));
      setReviewingPlan(null);
      setPlanReviewNotes("");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("repaymentPlanReview.updateFailed"))),
  });

  const transferMutation = useMutation({
    mutationFn: ({ repayment, action }: { repayment: AdminRepayment; action: "review" | "verify" | "reject" | "disburse" }) => {
      const transfer = repayment.funding_transfer!;
      if (action === "review") return repaymentService.reviewTransfer(transfer.id);
      if (action === "verify") return repaymentService.verifyTransfer(transfer.id, transferNotes.trim());
      if (action === "reject") return repaymentService.rejectTransfer(transfer.id, transferNotes.trim());
      return repaymentService.disburseTransfer(transfer.id, { outbound_reference: outboundReference.trim() });
    },
    onSuccess: () => {
      toast.success(t("repaymentFunding.updated"));
      setTransferDialog(null);
      setTransferNotes("");
      setOutboundReference("");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("repaymentFunding.updateFailed"))),
  });

  const cancelMutation = useMutation({
    mutationFn: (repayment: AdminRepayment) => adminFinanceService.cancelRepayment(repayment.id),
    onSuccess: () => { toast.success(t("repaymentDashboard.cancelledRecorded")); setCancelling(null); refresh(); },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.repaymentItem") }))),
  });

  const openEdit = (repayment: AdminRepayment) => {
    setEditing(repayment);
    setDialogOpen(true);
  };

  const data = repaymentsQuery.data;
  const records = data?.results || [];
  const activeTransfer = transfersQuery.data?.results.find(
    (transfer) => transfer.id === transferDialog?.funding_transfer?.id,
  );
  const transferControl = (repayment: AdminRepayment, compact = false) => {
    const transfer = repayment.funding_transfer;
    if (!transfer || ["paid", "cancelled"].includes(repayment.status)) return null;
    if (transfer.status === "submitted") return <Button variant="outline" size={compact ? "sm" : "icon"} disabled={transferMutation.isPending} onClick={() => transferMutation.mutate({ repayment, action: "review" })}><Landmark className="h-4 w-4" />{compact ? t("repaymentFunding.review") : <span className="sr-only">{t("repaymentFunding.review")}</span>}</Button>;
    if (["under_review", "verified"].includes(transfer.status)) return <Button size={compact ? "sm" : "icon"} onClick={() => setTransferDialog(repayment)}><Landmark className="h-4 w-4" />{compact ? t(transfer.status === "verified" ? "repaymentFunding.disburse" : "repaymentFunding.reconcile") : <span className="sr-only">{t("repaymentFunding.reconcile")}</span>}</Button>;
    return null;
  };

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={HandCoins}
          title={t("admin.repaymentsTitle")}
          description={t("admin.repaymentsText")}
        />

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b p-5"><h2 className="font-semibold">{t("repaymentPlanReview.title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("repaymentPlanReview.help")}</p></div>
          {plansQuery.isLoading ? <div className="p-5"><Skeleton className="h-28" /></div> : !plansQuery.data?.results.length ? <div className="p-10 text-center text-muted-foreground"><ClipboardCheck className="mx-auto mb-3 h-9 w-9 opacity-50" />{t("repaymentPlanReview.empty")}</div> : <div className="divide-y">{plansQuery.data.results.map((plan) => <article key={plan.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <div><p className="font-semibold">{plan.recipient === "platform" ? t("repaymentPlanSubmission.platformFeeTitle") : plan.investor_name}</p><p className="text-sm text-muted-foreground">{plan.project_title}</p><p className="mt-1 text-xs text-muted-foreground">{t("repaymentPlanReview.installmentCount", { count: plan.installments.length })}</p></div>
            <div><p className="font-bold text-primary">{currency(plan.obligation_total)}</p><StatusBadge status={plan.status} label={t(`repaymentPlanSubmission.status.${plan.status}`)} /></div>
            <Button variant="outline" disabled={["approved", "rejected", "revision_required"].includes(plan.status)} onClick={() => { setReviewingPlan(plan); setPlanReviewNotes(plan.review_notes || ""); }}><ClipboardCheck className="h-4 w-4" />{t("repaymentPlanReview.review")}</Button>
          </article>)}</div>}
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {([
            { label: "admin.totalRepaid", value: currency(summaryQuery.data?.paid_total || 0), icon: CircleCheckBig, tone: "bg-success/10 text-success" },
            { label: "admin.pendingRepayments", value: String((summaryQuery.data?.counts.pending || 0) + (summaryQuery.data?.counts.due || 0)), icon: CalendarClock, tone: "bg-primary/10 text-primary" },
            { label: "admin.overdueRepayments", value: String(summaryQuery.data?.counts.overdue || 0), icon: TriangleAlert, tone: "bg-destructive/10 text-destructive" },
          ]).map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{t(label)}</p><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span></div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{summaryQuery.isLoading ? "—" : value}</p>
            </article>
          ))}
        </div>

        {scheduledTotal > 0 && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">{t("repaymentPlan.progress")}</h2>
            <span className="text-sm font-semibold text-primary">{formatPercent(planProgress)}</span>
          </div>
          <Progress value={planProgress} aria-label={t("repaymentPlan.progress")} />
          <p className="mt-2 text-xs text-muted-foreground">{t("repaymentPlan.progressHelp")}</p>
        </section>}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border/60 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-foreground">{t("admin.allRepayments")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? t("admin.repaymentRecords", { count: data.count }) : t("admin.loadingRepayments")}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex w-fit rounded-full bg-muted/70 p-1" role="tablist" aria-label={t("admin.filterRepaymentStatus")}>
                {(["all", "pending", "paid"] as const).map((value) => (
                  <button key={value} type="button" role="tab" aria-selected={status === value} onClick={() => { setStatus(value); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${status === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {t(value === "all" ? "common.all" : value === "pending" ? "admin.scheduledTab" : "admin.completedTab")}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(15rem,1fr)_12rem] lg:w-[32rem]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t("admin.searchRepaymentsLabel")}
                  className="ps-9"
                  placeholder={t("admin.searchRepayments")}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label={t("admin.filterRepaymentMethod")}><SelectValue placeholder={t("admin.payment")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allPaymentMethods")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem>
                  <SelectItem value="card">{t("payment.card")}</SelectItem>
                  <SelectItem value="paypal">{t("payment.paypal")}</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>

          {repaymentsQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : repaymentsQuery.isError ? (
            <div className="p-10 text-center">
              <p className="font-medium text-destructive">{t("admin.repaymentsLoadError")}</p>
              <Button className="mt-4" variant="outline" onClick={() => void repaymentsQuery.refetch()}>{t("admin.tryAgain")}</Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <HandCoins className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">{t("admin.noRepayments")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.adjustOrRepayment")}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/25">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("admin.investor")}</TableHead>
                      <TableHead>{t("dashboard.project")}</TableHead>
                      <TableHead>{t("common.amount")}</TableHead>
                      <TableHead>{t("admin.dueDate")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="w-24 text-right">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((repayment) => {
                      const identity = repaymentIdentity(repayment);
                      return (
                        <TableRow key={repayment.id} className="h-20 border-border/50">
                          <TableCell className="font-semibold text-foreground">
                            <p className="font-semibold text-foreground">{identity.investor}</p>
                          </TableCell>
                          <TableCell><p className="max-w-56 truncate font-medium text-foreground">{identity.project}</p><p className="mt-1 text-xs text-muted-foreground">{paymentLabel(repayment.payment_method)}</p></TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {currency(repayment.amount)}
                          </TableCell>
                          <TableCell>
                            <p className="text-foreground">{date(repayment.scheduled_date)}</p>
                            {repayment.actual_payment_date ? (
                              <p className="text-xs text-muted-foreground">
                                {t("admin.paidDate", { date: date(repayment.actual_payment_date) })}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={repayment.status} />
                            <p className="mt-1 text-xs font-medium text-primary">{repayment.funding_transfer ? t(`repaymentFunding.status.${repayment.funding_transfer.status}`) : t("repaymentFunding.awaitingDeposit")}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {transferControl(repayment)}
                              {!['paid', 'cancelled'].includes(repayment.status) && <Button variant="ghost" size="icon" onClick={() => setCancelling(repayment)}>
                                <XCircle className="h-4 w-4" /><span className="sr-only">{t("repaymentDashboard.cancelRepayment")}</span>
                              </Button>}
                              {!repayment.plan && !['paid', 'cancelled'].includes(repayment.status) && <Button variant="ghost" size="icon" onClick={() => openEdit(repayment)}>
                                <Edit3 className="h-4 w-4" />
                                <span className="sr-only">{t("admin.editRepayment")}</span>
                              </Button>}
                              {!repayment.plan && repayment.status !== 'paid' && <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(repayment)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{t("admin.deleteRepayment")}</span>
                              </Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {records.map((repayment) => {
                  const identity = repaymentIdentity(repayment);
                  return (
                    <article key={repayment.id} className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{identity.investor}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{identity.project}</p>
                        </div>
                        <StatusBadge status={repayment.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("common.amount")}</p>
                          <p className="mt-1 font-semibold text-foreground">{currency(repayment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("admin.scheduled")}</p>
                          <p className="mt-1 font-medium text-foreground">{date(repayment.scheduled_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-xs text-muted-foreground">{paymentLabel(repayment.payment_method)}</p><p className="mt-1 text-xs font-medium text-primary">{repayment.funding_transfer ? t(`repaymentFunding.status.${repayment.funding_transfer.status}`) : t("repaymentFunding.awaitingDeposit")}</p></div>
                        <div className="flex gap-1">
                          {transferControl(repayment, true)}
                          {!['paid', 'cancelled'].includes(repayment.status) && <Button variant="outline" size="icon" onClick={() => setCancelling(repayment)}><XCircle className="h-4 w-4" /><span className="sr-only">{t("repaymentDashboard.cancelRepayment")}</span></Button>}
                          {!repayment.plan && !['paid', 'cancelled'].includes(repayment.status) && <Button variant="outline" size="sm" onClick={() => openEdit(repayment)}>
                            <Edit3 className="h-4 w-4" />{t("common.edit")}</Button>
                          }
                          {!repayment.plan && repayment.status !== 'paid' && <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleting(repayment)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("admin.deleteRepayment")}</span>
                          </Button>}
                        </div>
                      </div>
                    </article>
                  );
                })}
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

      <AdminRepaymentDialog
        open={dialogOpen}
        repayment={editing}
        investments={investmentsQuery.data || []}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={(payload) => saveMutation.mutate({ repayment: editing, payload })}
      />

      <AdminDeleteDialog
        open={!!deleting}
        title={t("admin.deleteRepaymentQuestion")}
        description={t("admin.deleteRepaymentText")}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />

      <Dialog open={!!transferDialog} onOpenChange={(open) => { if (!open && !transferMutation.isPending) { setTransferDialog(null); setTransferNotes(""); setOutboundReference(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t(transferDialog?.funding_transfer?.status === "verified" ? "repaymentFunding.disburseTitle" : "repaymentFunding.reconcileTitle")}</DialogTitle><DialogDescription>{t(transferDialog?.funding_transfer?.status === "verified" ? "repaymentFunding.disburseHelp" : "repaymentFunding.reconcileHelp")}</DialogDescription></DialogHeader>
          {activeTransfer && <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">{t("common.amount")}</p><p className="mt-1 font-semibold">{currency(activeTransfer.amount)} {activeTransfer.currency}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("repaymentFunding.inboundReference")}</p><p className="mt-1 break-all font-semibold" dir="ltr">{activeTransfer.inbound_reference}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("repaymentFunding.transferDate")}</p><p className="mt-1 font-semibold">{date(activeTransfer.inbound_transfer_date)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("repaymentFunding.sourceOfFunds")}</p><p className="mt-1 whitespace-pre-wrap">{activeTransfer.source_of_funds_declaration}</p></div>
            {activeTransfer.receipt_url && <a className="font-semibold text-primary underline sm:col-span-2" href={activeTransfer.receipt_url} target="_blank" rel="noreferrer">{t("repaymentFunding.viewReceipt")}</a>}
          </div>}
          {transferDialog && <DemoFillButton
            disabled={transferMutation.isPending}
            onClick={() => {
              if (transferDialog.funding_transfer?.status === "verified") {
                setOutboundReference(createDemoPayoutReference());
              } else {
                setTransferNotes(formDemoData.repayment.verificationNotes);
              }
            }}
          />}
          {transferDialog?.funding_transfer?.status === "verified" ? <label className="space-y-2 text-sm"><span>{t("repaymentFunding.outboundReference")}</span><Input value={outboundReference} onChange={(event) => setOutboundReference(event.target.value)} /></label> : <label className="space-y-2 text-sm"><span>{t("repaymentFunding.reviewNotes")}</span><Textarea rows={4} minLength={10} value={transferNotes} onChange={(event) => setTransferNotes(event.target.value)} /></label>}
          <DialogFooter>
            <Button variant="outline" disabled={transferMutation.isPending} onClick={() => setTransferDialog(null)}>{t("common.cancel")}</Button>
            {transferDialog?.funding_transfer?.status === "under_review" && <Button variant="destructive" disabled={transferNotes.trim().length < 10 || transferMutation.isPending} onClick={() => transferMutation.mutate({ repayment: transferDialog, action: "reject" })}>{t("funds.reject")}</Button>}
            {transferDialog?.funding_transfer?.status === "under_review" && <Button disabled={transferNotes.trim().length < 10 || transferMutation.isPending} onClick={() => transferMutation.mutate({ repayment: transferDialog, action: "verify" })}>{t(transferDialog.recipient === "platform" ? "repaymentFunding.verifyPlatform" : "repaymentFunding.verify")}</Button>}
            {transferDialog?.funding_transfer?.status === "verified" && <Button disabled={!outboundReference.trim() || transferMutation.isPending} onClick={() => transferMutation.mutate({ repayment: transferDialog, action: "disburse" })}>{t("repaymentFunding.disburse")}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewingPlan} onOpenChange={(open) => { if (!open && !planReviewMutation.isPending) { setReviewingPlan(null); setPlanReviewNotes(""); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{t("repaymentPlanReview.dialogTitle")}</DialogTitle><DialogDescription>{t("repaymentPlanReview.dialogHelp")}</DialogDescription></DialogHeader>
          {reviewingPlan && <div className="space-y-4"><div className="rounded-xl bg-muted/40 p-4"><p className="font-semibold">{reviewingPlan.recipient === "platform" ? t("repaymentPlanSubmission.platformFeeTitle") : reviewingPlan.investor_name} · {reviewingPlan.project_title}</p><p className="mt-1 text-sm text-muted-foreground">{t(reviewingPlan.recipient === "platform" ? "repaymentPlanSubmission.sahmiPlanTotal" : "repaymentPlanSubmission.planTotal", { amount: currency(reviewingPlan.obligation_total) })}</p></div><div className="space-y-2">{reviewingPlan.installments.map((item) => <div key={item.id} className={`flex justify-between rounded-lg border px-3 py-2 text-sm ${item.recipient === "platform" ? "border-primary/30 bg-primary/5" : ""}`}><span>{item.recipient === "platform" ? `${t("repaymentPlanSubmission.platformRecipient")} · ` : ""}{date(item.scheduled_date)}</span><span className="font-semibold">{currency(item.amount)}</span></div>)}</div><label className="block space-y-2 text-sm"><span>{t("repaymentPlanReview.notes")}</span><Textarea rows={4} value={planReviewNotes} onChange={(event) => setPlanReviewNotes(event.target.value)} /></label></div>}
          <DialogFooter className="gap-2"><Button variant="outline" disabled={planReviewMutation.isPending} onClick={() => setReviewingPlan(null)}>{t("common.cancel")}</Button><Button variant="destructive" disabled={planReviewNotes.trim().length < 5 || planReviewMutation.isPending} onClick={() => reviewingPlan && planReviewMutation.mutate({ plan: reviewingPlan, action: "reject" })}>{t("repaymentPlanReview.reject")}</Button><Button variant="outline" disabled={planReviewNotes.trim().length < 5 || planReviewMutation.isPending} onClick={() => reviewingPlan && planReviewMutation.mutate({ plan: reviewingPlan, action: "revision" })}>{t("repaymentPlanReview.requestChanges")}</Button><Button disabled={planReviewMutation.isPending} onClick={() => reviewingPlan && planReviewMutation.mutate({ plan: reviewingPlan, action: "approve" })}>{t("repaymentPlanReview.approve")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog
        open={!!cancelling}
        title={t("repaymentDashboard.cancelRepayment")}
        description={t("repaymentDashboard.cancelConfirm")}
        pending={cancelMutation.isPending}
        onOpenChange={(open) => !open && setCancelling(null)}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling)}
      />
    </DashboardLayout>
  );
};

export default AdminRepaymentsPage;
