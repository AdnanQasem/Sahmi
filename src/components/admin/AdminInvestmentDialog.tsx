import { useTranslation } from "react-i18next";
import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  CreditCard,
  Hash,
  Info,
  Landmark,
  Save,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type {
  AdminInvestment,
  AdminInvestmentPayload,
  AdminProjectOption,
  AdminUserOption,
} from "@/services/adminFinanceService";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { formDemoData } from "@/demo/formDemoData";
import { formatCurrency, formatDate } from "@/i18n/format";

interface AdminInvestmentDialogProps {
  open: boolean;
  investment: AdminInvestment | null;
  users: AdminUserOption[];
  projects: AdminProjectOption[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminInvestmentPayload) => void;
}

const blankForm: AdminInvestmentPayload = {
  investor: "",
  project: "",
  amount: "",
  status: "pending",
  transaction_id: "",
  payment_method: "bank_transfer",
  expected_return: "",
  actual_return: "",
  received_at: null,
  return_received_at: null,
  notes: "",
};

const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 16);
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};

const getInitials = (name: string) => {
  const clean = name.trim();
  if (!clean) return "IN";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

const AdminInvestmentDialog = ({
  open,
  investment,
  users,
  projects,
  pending,
  onOpenChange,
  onSubmit,
}: AdminInvestmentDialogProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AdminInvestmentPayload>(blankForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      investment
        ? {
            investor: investment.investor,
            project: investment.project,
            amount: investment.amount,
            status: investment.status,
            transaction_id: investment.transaction_id || "",
            payment_method: investment.payment_method,
            expected_return: investment.expected_return || "",
            actual_return: investment.actual_return || "",
            received_at: toLocalDateTime(investment.received_at),
            return_received_at: toLocalDateTime(investment.return_received_at),
            notes: investment.notes || "",
          }
        : blankForm,
    );
  }, [investment, open]);

  const update = <K extends keyof AdminInvestmentPayload>(
    key: K,
    value: AdminInvestmentPayload[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.investor || !form.project || !form.amount) return;
    const payload: AdminInvestmentPayload = {
      ...form,
      received_at: form.received_at ? new Date(form.received_at).toISOString() : null,
      return_received_at: form.return_received_at ? new Date(form.return_received_at).toISOString() : null,
      transaction_id: form.transaction_id?.trim(),
      notes: form.notes?.trim(),
    };
    if (payload.expected_return === "") delete payload.expected_return;
    if (payload.actual_return === "") delete payload.actual_return;
    onSubmit(payload);
  };

  const isSystemLockedStatus =
    investment?.status === "completed" || investment?.status === "refunded";

  const investorDisplayName =
    investment?.investor_detail?.full_name ||
    investment?.investor_detail?.email ||
    investment?.investor_name ||
    t("admin.unknownInvestor");

  const investorEmail = investment?.investor_detail?.email || "";
  const projectTitle = investment?.project_detail?.title || t("admin.unknownProject");
  const principalNum = Number(investment?.amount || form.amount || 0);
  const expectedReturnNum = Number(investment?.expected_return || form.expected_return || 0);
  const totalObligationNum = Number(
    investment?.obligation_total || principalNum + expectedReturnNum,
  );

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return CreditCard;
      case "paypal":
        return Wallet;
      default:
        return Landmark;
    }
  };

  const PaymentIcon = getPaymentMethodIcon(
    investment?.payment_method || form.payment_method,
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl p-0 gap-0">
        {/* Header */}
        <div className="border-b border-border/80 p-5 sm:p-6 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {t(investment ? "adminForm.editInvestment" : "adminForm.createInvestment")}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  {t("adminForm.investmentHelp")}
                </DialogDescription>
              </div>
            </div>

            {investment && (
              <div className="shrink-0">
                <StatusBadge status={investment.status} />
              </div>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Demo Fill Button if creating */}
          {!investment && (
            <DemoFillButton
              disabled={pending || users.length === 0 || projects.length === 0}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  investor: current.investor || users[0]?.id || "",
                  project: current.project || projects[0]?.id || "",
                  amount: formDemoData.investment.amount,
                  transaction_id: formDemoData.investment.transactionId,
                  notes: formDemoData.investment.notes,
                }))
              }
            />
          )}

          {/* EDIT MODE: Sleek Financial Ledger & Identity Summary Card */}
          {investment && (
            <section
              aria-label={t("adminForm.investmentOverview", { defaultValue: "Investment Overview" })}
              className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/20 p-4 sm:p-5 shadow-xs space-y-4"
            >
              {/* Top Row: Investor & Project Context */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* Investor Box */}
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3">
                  <Avatar className="h-10 w-10 border border-border shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(investorDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {investorDisplayName}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                        {t("dashboard.investor")}
                      </span>
                    </div>
                    {investorEmail && (
                      <p className="truncate text-xs text-muted-foreground">{investorEmail}</p>
                    )}
                  </div>
                </div>

                {/* Project Box */}
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {projectTitle}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <PaymentIcon className="h-3 w-3" />
                      <span>{t(`payment.${investment.payment_method}`)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Snapshot Ledger */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t("adminForm.amountUsd")}
                  </p>
                  <p className="mt-1 text-base font-bold text-foreground tabular-nums">
                    {formatCurrency(principalNum)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("adminForm.expectedReturn")}
                    </p>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    + {formatCurrency(expectedReturnNum)}
                  </p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
                    {t("adminForm.totalObligation", { defaultValue: "Total Obligation" })}
                  </p>
                  <p className="mt-1 text-base font-bold text-primary tabular-nums">
                    {formatCurrency(totalObligationNum)}
                  </p>
                </div>
              </div>

              {/* Timestamp & Reference Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>
                    {t("adminForm.investmentReceivedAt")}:{" "}
                    <strong className="font-medium text-foreground">
                      {investment.received_at ? formatDate(investment.received_at) : t("status.pending")}
                    </strong>
                  </span>
                </span>
                <span className="font-mono text-[11px] opacity-70">
                  ID: {investment.id.slice(0, 13)}...
                </span>
              </div>
            </section>
          )}

          {/* Form Content */}
          <form id="admin-investment-form" className="space-y-5" onSubmit={submit}>
            {/* CREATE MODE: Inputs for Investor, Project, Amount, Payment Method */}
            {!investment && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="investment-investor">{t("adminForm.investorRequired")}</Label>
                  <Select
                    value={form.investor}
                    onValueChange={(value) => update("investor", value)}
                  >
                    <SelectTrigger id="investment-investor">
                      <SelectValue placeholder={t("adminForm.selectInvestor")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment-project">{t("adminForm.projectRequired")}</Label>
                  <Select
                    value={form.project}
                    onValueChange={(value) => update("project", value)}
                  >
                    <SelectTrigger id="investment-project">
                      <SelectValue placeholder={t("adminForm.selectProject")} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment-amount">{t("adminForm.amountUsd")}</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => update("amount", event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment-payment-method">{t("adminForm.paymentMethod")}</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(value) =>
                      update("payment_method", value as AdminInvestment["payment_method"])
                    }
                  >
                    <SelectTrigger id="investment-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem>
                      <SelectItem value="card">{t("payment.card")}</SelectItem>
                      <SelectItem value="paypal">{t("payment.paypal")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected-return">{t("adminForm.expectedReturn")}</Label>
                  <Input
                    id="expected-return"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.expected_return || ""}
                    onChange={(event) => update("expected_return", event.target.value)}
                  />
                </div>
              </div>
            )}

            {/* EDITABLE ADMINISTRATIVE CONTROLS */}
            <div className="space-y-4">
              <div className="border-t border-border/70 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>
                    {t("adminForm.managementControls", {
                      defaultValue: "Management & Verification",
                    })}
                  </span>
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Status Selector */}
                <div className="space-y-2">
                  <Label htmlFor="investment-status" className="text-xs font-semibold">
                    {t("adminForm.status")}
                  </Label>
                  {isSystemLockedStatus ? (
                    <div className="rounded-lg border border-border/80 bg-muted/30 p-2.5 flex items-center justify-between">
                      <StatusBadge status={form.status} />
                      <span className="text-[11px] text-muted-foreground">
                        {t("admin.systemManaged", { defaultValue: "System managed" })}
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        update("status", value as AdminInvestment["status"])
                      }
                    >
                      <SelectTrigger id="investment-status" className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("status.pending")}</SelectItem>
                        <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                        <SelectItem value="failed">{t("status.failed")}</SelectItem>
                        <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {isSystemLockedStatus && (
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {t("adminForm.systemControlledStatus", {
                        defaultValue:
                          "Completed and Refunded statuses are automatically managed by the funding release workflow.",
                      })}
                    </p>
                  )}
                </div>

                {/* Transaction Reference ID */}
                <div className="space-y-2">
                  <Label htmlFor="transaction-id" className="text-xs font-semibold">
                    {t("adminForm.transactionId")}
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="transaction-id"
                      maxLength={120}
                      className="pl-9 font-mono text-xs"
                      placeholder="e.g. TXN-2026-9842X"
                      value={form.transaction_id || ""}
                      onChange={(event) => update("transaction_id", event.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("adminForm.transactionIdHelp", {
                      defaultValue: "Reference code from bank wire, card processor, or receipt.",
                    })}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="investment-received-at" className="text-xs font-semibold">
                    {t("adminForm.investmentReceivedAt")}
                  </Label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="investment-received-at"
                      type="datetime-local"
                      className="pl-9 text-xs"
                      value={form.received_at || ""}
                      onChange={(event) => update("received_at", event.target.value || null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return-date" className="text-xs font-semibold">
                    {t("adminForm.returnReceived")}
                  </Label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="return-date"
                      type="datetime-local"
                      className="pl-9 text-xs"
                      value={form.return_received_at || ""}
                      onChange={(event) =>
                        update("return_received_at", event.target.value || null)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <Label htmlFor="investment-notes" className="text-xs font-semibold">
                  {t("adminForm.internalNotes")}
                </Label>
                <Textarea
                  id="investment-notes"
                  rows={3}
                  className="text-xs leading-relaxed"
                  placeholder={t("adminForm.internalNotesPlaceholder", {
                    defaultValue:
                      "Add internal compliance notes, wire confirmation details, or administrative remarks...",
                  })}
                  value={form.notes || ""}
                  onChange={(event) => update("notes", event.target.value)}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border/80 bg-muted/20 p-4 sm:p-5 gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="submit"
            form="admin-investment-form"
            disabled={pending || !form.investor || !form.project || !form.amount}
            className="gap-2 font-semibold shadow-xs"
          >
            <Save className="h-4 w-4" />
            {pending
              ? t("common.saving", { defaultValue: "Saving..." })
              : t("adminForm.saveInvestment", { defaultValue: "Save investment" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminInvestmentDialog;
