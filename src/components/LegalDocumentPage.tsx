import { FileText, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

type DocumentType = "privacy" | "terms";

interface LegalDocumentPageProps {
  type: DocumentType;
  sectionCount: number;
}

const LegalDocumentPage = ({ type, sectionCount }: LegalDocumentPageProps) => {
  const { t } = useTranslation();
  const Icon = type === "privacy" ? ShieldCheck : FileText;

  return (
    <div className="bg-muted/30 py-12 sm:py-16 lg:py-20">
      <div className="container max-w-4xl">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("legal.prototypeLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t(`legal.${type}.title`)}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            {t(`legal.${type}.introduction`)}
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            {t("legal.lastUpdated", { date: t("legal.updateDate") })}
          </p>
        </header>

        <div className="mt-6 space-y-5">
          {Array.from({ length: sectionCount }, (_, index) => {
            const section = index + 1;
            return (
              <section key={section} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {section}. {t(`legal.${type}.sections.${section}.title`)}
                </h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                  {t(`legal.${type}.sections.${section}.body`)}
                </p>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentPage;
