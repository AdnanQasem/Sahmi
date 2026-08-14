import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectDocumentField } from "@/lib/projectDocuments";
import { validateProjectDocument } from "@/lib/projectDocuments";

interface ProjectDocumentFieldsProps {
  files: Partial<Record<ProjectDocumentField, File | null>>;
  current?: Partial<Record<ProjectDocumentField, string | null>>;
  errors?: Record<string, string>;
  required?: boolean;
  onChange: (field: ProjectDocumentField, file: File | null) => void;
  onError?: (field: ProjectDocumentField, error: string | null) => void;
}

const ProjectDocumentFields = ({ files, current, errors, required, onChange, onError }: ProjectDocumentFieldsProps) => {
  const { t } = useTranslation();
  const documents: Array<{ field: ProjectDocumentField; label: string; help: string }> = [
    { field: "business_plan", label: t("projects.businessPlan"), help: t("projects.businessPlanHelp") },
    { field: "financial_projections", label: t("projects.financialProjections"), help: t("projects.financialProjectionsHelp") },
    { field: "ownership_proof", label: t("projects.ownershipProof"), help: t("projects.ownershipProofHelp") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">{t("projects.requiredDocuments")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("projects.documentsHelp")}</p>
      </div>
      {documents.map(({ field, label, help }) => (
        <div key={field} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label htmlFor={field}>{label}{required && !current?.[field] ? " *" : ""}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{help}</p>
            </div>
            {current?.[field] ? (
              <a href={current[field] || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <FileText className="h-3.5 w-3.5" /> {t("projects.viewCurrentDocument")}
              </a>
            ) : null}
          </div>
          <Input
            id={field}
            type="file"
            accept="application/pdf,.pdf"
            className="mt-3"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              const error = file ? validateProjectDocument(file) : null;
              onChange(field, error ? null : file);
              onError?.(field, error);
              if (error) event.target.value = "";
            }}
          />
          {files[field] ? <p className="mt-1 text-xs text-muted-foreground">{files[field]?.name}</p> : null}
          {errors?.[field] ? <p className="mt-1 text-xs text-destructive">{errors[field]}</p> : null}
        </div>
      ))}
    </div>
  );
};

export default ProjectDocumentFields;
