import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatPercent } from "@/i18n/format";
import type { Project } from "@/services/projectsService";

interface Props { project: Project; isEditReview?: boolean; }

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const AdminProjectReviewDetails = ({ project, isEditReview = false }: Props) => {
  const { t } = useTranslation();
  const changes = project.pending_edit_request?.changes ?? {};
  const fields: Array<[string, string, unknown]> = [
    ["title", t("projects.projectTitle"), project.title],
    ["short_description", t("projects.shortDescription"), project.short_description],
    ["description", t("projects.fullStory"), project.description],
    ["category", t("projects.category"), project.category_detail?.name],
    ["location", t("projects.location"), project.location],
    ["location_governorate", t("projects.governorate"), project.location_governorate],
    ["goal_amount", t("projects.goalAmount"), formatCurrency(Number(project.goal_amount))],
    ["funded_amount", t("projects.funded"), formatCurrency(Number(project.funded_amount))],
    ["minimum_investment", t("projects.minimumInvestment"), formatCurrency(Number(project.minimum_investment))],
    ["expected_roi", t("projects.expectedRoi"), formatPercent(Number(project.expected_roi))],
    ["funding_period_days", t("projects.duration"), project.funding_period_days],
    ["start_date", t("adminForm.startDate"), project.start_date ? formatDate(project.start_date, { dateStyle: "medium" }) : null],
    ["end_date", t("adminForm.endDate"), project.end_date ? formatDate(project.end_date, { dateStyle: "medium" }) : null],
    ["status", t("adminForm.campaignStatus"), project.status],
    ["is_verified", t("adminForm.verifiedProject"), project.is_verified],
    ["repayment_status", t("adminForm.repaymentStatus"), project.repayment_status],
    ["investor_count", t("projects.investors"), project.investor_count],
    ["video_url", t("projects.video"), project.video_url],
    ["cost_items", t("projects.costTable"), project.cost_items],
    ["milestones", t("projects.timeline"), project.milestones],
    ["faqs", t("projects.projectFaqTitle"), project.faqs],
    ["cover_image", t("projects.coverImage"), project.cover_image],
    ["business_plan", t("projects.businessPlan"), project.business_plan],
    ["financial_projections", t("projects.financialProjections"), project.financial_projections],
    ["ownership_proof", t("projects.ownershipProof"), project.ownership_proof],
  ];

  return (
    <div className="space-y-4">
      {isEditReview && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <h3 className="font-semibold text-foreground">{t("adminForm.requestedChanges")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("adminForm.requestedChangesHelp")}</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([key, label, value]) => {
          const change = changes[key];
          return (
            <div key={key} className={`rounded-xl border p-4 ${change ? "border-warning bg-warning/10 ring-1 ring-warning/20" : "border-border bg-muted/20"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {change && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">{t("adminForm.editRequested")}</span>}
              </div>
              {change ? (
                <div className="mt-2 space-y-2 text-sm">
                  <div><span className="text-xs text-muted-foreground">{t("adminForm.currentValue")}</span><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-foreground/70 line-through">{displayValue(change.before)}</pre></div>
                  <div><span className="text-xs text-muted-foreground">{t("adminForm.proposedValue")}</span><pre className="mt-1 whitespace-pre-wrap break-words font-sans font-medium text-foreground">{displayValue(change.after)}</pre></div>
                </div>
              ) : <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans text-sm text-foreground">{displayValue(value)}</pre>}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t("admin.submitted", { date: formatDate(project.created_at, { dateStyle: "medium", timeStyle: "short" }) })}</p>
    </div>
  );
};

export default AdminProjectReviewDetails;
