import { FileCheck2, ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/i18n/format";
import type { ProjectCostItem, ProjectFaq, ProjectFieldChange, ProjectMilestone } from "@/services/projectsService";

const fileFields = new Set(["cover_image", "business_plan", "financial_projections", "ownership_proof"]);

const fieldTranslation: Record<string, string> = {
  location_governorate: "adminForm.governorate",
  faqs: "projects.projectFaqTitle",
  video_url: "adminForm.videoUrl",
  cost_items: "projects.costTable",
  milestones: "projects.timeline",
  images: "adminForm.galleryImages",
  supporting_documents: "adminForm.supportingDocuments",
  cover_image: "projects.coverImage",
  business_plan: "projects.businessPlan",
  financial_projections: "projects.financialProjections",
  ownership_proof: "projects.ownershipProof",
};

const CostItems = ({ value }: { value: unknown }) => {
  const { t } = useTranslation();
  const items = Array.isArray(value) ? value as ProjectCostItem[] : [];
  if (!items.length) return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  const total = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_cost), 0);
  return <div className="overflow-x-auto rounded-lg border bg-card">
    <table className="w-full min-w-[480px] text-sm">
      <thead className="bg-muted/60 text-muted-foreground"><tr>
        <th className="px-3 py-2 text-start">{t("projects.costDescription")}</th>
        <th className="px-3 py-2 text-end">{t("projects.quantity")}</th>
        <th className="px-3 py-2 text-end">{t("projects.unitCost")}</th>
        <th className="px-3 py-2 text-end">{t("projects.lineTotal")}</th>
      </tr></thead>
      <tbody>{items.map((item, index) => <tr className="border-t" key={`${item.name}-${index}`}>
        <td className="px-3 py-2">{item.description || item.name}</td>
        <td className="px-3 py-2 text-end">{formatNumber(item.quantity)}</td>
        <td className="px-3 py-2 text-end">{formatCurrency(item.unit_cost)}</td>
        <td className="px-3 py-2 text-end font-medium">{formatCurrency(Number(item.quantity) * Number(item.unit_cost))}</td>
      </tr>)}</tbody>
      <tfoot><tr className="border-t bg-muted/30 font-semibold"><td className="px-3 py-2" colSpan={3}>{t("projects.costTotal")}</td><td className="px-3 py-2 text-end">{formatCurrency(total)}</td></tr></tfoot>
    </table>
  </div>;
};

const Milestones = ({ value }: { value: unknown }) => {
  const { t } = useTranslation();
  const items = Array.isArray(value) ? value as ProjectMilestone[] : [];
  if (!items.length) return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  return <div className="space-y-2">{[...items].sort((a, b) => Number(a.order) - Number(b.order)).map((item, index) =>
    <div className="rounded-lg border bg-card p-3" key={item.id || `${item.title}-${index}`}>
      <p className="text-xs font-medium text-primary">{t("projects.milestoneNumber", { number: index + 1 })}</p>
      <p className="font-semibold">{item.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{t("projects.targetDate")}: <strong className="text-foreground">{formatDate(item.target_date)}</strong></span>
        <span>{t("projects.projectPercentage")}: <strong className="text-foreground">{formatPercent(Number(item.percentage_of_project))}</strong></span>
      </div>
      {item.deliverables && <p className="mt-2 text-xs"><span className="font-medium">{t("projects.deliverables")}:</span> {item.deliverables}</p>}
    </div>)}</div>;
};

const Faqs = ({ value }: { value: unknown }) => {
  const { t } = useTranslation();
  const items = Array.isArray(value) ? value as ProjectFaq[] : [];
  if (!items.length) return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  return <div className="space-y-2">{items.map((item, index) => <div className="rounded-lg border bg-card p-3" key={`${item.question}-${index}`}>
    <p className="font-medium">{t("projects.faqNumber", { number: index + 1 })}: {item.question}</p>
    <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
  </div>)}</div>;
};

const AssetList = ({ field, value }: { field: "images" | "supporting_documents"; value: unknown }) => {
  const { t } = useTranslation();
  const items = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
  if (!items.length) return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  const Icon = field === "images" ? ImageIcon : FileCheck2;
  return <div className="space-y-2">{items.map((item, index) => <div className="flex items-center gap-2 rounded-lg border bg-card p-3" key={index}>
    <Icon className="h-4 w-4 shrink-0 text-primary" />
    <span className="text-sm">{String(item.alt_text || item.title || t(field === "images" ? "adminForm.galleryImage" : "adminForm.supportingDocuments"))}</span>
  </div>)}</div>;
};

const ScalarValue = ({ field, value }: { field: string; value: unknown }) => {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
    return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  }
  if (fileFields.has(field) && typeof value === "boolean") {
    return <p className="flex items-center gap-2 text-sm"><FileCheck2 className="h-4 w-4 text-success" />{t(value ? "projects.updateFileAdded" : "common.empty")}</p>;
  }
  if (typeof value === "boolean") return <p className="text-sm">{t(value ? "common.yes" : "common.no")}</p>;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return <p className="text-sm">{String(record.name || record.title || record.label || t("common.empty"))}</p>;
  }
  return <p className="whitespace-pre-wrap break-words text-sm">{String(value)}</p>;
};

const ChangeValue = ({ field, value }: { field: string; value: unknown }) => {
  if (field === "cost_items") return <CostItems value={value} />;
  if (field === "milestones") return <Milestones value={value} />;
  if (field === "faqs") return <Faqs value={value} />;
  if (field === "images" || field === "supporting_documents") return <AssetList field={field} value={value} />;
  return <ScalarValue field={field} value={value} />;
};

const ProjectUpdateChange = ({ field, change }: { field: string; change: ProjectFieldChange }) => {
  const { t } = useTranslation();
  const label = fieldTranslation[field]
    ? t(fieldTranslation[field])
    : t(`projectFields.${field}`, { defaultValue: field.replace(/_/g, " ") });
  return <section className="rounded-xl border border-border bg-muted/25 p-4">
    <h4 className="font-semibold capitalize text-foreground">{label}</h4>
    <div className="mt-3 grid gap-4 xl:grid-cols-2">
      <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("projects.before")}</p><ChangeValue field={field} value={change.before} /></div>
      <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">{t("projects.after")}</p><ChangeValue field={field} value={change.after} /></div>
    </div>
  </section>;
};

export default ProjectUpdateChange;
