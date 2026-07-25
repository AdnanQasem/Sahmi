import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminProject, AdminProjectPayload } from "@/services/adminProjectsService";
import type { AdminProjectSectionProps } from "./AdminProjectFormTypes";

const decimalFields: Array<{
  key: keyof AdminProjectPayload;
  labelKey: string;
  min?: string;
  max?: string;
}> = [
  { key: "goal_amount", labelKey: "adminForm.fundingGoal", min: "0.01" },
  { key: "funded_amount", labelKey: "adminForm.fundedAmount" },
  { key: "minimum_investment", labelKey: "adminForm.minimumInvestment", min: "0.01" },
  { key: "expected_roi", labelKey: "adminForm.expectedRoiPercent", max: "100" },
  { key: "total_repaid", labelKey: "adminForm.totalRepaid" },
  { key: "rating", labelKey: "adminForm.rating", max: "5" },
];

const counterFields: Array<{ key: keyof AdminProjectPayload; labelKey: string }> = [
  { key: "milestone_count", labelKey: "adminForm.milestoneCount" },
  { key: "view_count", labelKey: "adminForm.viewCount" },
  { key: "investor_count", labelKey: "adminForm.investorCount" },
  { key: "reviews_count", labelKey: "adminForm.reviewCount" },
];

const AdminProjectFinanceFields = ({ form, update, errors }: AdminProjectSectionProps) => {
  const { t } = useTranslation();
  return (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-foreground">{t("adminForm.financeControls")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("adminForm.financeHelp")}
      </p>
    </div>
    <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <p className="text-muted-foreground">
        These values affect what investors see. Changing funded and repaid totals does not create
        matching transaction records.
      </p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {decimalFields.map((field) => (
        <div className="space-y-2" key={field.key}>
          <Label htmlFor={"admin-project-" + field.key}>{t(field.labelKey)}</Label>
          <Input
            id={"admin-project-" + field.key}
            type="number"
            min={field.min || "0"}
            max={field.max}
            step="0.01"
            value={String(form[field.key] ?? "")}
            onChange={(event) => update(field.key, event.target.value)}
            required
          />
          {errors[field.key] ? (
            <p className="text-xs font-medium text-destructive">{errors[field.key]}</p>
          ) : null}
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="admin-project-period">{t("adminForm.fundingPeriod")}</Label>
        <Input
          id="admin-project-period"
          type="number"
          min="1"
          value={form.funding_period_days || 1}
          onChange={(event) => update("funding_period_days", Number(event.target.value))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-start">{t("adminForm.startDate")}</Label>
        <Input
          id="admin-project-start"
          type="datetime-local"
          value={form.start_date || ""}
          onChange={(event) => update("start_date", event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-end">{t("adminForm.endDate")}</Label>
        <Input
          id="admin-project-end"
          type="datetime-local"
          value={form.end_date || ""}
          onChange={(event) => update("end_date", event.target.value || null)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-status">{t("adminForm.campaignStatus")}</Label>
        <Select
          value={form.status || "draft"}
          onValueChange={(value) => update("status", value as AdminProject["status"])}
        >
          <SelectTrigger id="admin-project-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{t("status.draft")}</SelectItem>
            <SelectItem value="active">{t("status.active")}</SelectItem>
            <SelectItem value="paused">{t("status.paused")}</SelectItem>
            <SelectItem value="closed">{t("status.closed")}</SelectItem>
            <SelectItem value="successful">{t("status.successful")}</SelectItem>
            <SelectItem value="failed">{t("status.failed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-repayment-status">{t("adminForm.repaymentStatus")}</Label>
        <Select
          value={form.repayment_status || "on_track"}
          onValueChange={(value) =>
            update("repayment_status", value as AdminProject["repayment_status"])
          }
        >
          <SelectTrigger id="admin-project-repayment-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="on_track">{t("status.on_track")}</SelectItem>
            <SelectItem value="delayed">{t("status.delayed")}</SelectItem>
            <SelectItem value="completed">{t("status.completed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-next-repayment">{t("adminForm.nextRepayment")}</Label>
        <Input
          id="admin-project-next-repayment"
          type="date"
          value={form.next_repayment_date || ""}
          onChange={(event) => update("next_repayment_date", event.target.value || null)}
        />
      </div>
      {counterFields.map((field) => (
        <div className="space-y-2" key={field.key}>
          <Label htmlFor={"admin-project-" + field.key}>{t(field.labelKey)}</Label>
          <Input
            id={"admin-project-" + field.key}
            type="number"
            min="0"
            value={Number(form[field.key] || 0)}
            onChange={(event) => update(field.key, Number(event.target.value))}
          />
        </div>
      ))}
    </div>
  </div>
  );
};

export default AdminProjectFinanceFields;
