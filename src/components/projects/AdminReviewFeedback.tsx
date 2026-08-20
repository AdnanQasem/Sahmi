import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AdminReviewFeedback as ReviewFeedback } from "@/services/projectsService";

interface AdminReviewFeedbackProps {
  feedback?: ReviewFeedback[];
  className?: string;
}

const AdminReviewFeedback = ({ feedback = [], className = "" }: AdminReviewFeedbackProps) => {
  const { t } = useTranslation();

  if (!feedback.length) return null;

  return (
    <section className={`space-y-3 ${className}`} aria-label={t("reviewFeedback.title")}>
      {feedback.map((item) => (
        <div key={item.id} className="rounded-xl border border-warning/35 bg-warning/10 p-4 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{t(`reviewFeedback.scope.${item.scope}`)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("reviewFeedback.help")}</p>
              <div className="mt-3 rounded-lg border border-warning/25 bg-background/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("reviewFeedback.adminNote")}</p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-foreground">{item.notes}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default AdminReviewFeedback;
