import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarRange, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { AdminInvestment, AdminRepaymentPlanPayload } from "@/services/adminFinanceService";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { formDemoData } from "@/demo/formDemoData";

interface Props {
  open: boolean;
  investments: AdminInvestment[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminRepaymentPlanPayload) => void;
}

const remainingObligation = (investment: AdminInvestment) => {
  if (investment.remaining_repayment_obligation !== undefined) {
    return Number(investment.remaining_repayment_obligation);
  }
  return Math.max(
    Number(investment.amount) + Number(investment.expected_return) - Number(investment.scheduled_repayment_total || 0),
    0,
  );
};

const addMonths = (dateValue: string, months: number) => {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay))).toISOString().slice(0, 10);
};

const AdminRepaymentPlanDialog = ({ open, investments, pending, onOpenChange, onSubmit }: Props) => {
  const { t } = useTranslation();
  const eligible = useMemo(() => investments.filter((investment) => remainingObligation(investment) > 0), [investments]);
  const [investmentId, setInvestmentId] = useState("");
  const [installmentCount, setInstallmentCount] = useState(3);
  const [firstDate, setFirstDate] = useState("");
  const [intervalMonths, setIntervalMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<AdminRepaymentPlanPayload["payment_method"]>("bank_transfer");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setInvestmentId(eligible[0]?.id || "");
    setInstallmentCount(3);
    setFirstDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setIntervalMonths(1);
    setPaymentMethod("bank_transfer");
    setNotes("");
  }, [open, eligible]);

  const selected = eligible.find((investment) => investment.id === investmentId);
  const remaining = selected ? remainingObligation(selected) : 0;
  const averageInstallment = installmentCount > 0 ? remaining / installmentCount : 0;
  const lastDate = addMonths(firstDate, Math.max(installmentCount - 1, 0) * intervalMonths);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!investmentId || !firstDate || installmentCount < 1) return;
    onSubmit({
      investment: investmentId,
      installment_count: installmentCount,
      first_scheduled_date: firstDate,
      interval_months: intervalMonths,
      payment_method: paymentMethod,
      notes: notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarRange className="h-5 w-5" /></div>
          <DialogTitle>{t("repaymentPlan.createTitle")}</DialogTitle>
          <DialogDescription>{t("repaymentPlan.createHelp")}</DialogDescription>
        </DialogHeader>

        {eligible.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("repaymentPlan.noneEligible")}</div>
        ) : (
          <form className="space-y-5" onSubmit={submit}>
            <DemoFillButton onClick={() => { setInstallmentCount(3); setIntervalMonths(1); setNotes(formDemoData.repayment.notes); }} disabled={pending} />
            <div className="space-y-2">
              <Label htmlFor="plan-investment">{t("adminForm.investmentRequired")}</Label>
              <Select value={investmentId} onValueChange={setInvestmentId}>
                <SelectTrigger id="plan-investment"><SelectValue /></SelectTrigger>
                <SelectContent>{eligible.map((investment) => <SelectItem key={investment.id} value={investment.id}>{investment.investor_detail?.full_name || investment.investor_detail?.email} · {investment.project_detail?.title} · {t("repaymentPlan.remainingLabel", { amount: formatCurrency(remainingObligation(investment)) })}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {selected && <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">{t("repaymentPlan.principal")}</p><p className="mt-1 font-semibold">{formatCurrency(Number(selected.amount))}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("repaymentPlan.expectedReturn")}</p><p className="mt-1 font-semibold">{formatCurrency(Number(selected.expected_return))}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("repaymentDashboard.remaining")}</p><p className="mt-1 font-bold text-primary">{formatCurrency(remaining)}</p></div>
            </div>}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="plan-count">{t("repaymentPlan.installments")}</Label><Input id="plan-count" type="number" min={1} max={60} value={installmentCount} onChange={(event) => setInstallmentCount(Number(event.target.value))} required /></div>
              <div className="space-y-2"><Label htmlFor="plan-first-date">{t("repaymentPlan.firstDate")}</Label><Input id="plan-first-date" type="date" value={firstDate} onChange={(event) => setFirstDate(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="plan-interval">{t("repaymentPlan.intervalMonths")}</Label><Input id="plan-interval" type="number" min={1} max={12} value={intervalMonths} onChange={(event) => setIntervalMonths(Number(event.target.value))} required /></div>
            </div>

            <div className="space-y-2"><Label>{t("adminForm.paymentMethod")}</Label><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem><SelectItem value="card">{t("payment.card")}</SelectItem><SelectItem value="paypal">{t("payment.paypal")}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="plan-notes">{t("adminForm.internalNotes")}</Label><Textarea id="plan-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">{t("repaymentPlan.previewTitle")}</p>
              <p className="mt-1 text-muted-foreground">{t("repaymentPlan.preview", { count: installmentCount, amount: formatCurrency(averageInstallment), first: firstDate ? formatDate(firstDate + "T00:00:00", { dateStyle: "medium" }) : "—", last: lastDate ? formatDate(lastDate + "T00:00:00", { dateStyle: "medium" }) : "—" })}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("repaymentPlan.roundingNotice")}</p>
            </div>

            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>{t("common.cancel")}</Button><Button type="submit" disabled={pending || !investmentId || !firstDate || installmentCount < 1}><Save className="h-4 w-4" />{pending ? t("common.saving") : t("repaymentPlan.createAction")}</Button></DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminRepaymentPlanDialog;
