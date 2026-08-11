import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/i18n/format";
import type { ProjectMilestone } from "@/services/projectsService";

const ProjectTimeline = ({ milestones }: { milestones: ProjectMilestone[] }) => {
  const { t } = useTranslation();
  if (!milestones.length) {
    return <p className="text-sm text-muted-foreground">{t("projects.noMilestones")}</p>;
  }

  return (
    <div className="space-y-4">
      {[...milestones]
        .sort((left, right) => left.order - right.order)
        .map((milestone, index) => {
          const completed = milestone.status === "completed";
          return (
            <article key={milestone.id ?? `${milestone.title}-${index}`} className="relative flex gap-4">
              {index < milestones.length - 1 ? (
                <div className="absolute bottom-[-1rem] start-[1.1rem] top-9 w-px bg-border" />
              ) : null}
              <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${completed ? "bg-success text-success-foreground" : "bg-primary-light text-primary"}`}>
                {completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-primary">{t("projects.milestoneNumber", { number: index + 1 })}</p>
                    <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                  </div>
                  <Badge variant={completed ? "success" : "muted"}>
                    {t(`status.${milestone.status ?? "pending"}`)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p>
                {milestone.deliverables ? (
                  <p className="mt-2 text-sm"><span className="font-medium">{t("projects.deliverables")}:</span> {milestone.deliverables}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(milestone.target_date)}</span>
                  <span>{t("projects.projectPercentage")}: {Number(milestone.percentage_of_project).toFixed(2)}%</span>
                </div>
              </div>
            </article>
          );
        })}
    </div>
  );
};

export default ProjectTimeline;
