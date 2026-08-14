import type { ProjectCreatePayload } from "@/services/projectsService";
import i18n from "@/i18n";

export const MAX_PROJECT_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type ProjectDocumentField =
  | "business_plan"
  | "financial_projections"
  | "ownership_proof";

export const validateProjectDocument = (file: File): string | null => {
  if (file.size > MAX_PROJECT_DOCUMENT_BYTES) return i18n.t("validation.documentSize");
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return i18n.t("validation.documentPdf");
  }
  return null;
};

export const validateRequiredProjectDocuments = (
  form: Pick<ProjectCreatePayload, ProjectDocumentField>,
): Partial<Record<ProjectDocumentField, string>> => {
  const errors: Partial<Record<ProjectDocumentField, string>> = {};
  (["business_plan", "financial_projections", "ownership_proof"] as const).forEach((field) => {
    const file = form[field];
    if (!file) errors[field] = i18n.t("validation.documentRequired");
    else {
      const error = validateProjectDocument(file);
      if (error) errors[field] = error;
    }
  });
  return errors;
};
