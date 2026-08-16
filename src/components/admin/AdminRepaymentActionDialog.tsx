import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminRepayment } from "@/services/adminFinanceService";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { createDemoRepaymentReference, formDemoData } from "@/demo/formDemoData";

export interface PaidRepaymentPayload {
  actual_payment_date: string;
  payment_method: AdminRepayment["payment_method"];
  transaction_id: string;
  notes: string;
}

interface Props {
  repayment: AdminRepayment | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: PaidRepaymentPayload) => void;
}

const AdminRepaymentActionDialog = ({ repayment, pending, onOpenChange, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AdminRepayment["payment_method"]>("bank_transfer");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!repayment) return;
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod(repayment.payment_method);
    setTransactionId("");
    setNotes(repayment.notes || "");
  }, [repayment]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!paymentDate) return;
    onSubmit({ actual_payment_date: paymentDate, payment_method: paymentMethod, transaction_id: transactionId.trim(), notes: notes.trim() });
  };

  return (
    <Dialog open={!!repayment} onOpenChange={(open) => !pending && onOpenChange(open)}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("repaymentDashboard.recordPaid")}</DialogTitle>
          <DialogDescription>{t("repaymentDashboard.internalOnly")}</DialogDescription>
        </DialogHeader>
        <DemoFillButton onClick={() => { setTransactionId(createDemoRepaymentReference()); setNotes(formDemoData.repayment.paidNotes); }} disabled={pending} />
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label htmlFor="paid-date">{t("adminForm.actualPayment")}</Label><Input id="paid-date" type="date" max={new Date().toISOString().slice(0, 10)} value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required /></div>
          <div className="space-y-2"><Label>{t("adminForm.paymentMethod")}</Label><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as AdminRepayment["payment_method"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem><SelectItem value="card">{t("payment.card")}</SelectItem><SelectItem value="paypal">{t("payment.paypal")}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="paid-reference">{t("adminForm.transactionId")}</Label><Input id="paid-reference" maxLength={120} value={transactionId} onChange={(event) => setTransactionId(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="paid-notes">{t("adminForm.internalNotes")}</Label><Textarea id="paid-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button><Button type="submit" disabled={pending || !paymentDate}>{t("repaymentDashboard.confirmPaid")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRepaymentActionDialog;
