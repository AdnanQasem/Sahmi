import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatPercent } from "@/i18n/format";
import type { Project, ProjectCostItem, ProjectMilestone } from "@/services/projectsService";

interface Props { project: Project; isEditReview?: boolean; }

const asCostItems = (value: unknown): ProjectCostItem[] => Array.isArray(value) ? value as ProjectCostItem[] : [];
const asMilestones = (value: unknown): ProjectMilestone[] => Array.isArray(value) ? value as ProjectMilestone[] : [];

const CostTable = ({ value }: { value: unknown }) => {
  const { t } = useTranslation();
  const items = asCostItems(value);
  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0);
  if (!items.length) return <p className="py-3 text-sm text-muted-foreground">{t("projects.noCostItems")}</p>;
  return <div className="overflow-x-auto rounded-xl border">
    <table className="w-full min-w-[560px] text-sm">
      <thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr>
        <th className="px-3 py-2 text-start">{t("projects.costItemNumber")}</th>
        <th className="px-3 py-2 text-start">{t("projects.costDescription")}</th>
        <th className="px-3 py-2 text-end">{t("projects.quantity")}</th>
        <th className="px-3 py-2 text-end">{t("projects.unitCost")}</th>
        <th className="px-3 py-2 text-end">{t("projects.lineTotal")}</th>
      </tr></thead>
      <tbody>{items.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const unitCost = Number(item.unit_cost || 0);
        return <tr key={`${item.name}-${index}`} className="border-t">
          <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
          <td className="px-3 py-2"><p className="font-medium">{item.name || item.description}</p>{item.name && item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}</td>
          <td className="px-3 py-2 text-end" dir="ltr">{quantity.toLocaleString()}</td>
          <td className="px-3 py-2 text-end" dir="ltr">{formatCurrency(unitCost)}</td>
          <td className="px-3 py-2 text-end font-semibold" dir="ltr">{formatCurrency(quantity * unitCost)}</td>
        </tr>;
      })}</tbody>
      <tfoot><tr className="border-t bg-muted/35 font-bold"><td className="px-3 py-3" colSpan={4}>{t("projects.costTotal")}</td><td className="px-3 py-3 text-end" dir="ltr">{formatCurrency(total)}</td></tr></tfoot>
    </table>
  </div>;
};

const Timeline = ({ value }: { value: unknown }) => {
  const { t } = useTranslation();
  const milestones = asMilestones(value).slice().sort((a, b) => Number(a.order) - Number(b.order));
  if (!milestones.length) return <p className="py-3 text-sm text-muted-foreground">{t("projects.noMilestones")}</p>;
  return <div className="space-y-3">{milestones.map((milestone, index) => (
    <div key={milestone.id || `${milestone.title}-${index}`} className="relative rounded-xl border bg-card p-4 ps-12">
      <span className="absolute start-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-semibold">{milestone.title}</p><p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p></div>
        <span className="rounded-full border bg-muted px-2 py-0.5 text-xs font-medium">{t(`status.${milestone.status || "pending"}`)}</span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <span>{t("adminForm.targetDate")}: <strong className="text-foreground">{formatDate(milestone.target_date, { dateStyle: "medium" })}</strong></span>
        <span>{t("adminForm.projectPercentage")}: <strong className="text-foreground">{formatPercent(Number(milestone.percentage_of_project || 0))}</strong></span>
        <span>{t("adminForm.fundingReleasedUsd")}: <strong className="text-foreground">{formatCurrency(Number(milestone.funding_released || 0))}</strong></span>
      </div>
      {milestone.actual_completion_date && <p className="mt-2 text-xs text-success">{t("adminForm.actualCompletion")}: {formatDate(milestone.actual_completion_date, { dateStyle: "medium" })}</p>}
      {milestone.deliverables && <p className="mt-2 text-xs text-muted-foreground">{t("adminForm.deliverables")}: {milestone.deliverables}</p>}
    </div>
  ))}</div>;
};

