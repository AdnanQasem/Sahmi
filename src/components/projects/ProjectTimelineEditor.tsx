import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyProjectMilestone,
  milestonePercentageTotal,
  redistributeMilestonePercentages,
  reindexProjectMilestones,
} from "@/lib/projectMilestones";
import type { ProjectMilestone } from "@/services/projectsService";

interface ProjectTimelineEditorProps {
  milestones: ProjectMilestone[];
  onChange: (milestones: ProjectMilestone[]) => void;
  error?: string;
}

const ProjectTimelineEditor = ({ milestones, onChange, error }: ProjectTimelineEditorProps) => {
  const { t } = useTranslation();

  const updateMilestone = <K extends keyof ProjectMilestone>(
    index: number,
    field: K,
    value: ProjectMilestone[K],
  ) => {
    onChange(
      reindexProjectMilestones(
        milestones.map((milestone, itemIndex) =>
          itemIndex === index ? { ...milestone, [field]: value } : milestone,
        ),
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{t("projects.timeline")}</h3>
          <p className="text-sm text-muted-foreground">{t("projects.timelineHelp")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={milestones.length >= 20}
          onClick={() =>
            onChange(
              redistributeMilestonePercentages([
                ...milestones,
                emptyProjectMilestone(milestones.length),
              ]),
            )
          }
        >
          <Plus className="h-4 w-4" />
          {t("projects.addMilestone")}
        </Button>
      </div>

      {milestones.map((milestone, index) => (
        <section key={milestone.id ?? `new-${index}`} className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {index + 1}
              </span>
              {t("projects.milestoneNumber", { number: index + 1 })}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("projects.removeMilestone", { number: index + 1 })}
              disabled={milestones.length === 1}
              onClick={() =>
                onChange(
                  redistributeMilestonePercentages(
                    milestones.filter((_, itemIndex) => itemIndex !== index),
                  ),
                )
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`milestone-title-${index}`}>{t("projects.milestoneTitle")}</Label>
              <Input
                id={`milestone-title-${index}`}
                maxLength={120}
                value={milestone.title}
                onChange={(event) => updateMilestone(index, "title", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`milestone-date-${index}`}>{t("projects.targetDate")}</Label>
              <Input
                id={`milestone-date-${index}`}
                type="date"
                value={milestone.target_date}
                onChange={(event) => updateMilestone(index, "target_date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`milestone-percentage-${index}`}>{t("projects.projectPercentage")}</Label>
              <Input
                id={`milestone-percentage-${index}`}
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={milestone.percentage_of_project}
                onChange={(event) => updateMilestone(index, "percentage_of_project", event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`milestone-description-${index}`}>{t("projects.milestoneDescription")}</Label>
              <Textarea
                id={`milestone-description-${index}`}
                rows={3}
                maxLength={2000}
                value={milestone.description}
                onChange={(event) => updateMilestone(index, "description", event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`milestone-deliverables-${index}`}>{t("projects.deliverables")}</Label>
              <Textarea
                id={`milestone-deliverables-${index}`}
                rows={2}
                maxLength={2000}
                value={milestone.deliverables}
                onChange={(event) => updateMilestone(index, "deliverables", event.target.value)}
              />
            </div>
          </div>
        </section>
      ))}

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />{t("projects.timelineAllocation")}</span>
        <span className="font-semibold text-foreground">{milestonePercentageTotal(milestones).toFixed(2)}%</span>
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
};

export default ProjectTimelineEditor;
