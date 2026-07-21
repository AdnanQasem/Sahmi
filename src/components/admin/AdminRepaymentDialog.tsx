import { FormEvent, useEffect, useState } from "react";
import { HandCoins, Save } from "lucide-react";
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
import type {
  AdminInvestment,
  AdminRepayment,
  AdminRepaymentPayload,
} from "@/services/adminFinanceService";

interface AdminRepaymentDialogProps {
  open: boolean;
  repayment: AdminRepayment | null;
  investments: AdminInvestment[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminRepaymentPayload) => void;
}

const blankForm: AdminRepaymentPayload = {
  investment: "",
  amount: "",
  scheduled_date: "",
  actual_payment_date: null,
  status: "pending",
  payment_method: "bank_transfer",
  transaction_id: "",
  notes: "",
};

const investmentLabel = (investment: AdminInvestment) => {
  const investor =
    investment.investor_detail?.full_name ||
    investment.investor_detail?.email ||
    investment.investor_name ||
    "Investor";
  const project = investment.project_detail?.title || "Project";
  return investor + " · " + project + " · $" + Number(investment.amount).toLocaleString();
};

const AdminRepaymentDialog = ({
  open,
  repayment,
  investments,
  pending,
  onOpenChange,
  onSubmit,
}: AdminRepaymentDialogProps) => {
  const [form, setForm] = useState<AdminRepaymentPayload>(blankForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      repayment
        ? {
            investment: repayment.investment,
            amount: repayment.amount,
            scheduled_date: repayment.scheduled_date,
            actual_payment_date: repayment.actual_payment_date,
            status: repayment.status,
            payment_method: repayment.payment_method,
            transaction_id: repayment.transaction_id || "",
            notes: repayment.notes || "",
          }
        : blankForm,
    );
  }, [open, repayment]);

  const update = <K extends keyof AdminRepaymentPayload>(
    key: K,
    value: AdminRepaymentPayload[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.investment || !form.amount || !form.scheduled_date) return;
    onSubmit({
      ...form,
      actual_payment_date: form.actual_payment_date || null,
      transaction_id: form.transaction_id?.trim(),
      notes: form.notes?.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <HandCoins className="h-5 w-5" />
          </div>
          <DialogTitle>{repayment ? "Edit repayment" : "Create repayment"}</DialogTitle>
          <DialogDescription>
            Schedule a return or record the final payment details for an investment.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="repayment-investment">Investment *</Label>
            <Select value={form.investment} onValueChange={(value) => update("investment", value)}>
              <SelectTrigger id="repayment-investment"><SelectValue placeholder="Select investment" /></SelectTrigger>
              <SelectContent>
                {investments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id}>
                    {investmentLabel(investment)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repayment-amount">Amount (USD)</Label>
              <Input
                id="repayment-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => update("amount", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Scheduled date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={form.scheduled_date}
                onChange={(event) => update("scheduled_date", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repayment-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value as AdminRepayment["status"])}
              >
                <SelectTrigger id="repayment-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-payment-date">Actual payment</Label>
              <Input
                id="actual-payment-date"
                type="date"
                value={form.actual_payment_date || ""}
                onChange={(event) => update("actual_payment_date", event.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repayment-payment-method">Payment method</Label>
              <Select
                value={form.payment_method}
                onValueChange={(value) =>
                  update("payment_method", value as AdminRepayment["payment_method"])
                }
              >
                <SelectTrigger id="repayment-payment-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repayment-transaction">Transaction ID</Label>
              <Input
                id="repayment-transaction"
                maxLength={120}
                value={form.transaction_id || ""}
                onChange={(event) => update("transaction_id", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repayment-notes">Internal notes</Label>
            <Textarea
              id="repayment-notes"
              rows={4}
              value={form.notes || ""}
              onChange={(event) => update("notes", event.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !form.investment || !form.amount || !form.scheduled_date}
            >
              <Save className="h-4 w-4" />
              {pending ? "Saving..." : "Save repayment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRepaymentDialog;
