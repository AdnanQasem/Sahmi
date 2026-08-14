import { useTranslation } from "react-i18next";
import { FormEvent, useEffect, useState } from "react";
import { CircleDollarSign, Save } from "lucide-react";
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
  AdminInvestmentPayload,
  AdminProjectOption,
  AdminUserOption,
} from "@/services/adminFinanceService";

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
  quantity: 1,
  status: "pending",
  transaction_id: "",
  payment_method: "bank_transfer",
  expected_return: "",
  actual_return: "",
  return_received_at: null,
  notes: "",
};

const toLocalDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 16);
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
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
            quantity: investment.quantity,
            status: investment.status,
            transaction_id: investment.transaction_id || "",
            payment_method: investment.payment_method,
            expected_return: investment.expected_return || "",
            actual_return: investment.actual_return || "",
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
      quantity: Number(form.quantity) || 1,
      return_received_at: form.return_received_at || null,
      transaction_id: form.transaction_id?.trim(),
      notes: form.notes?.trim(),
    };
    if (payload.expected_return === "") delete payload.expected_return;
    if (payload.actual_return === "") delete payload.actual_return;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <DialogTitle>{t(investment ? "adminForm.editInvestment" : "adminForm.createInvestment")}</DialogTitle>
          <DialogDescription>
            {t("adminForm.investmentHelp")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="investment-investor">{t("adminForm.investorRequired")}</Label>
              <Select value={form.investor} onValueChange={(value) => update("investor", value)}>
                <SelectTrigger id="investment-investor"><SelectValue placeholder={t("adminForm.selectInvestor")} /></SelectTrigger>
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
              <Select value={form.project} onValueChange={(value) => update("project", value)}>
                <SelectTrigger id="investment-project"><SelectValue placeholder={t("adminForm.selectProject")} /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
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
              <Label htmlFor="investment-quantity">{t("adminForm.quantity")}</Label>
              <Input
                id="investment-quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => update("quantity", Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment-status">{t("adminForm.status")}</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value as AdminInvestment["status"])}
              >
                <SelectTrigger id="investment-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                  <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  <SelectItem value="canceled">{t("status.canceled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment-payment-method">{t("adminForm.paymentMethod")}</Label>
              <Select
                value={form.payment_method}
                onValueChange={(value) =>
                  update("payment_method", value as AdminInvestment["payment_method"])
                }
              >
                <SelectTrigger id="investment-payment-method"><SelectValue /></SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="actual-return">{t("adminForm.actualReturn")}</Label>
              <Input
                id="actual-return"
                type="number"
                min="0"
                step="0.01"
                value={form.actual_return || ""}
                onChange={(event) => update("actual_return", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-id">{t("adminForm.transactionId")}</Label>
              <Input
                id="transaction-id"
                maxLength={120}
                value={form.transaction_id || ""}
                onChange={(event) => update("transaction_id", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-date">{t("adminForm.returnReceived")}</Label>
              <Input
                id="return-date"
                type="datetime-local"
                value={form.return_received_at || ""}
                onChange={(event) => update("return_received_at", event.target.value || null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="investment-notes">{t("adminForm.internalNotes")}</Label>
            <Textarea
              id="investment-notes"
              rows={4}
              value={form.notes || ""}
              onChange={(event) => update("notes", event.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending || !form.investor || !form.project || !form.amount}>
              <Save className="h-4 w-4" />
              {pending ? t("common.saving") : t("adminForm.saveInvestment")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminInvestmentDialog;
