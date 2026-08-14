import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectFaq } from "@/services/projectsService";

interface ProjectFaqEditorProps {
  items: ProjectFaq[];
  onChange: (items: ProjectFaq[]) => void;
}

const ProjectFaqEditor = ({ items, onChange }: ProjectFaqEditorProps) => {
  const { t } = useTranslation();
  const update = (index: number, field: keyof ProjectFaq, value: string) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t("projects.projectFaqTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("projects.projectFaqHelp")}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t("projects.faqNumber", { number: index + 1 })}</p>
            <Button type="button" variant="ghost" size="icon" aria-label={t("projects.removeFaq", { number: index + 1 })} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div>
            <Label htmlFor={`faq-question-${index}`}>{t("projects.faqQuestion")}</Label>
            <Input id={`faq-question-${index}`} className="mt-1.5" value={item.question} onChange={(event) => update(index, "question", event.target.value)} />
          </div>
          <div>
            <Label htmlFor={`faq-answer-${index}`}>{t("projects.faqAnswer")}</Label>
            <Textarea id={`faq-answer-${index}`} className="mt-1.5" rows={3} value={item.answer} onChange={(event) => update(index, "answer", event.target.value)} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" disabled={items.length >= 20} onClick={() => onChange([...items, { question: "", answer: "" }])}>
        <Plus className="h-4 w-4" /> {t("projects.addFaq")}
      </Button>
    </div>
  );
};

export default ProjectFaqEditor;
