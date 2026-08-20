import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/i18n/format";
import type { EligibleRepaymentInvestment, RepaymentPlan, RepaymentPlanInstallment } from "@/services/repaymentService";

interface Props {
  open: boolean;
  investments: EligibleRepaymentInvestment[];
  plan?: RepaymentPlan | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { investment: string; notes: string; installments: RepaymentPlanInstallment[] }) => void;
}

const emptyInstallment = (date = ""): RepaymentPlanInstallment => ({
  amount: "",
  scheduled_date: date,
  payment_method: "bank_transfer",
  notes: "",
});

const RepaymentPlanSubmissionDialog = ({ open, investments, plan, pending, onOpenChange, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [investmentId, setInvestmentId] = useState("");
  const [notes, setNotes] = useState("");
  const [installments, setInstallments] = useState<RepaymentPlanInstallment[]>([emptyInstallment()]);
  const [platformFeeDate, setPlatformFeeDate] = useState("");

  const selected = useMemo<EligibleRepaymentInvestment | undefined>(() => {
    if (plan) return {
      id: plan.investment,
      investor_id: plan.investor_id,
      investor_name: plan.investor_name,
      project_id: plan.project_id,
      project_title: plan.project_title,
      principal: plan.principal,
      expected_return: plan.expected_return,
      obligation_total: plan.obligation_total,
      platform_fee: plan.platform_fee,
      total_with_platform_fee: plan.total_with_platform_fee,
      earliest_repayment_date: "",
    };
    return investments.find((item) => item.id === investmentId);
  }, [investmentId, investments, plan]);

  useEffect(() => {
    if (!open) return;
    const initial = plan ? plan.investment : investments[0]?.id || "";
    setInvestmentId(initial);
    setNotes(plan?.notes || "");
    setInstallments(plan?.installments.filter((item) => item.recipient !== "platform").map((item) => ({
      amount: item.amount,
      recipient: "investor",
      scheduled_date: item.scheduled_date,
      payment_method: item.payment_method,
      notes: item.notes || "",
    })) || [emptyInstallment(investments[0]?.earliest_repayment_date || "")]);
    setPlatformFeeDate(
      plan?.installments.find((item) => item.recipient === "platform")?.scheduled_date
      || investments[0]?.earliest_repayment_date
      || "",
    );
  }, [open, plan, investments]);

  const selectedOption = investments.find((item) => item.id === investmentId);
  const earliestDate = plan ? "" : selectedOption?.earliest_repayment_date || "";
  const proposedCents = installments.reduce((total, item) => total + Math.round(Number(item.amount || 0) * 100), 0);
  const requiredCents = Math.round(Number(selected?.obligation_total || 0) * 100);
  const totalsMatch = proposedCents === requiredCents && requiredCents > 0;

  const updateInstallment = <K extends keyof RepaymentPlanInstallment>(index: number, key: K, value: RepaymentPlanInstallment[K]) => {
    setInstallments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!investmentId || !totalsMatch || !platformFeeDate || installments.some((item) => !item.amount || !item.scheduled_date)) return;
    onSubmit({
      investment: investmentId,
      notes: notes.trim(),
      installments: [
        ...installments.map((item) => ({ ...item, recipient: "investor" as const })),
        {
          amount: selected!.platform_fee,
          recipient: "platform",
          scheduled_date: platformFeeDate,
          payment_method: "bank_transfer",
          notes: t("repaymentPlanSubmission.platformFeeNotes"),
        },
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t(plan ? "repaymentPlanSubmission.fixTitle" : "repaymentPlanSubmission.title")}</DialogTitle>
          <DialogDescription>{t("repaymentPlanSubmission.help")}</DialogDescription>
        </DialogHeader>
        {!plan && investments.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("repaymentPlanSubmission.noneEligible")}
          </div>
        ) : <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label>{t("repaymentPlanSubmission.investorAccount")}</Label>
            {plan ? <div className="rounded-xl border bg-muted/30 p-4"><p className="font-semibold">{plan.investor_name}</p><p className="text-sm text-muted-foreground">{plan.project_title}</p></div> : (
              <Select value={investmentId} onValueChange={(value) => { setInvestmentId(value); const option = investments.find((item) => item.id === value); setInstallments([emptyInstallment(option?.earliest_repayment_date || "")]); setPlatformFeeDate(option?.earliest_repayment_date || ""); }}>
                <SelectTrigger><SelectValue placeholder={t("repaymentPlanSubmission.selectInvestor")} /></SelectTrigger>
                <SelectContent>{investments.map((item) => <SelectItem key={item.id} value={item.id}>{item.investor_name} · {item.project_title} · {formatCurrency(item.obligation_total)}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>

          {selected && <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-4">
            <div><p className="text-muted-foreground">{t("repaymentPlan.principal")}</p><p className="font-semibold">{formatCurrency(selected.principal)}</p></div>
            <div><p className="text-muted-foreground">{t("repaymentPlan.expectedReturn")}</p><p className="font-semibold">{formatCurrency(selected.expected_return)}</p></div>
            <div><p className="text-muted-foreground">{t("repaymentPlanSubmission.requiredTotal")}</p><p className="font-bold text-primary">{formatCurrency(selected.obligation_total)}</p></div>
            <div><p className="text-muted-foreground">{t("repaymentPlanSubmission.totalWithPlatformFee")}</p><p className="font-bold text-primary">{formatCurrency(selected.total_with_platform_fee)}</p></div>
          </div>}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><Label>{t("repaymentPlanSubmission.installments")}</Label><Button type="button" variant="outline" size="sm" onClick={() => setInstallments((current) => [...current, emptyInstallment(earliestDate)])}><Plus className="h-4 w-4" />{t("repaymentPlanSubmission.addDate")}</Button></div>
            {installments.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <div className="space-y-1"><Label htmlFor={`repayment-amount-${index}`}>{t("common.amount")}</Label><Input id={`repayment-amount-${index}`} type="number" min="0.01" step="0.01" value={item.amount} onChange={(event) => updateInstallment(index, "amount", event.target.value)} required /></div>
              <div className="space-y-1"><Label htmlFor={`repayment-date-${index}`}>{t("adminForm.scheduledDate")}</Label><Input id={`repayment-date-${index}`} type="date" min={earliestDate || undefined} value={item.scheduled_date} onChange={(event) => updateInstallment(index, "scheduled_date", event.target.value)} required /></div>
              <div className="space-y-1"><Label>{t("adminForm.paymentMethod")}</Label><Select value={item.payment_method} onValueChange={(value) => updateInstallment(index, "payment_method", value as RepaymentPlanInstallment["payment_method"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem><SelectItem value="card">{t("payment.card")}</SelectItem><SelectItem value="paypal">{t("payment.paypal")}</SelectItem></SelectContent></Select></div>
              <Button className="self-end" type="button" size="icon" variant="ghost" disabled={installments.length === 1} onClick={() => setInstallments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /><span className="sr-only">{t("common.delete")}</span></Button>
              <div className="space-y-1 sm:col-span-4"><Label htmlFor={`repayment-notes-${index}`}>{t("repaymentPlanSubmission.installmentNotes")}</Label><Input id={`repayment-notes-${index}`} value={item.notes || ""} onChange={(event) => updateInstallment(index, "notes", event.target.value)} /></div>
            </div>)}
          </div>

          {selected && <div className="space-y-3 rounded-xl border-2 border-primary/25 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold">{t("repaymentPlanSubmission.platformFeeTitle")}</p><p className="mt-1 text-xs text-muted-foreground">{t("repaymentPlanSubmission.platformFeeHelp")}</p></div>
              <p className="text-xl font-bold text-primary">{formatCurrency(selected.platform_fee)}</p>
            </div>
            <div className="space-y-1"><Label htmlFor="platform-fee-date">{t("repaymentPlanSubmission.platformFeeDate")}</Label><Input id="platform-fee-date" type="date" min={earliestDate || undefined} value={platformFeeDate} onChange={(event) => setPlatformFeeDate(event.target.value)} required /></div>
          </div>}

          <div className={`rounded-xl border p-4 text-sm ${totalsMatch ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
            {t("repaymentPlanSubmission.totalCheck", { proposed: formatCurrency(proposedCents / 100), required: formatCurrency(requiredCents / 100) })}
          </div>
          <div className="space-y-2"><Label>{t("repaymentPlanSubmission.planNotes")}</Label><Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button><Button type="submit" disabled={pending || !investmentId || !totalsMatch || !platformFeeDate}><Send className="h-4 w-4" />{pending ? t("common.saving") : t("repaymentPlanSubmission.submit")}</Button></DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
};

export default RepaymentPlanSubmissionDialog;
