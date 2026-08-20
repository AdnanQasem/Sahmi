import { ExternalLink, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

type DocumentKey = "business_plan" | "financial_projections" | "ownership_proof";

interface RequiredProjectDocumentsProps {
  documents: Partial<Record<DocumentKey, string | null>>;
  proposedDocuments?: Partial<Record<DocumentKey, string>>;
  className?: string;
}

const RequiredProjectDocuments = ({
  documents,
  proposedDocuments = {},
  className = "",
}: RequiredProjectDocumentsProps) => {
  const { t } = useTranslation();
  const items: Array<{ key: DocumentKey; label: string }> = [
    { key: "business_plan", label: t("projects.businessPlan") },
    { key: "financial_projections", label: t("projects.financialProjections") },
    { key: "ownership_proof", label: t("projects.ownershipProof") },
  ];

  return (
    <section className={`rounded-xl border border-border bg-muted/10 p-4 ${className}`}>
      <h3 className="font-semibold text-foreground">{t("projects.requiredDocuments")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("projects.adminDocumentsHelp")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map(({ key, label }) => {
          const currentUrl = documents[key];
          const proposedUrl = proposedDocuments[key];
          return (
            <article key={key} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <p className="min-w-0 font-semibold text-foreground">{label}</p>
              </div>
              <div className="mt-4 space-y-2">
                {currentUrl ? (
                  <a href={currentUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
                    <span>{t("projects.viewCurrentDocument")}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">{t("projects.documentNotUploaded")}</p>
                )}
                {proposedUrl && proposedUrl !== currentUrl && (
                  <a href={proposedUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-warning/35 bg-warning/10 px-3 py-2 text-sm font-semibold text-foreground hover:bg-warning/15">
                    <span>{t("projects.viewProposedDocument")}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default RequiredProjectDocuments;
