import { Check, Circle, Clock3, HandCoins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatPercent } from "@/i18n/format";
import type { Project, ProjectRepayment } from "@/services/projectsService";

interface Props {
  repaymentStatus?: Project["repayment_status"];
  nextRepaymentDate?: string | null;
  totalRepaid?: string;
  repayments?: ProjectRepayment[];
}

type StepState = "complete" | "current" | "upcoming";

const ProjectRepaymentProcess = ({ repaymentStatus, nextRepaymentDate, totalRepaid, repayments }: Props) => {
  const { t } = useTranslation();
  const activeRepayments = (repayments || []).filter((record) => record.status !== "cancelled");
  const paidRepayments = activeRepayments.filter((record) => record.status === "paid");
  const scheduledTotal = activeRepayments.reduce((total, record) => total + Number(record.amount), 0);
  const paidTotal = paidRepayments.reduce((total, record) => total + Number(record.amount), 0);
  const progress = scheduledTotal > 0 ? Math.min((paidTotal / scheduledTotal) * 100, 100) : 0;
  const repaymentCompleted = repaymentStatus === "completed";
  const planScheduled = repaymentCompleted
    || activeRepayments.length > 0
    || Boolean(nextRepaymentDate)
    || Number(totalRepaid || 0) > 0;

  const steps: Array<{ label: string; state: StepState }> = [
    { label: t("projects.repaymentProcess.projectCompleted"), state: "complete" },
    {
      label: t("projects.repaymentProcess.planScheduled"),
      state: planScheduled ? "complete" : "current",
    },
    {
      label: t("projects.repaymentProcess.repayingInvestors"),
      state: repaymentCompleted ? "complete" : planScheduled ? "current" : "upcoming",
    },
    {
      label: t("projects.repaymentProcess.repaymentCompleted"),
      state: repaymentCompleted ? "complete" : "upcoming",
    },
  ];

  return (
    <section className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-5" aria-label={t("projects.repaymentProcess.title")}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HandCoins className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t("projects.repaymentProcess.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("projects.repaymentProcess.description")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className={`rounded-xl border p-4 ${step.state === "current" ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step.state === "complete" ? "bg-success text-success-foreground" : step.state === "current" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step.state === "complete" ? <Check className="h-4 w-4" /> : step.state === "current" ? <Clock3 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </span>
              <Badge variant={step.state === "complete" ? "success" : step.state === "current" ? "default" : "outline"}>
                {t(`projects.repaymentProcess.states.${step.state}`)}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{index + 1}. {step.label}</p>
          </article>
        ))}
      </div>

      {activeRepayments.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">
              {t("projects.repaymentProcess.installmentsPaid", { paid: paidRepayments.length, total: activeRepayments.length })}
            </span>
            <span className="font-semibold text-primary">{formatPercent(progress)}</span>
          </div>
          <Progress value={progress} className="mt-3 h-2" aria-label={t("projects.repaymentProcess.progress")} />
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{t("repaymentDashboard.paid")}: {formatCurrency(paidTotal)}</span>
            <span>{t("repaymentDashboard.remaining")}: {formatCurrency(Math.max(scheduledTotal - paidTotal, 0))}</span>
          </div>
        </div>
      )}

      {nextRepaymentDate && !repaymentCompleted && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("projects.repaymentProcess.nextRepayment", {
            date: formatDate(nextRepaymentDate + "T00:00:00", { dateStyle: "medium" }),
          })}
        </p>
      )}
    </section>
  );
};

export default ProjectRepaymentProcess;
