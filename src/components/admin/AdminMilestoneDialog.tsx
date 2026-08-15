import { useTranslation } from "react-i18next";
import { FormEvent, useEffect, useState } from "react";
import { Flag, Save } from "lucide-react";
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
  AdminMilestone,
  AdminMilestonePayload,
  AdminProjectOption,
} from "@/services/adminFinanceService";

interface AdminMilestoneDialogProps {
  open: boolean;
  milestone: AdminMilestone | null;
  projects: AdminProjectOption[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminMilestonePayload) => void;
}

const blankForm: AdminMilestonePayload = {
  project: "",
  title: "",
  description: "",
  target_date: "",
  actual_completion_date: null,
  status: "pending",
  deliverables: "",
  percentage_of_project: "0",
  funding_released: "0",
  order: 0,
};

const AdminMilestoneDialog = ({
  open,
  milestone,
  projects,
  pending,
  onOpenChange,
  onSubmit,
}: AdminMilestoneDialogProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AdminMilestonePayload>(blankForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      milestone
        ? {
            project: milestone.project,
            title: milestone.title,
            description: milestone.description,
            target_date: milestone.target_date,
            actual_completion_date: milestone.actual_completion_date,
            status: milestone.status,
            deliverables: milestone.deliverables || "",
            percentage_of_project: milestone.percentage_of_project,
            funding_released: milestone.funding_released || "0",
            order: milestone.order,
          }
        : blankForm,
    );
  }, [milestone, open]);

  const update = <K extends keyof AdminMilestonePayload>(
    key: K,
    value: AdminMilestonePayload[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.project || !form.title.trim() || !form.description.trim() || !form.target_date) return;
    const payload: AdminMilestonePayload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      actual_completion_date: form.actual_completion_date || null,
      deliverables: form.deliverables?.trim(),
      order: Number(form.order) || 0,
    };
    delete payload.funding_released;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Flag className="h-5 w-5" />
          </div>
          <DialogTitle>{t(milestone ? "adminForm.editMilestone" : "adminForm.createMilestone")}</DialogTitle>
          <DialogDescription>
            {t("adminForm.milestoneHelp")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="milestone-project">{t("adminForm.projectRequired")}</Label>
              <Select value={form.project} onValueChange={(value) => update("project", value)}>
                <SelectTrigger id="milestone-project"><SelectValue placeholder={t("adminForm.selectProject")} /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="milestone-title">{t("adminForm.title")}</Label>
              <Input
                id="milestone-title"
                maxLength={120}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="milestone-description">{t("adminForm.description")}</Label>
              <Textarea
                id="milestone-description"
                rows={4}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">{t("adminForm.targetDate")}</Label>
              <Input
                id="target-date"
                type="date"
                value={form.target_date}
                onChange={(event) => update("target_date", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completion-date">{t("adminForm.actualCompletion")}</Label>
              <Input
                id="completion-date"
                type="date"
                value={form.actual_completion_date || ""}
                onChange={(event) => update("actual_completion_date", event.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-status">{t("adminForm.status")}</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value as AdminMilestone["status"])}
              >
                <SelectTrigger id="milestone-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                  <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  <SelectItem value="delayed">{t("status.delayed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-order">{t("adminForm.displayOrder")}</Label>
              <Input
                id="milestone-order"
                type="number"
                min="0"
                value={form.order}
                onChange={(event) => update("order", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-percent">{t("adminForm.projectPercentage")}</Label>
              <Input
                id="milestone-percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.percentage_of_project}
                onChange={(event) => update("percentage_of_project", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funding-released">{t("adminForm.fundingReleasedUsd")}</Label>
              <Input
                id="funding-released"
                type="number"
                min="0"
                step="0.01"
                value={form.funding_released || ""}
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">{t("funds.releaseOnlyThroughRequests")}</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="milestone-deliverables">{t("adminForm.deliverables")}</Label>
              <Textarea
                id="milestone-deliverables"
                rows={3}
                value={form.deliverables || ""}
                onChange={(event) => update("deliverables", event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending || !form.project || !form.title.trim() || !form.description.trim() || !form.target_date}
            >
              <Save className="h-4 w-4" />
              {pending ? t("common.saving") : t("adminForm.saveMilestone")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMilestoneDialog;