const AdminProjectReviewDetails = ({ project, isEditReview = false }: Props) => {
  const { t } = useTranslation();
  const changes = project.pending_edit_request?.changes ?? {};
  const displayValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return t(value ? "common.yes" : "common.no");
    if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };
  const fields: Array<[string, string, unknown]> = [
    ["title", t("projects.projectTitle"), project.title],
    ["short_description", t("projects.shortDescription"), project.short_description],
    ["description", t("projects.fullStory"), project.description],
    ["location", t("projects.location"), project.location],
    ["location_governorate", t("projects.governorate"), project.location_governorate],
    ["goal_amount", t("projects.goalAmount"), formatCurrency(Number(project.goal_amount))],
    ["funded_amount", t("projects.funded"), formatCurrency(Number(project.funded_amount))],
    ["minimum_investment", t("projects.minimumInvestment"), formatCurrency(Number(project.minimum_investment))],
    ["expected_roi", t("projects.expectedRoi"), formatPercent(Number(project.expected_roi))],
    ["funding_period_days", t("projects.duration"), project.funding_period_days],
    ["start_date", t("adminForm.startDate"), project.start_date ? formatDate(project.start_date, { dateStyle: "medium" }) : null],
    ["end_date", t("adminForm.endDate"), project.end_date ? formatDate(project.end_date, { dateStyle: "medium" }) : null],
    ["status", t("adminForm.campaignStatus"), t(`status.${project.status}`)],
    ["is_verified", t("adminForm.verifiedProject"), project.is_verified],
    ["repayment_status", t("adminForm.repaymentStatus"), t(`status.${project.repayment_status || "on_track"}`)],
    ["investor_count", t("projects.investors"), project.investor_count],
    ["video_url", t("projects.video"), project.video_url],
    ["faqs", t("projects.projectFaqTitle"), project.faqs],
    ["cover_image", t("projects.coverImage"), project.cover_image],
    ["business_plan", t("projects.businessPlan"), project.business_plan],
    ["financial_projections", t("projects.financialProjections"), project.financial_projections],
    ["ownership_proof", t("projects.ownershipProof"), project.ownership_proof],
  ];
  const categoryChange = changes.category;
  const costChange = changes.cost_items;
  const milestoneChange = changes.milestones;

  return <div className="space-y-5">
    {isEditReview && <div className="rounded-xl border border-warning/30 bg-warning/10 p-4"><h3 className="font-semibold">{t("adminForm.requestedChanges")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("adminForm.requestedChangesHelp")}</p></div>}

    <section className={`rounded-xl border p-4 ${categoryChange ? "border-warning bg-warning/10" : "bg-muted/20"}`}>
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{t("projects.category")}</h3>{categoryChange && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">{t("adminForm.editRequested")}</span>}</div>
      {categoryChange ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">{t("adminForm.currentValue")}</p><p className="mt-1 text-sm text-foreground/70 line-through">{displayValue(categoryChange.before)}</p></div><div><p className="text-xs text-muted-foreground">{t("adminForm.proposedValue")}</p><p className="mt-1 text-sm font-semibold">{displayValue(categoryChange.after)}</p></div></div> : <p className="mt-2 text-sm font-semibold">{project.category_detail?.name || t("adminForm.uncategorized")}</p>}
    </section>

    <div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label, value]) => {
      const change = changes[key];
      return <div key={key} className={`rounded-xl border p-4 ${change ? "border-warning bg-warning/10 ring-1 ring-warning/20" : "border-border bg-muted/20"}`}>
        <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>{change && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">{t("adminForm.editRequested")}</span>}</div>
        {change ? <div className="mt-2 space-y-2 text-sm"><div><span className="text-xs text-muted-foreground">{t("adminForm.currentValue")}</span><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-foreground/70 line-through">{displayValue(change.before)}</pre></div><div><span className="text-xs text-muted-foreground">{t("adminForm.proposedValue")}</span><pre className="mt-1 whitespace-pre-wrap break-words font-sans font-medium">{displayValue(change.after)}</pre></div></div> : <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans text-sm">{displayValue(value)}</pre>}
      </div>;
    })}</div>

    <section className={`rounded-xl border p-4 ${costChange ? "border-warning bg-warning/5" : "bg-muted/10"}`}><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{t("projects.costTable")}</h3>{costChange && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">{t("adminForm.editRequested")}</span>}</div>{costChange ? <div className="grid gap-4 xl:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">{t("adminForm.currentValue")}</p><CostTable value={costChange.before}/></div><div><p className="mb-2 text-xs font-semibold text-muted-foreground">{t("adminForm.proposedValue")}</p><CostTable value={costChange.after}/></div></div> : <CostTable value={project.cost_items}/>}</section>

    <section className={`rounded-xl border p-4 ${milestoneChange ? "border-warning bg-warning/5" : "bg-muted/10"}`}><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{t("projects.timeline")}</h3>{milestoneChange && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">{t("adminForm.editRequested")}</span>}</div>{milestoneChange ? <div className="grid gap-4 xl:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">{t("adminForm.currentValue")}</p><Timeline value={milestoneChange.before}/></div><div><p className="mb-2 text-xs font-semibold text-muted-foreground">{t("adminForm.proposedValue")}</p><Timeline value={milestoneChange.after}/></div></div> : <Timeline value={project.milestones}/>}</section>

    <p className="text-xs text-muted-foreground">{t("admin.submitted", { date: formatDate(project.pending_edit_request?.created_at || project.created_at, { dateStyle: "medium", timeStyle: "short" }) })}</p>
  </div>;
};

export default AdminProjectReviewDetails;
