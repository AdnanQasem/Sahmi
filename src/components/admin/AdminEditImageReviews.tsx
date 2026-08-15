import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/i18n/format";
import type { EditImageReview, EditImageReviewStatus, Project } from "@/services/projectsService";

interface Props {
  projects: Project[];
  pending: boolean;
  onSave: (project: Project, image: EditImageReview, status: EditImageReviewStatus, notes: string) => void;
}

export const matchesEditImageReviewFilters = (
  projectId: string,
  status: EditImageReviewStatus,
  projectFilter: string,
  statusFilter: "all" | EditImageReviewStatus,
) => (projectFilter === "all" || projectId === projectFilter)
  && (statusFilter === "all" || status === statusFilter);

const formatBytes = (value: number | null, locale: string) => {
  if (value === null) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1024)} KB`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
};

const AdminEditImageReviews = ({ projects, pending, onSave }: Props) => {
  const { t, i18n } = useTranslation();
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EditImageReviewStatus>("all");
  const [drafts, setDrafts] = useState<Record<string, { status: EditImageReviewStatus; notes: string }>>({});
  const entries = useMemo(() => projects.flatMap((project) =>
    (project.pending_edit_request?.images || []).map((image) => ({ project, image }))), [projects]);

  useEffect(() => {
    setDrafts(Object.fromEntries(entries.map(({ project, image }) => [
      `${project.id}:${image.key}`,
      { status: image.status, notes: image.review_notes },
    ])));
  }, [entries]);

  const filtered = entries.filter(({ project, image }) =>
    matchesEditImageReviewFilters(project.id, image.status, projectFilter, statusFilter));

  if (!entries.length) return null;
  return <section className="rounded-2xl border bg-card p-5 sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary"/><h2 className="text-xl font-bold">{t("adminForm.pictureReviews")}</h2></div><p className="mt-1 text-sm text-muted-foreground">{t("adminForm.pictureReviewsHelp")}</p></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger className="min-w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("adminForm.allProjects")}</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | EditImageReviewStatus)}><SelectTrigger className="min-w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("adminForm.allReviewStatuses")}</SelectItem><SelectItem value="approved">{t("adminForm.imageStatus.approved")}</SelectItem><SelectItem value="needs_revision">{t("adminForm.imageStatus.needs_revision")}</SelectItem><SelectItem value="rejected">{t("adminForm.imageStatus.rejected")}</SelectItem></SelectContent></Select>
      </div>
    </div>
    <div className="mt-5 grid gap-4 xl:grid-cols-2">{filtered.map(({ project, image }) => {
      const key = `${project.id}:${image.key}`;
      const draft = drafts[key] || { status: image.status, notes: image.review_notes };
      return <article key={key} className="overflow-hidden rounded-xl border bg-background sm:flex">
        <a href={image.url} target="_blank" rel="noreferrer" className="block h-48 bg-muted sm:h-auto sm:w-44 sm:shrink-0"><img src={image.url} alt={image.file_name} className="h-full w-full object-cover"/></a>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{image.file_name}</p><p className="text-xs text-muted-foreground">{project.title}</p></div><Badge variant="outline">{t(`adminForm.imageStatus.${image.status}`)}</Badge></div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">{t("adminForm.uploadDate")}</dt><dd className="font-medium">{formatDate(image.upload_date, { dateStyle: "medium" }, i18n.language)}</dd></div><div><dt className="text-muted-foreground">{t("adminForm.fileSize")}</dt><dd className="font-medium" dir="ltr">{formatBytes(image.size, i18n.language)}</dd></div><div className="col-span-2"><dt className="text-muted-foreground">{t("adminForm.imageKindLabel")}</dt><dd className="font-medium">{t(`adminForm.imageKind.${image.kind}`)}</dd></div></dl>
          <div className="mt-3 grid gap-2 sm:grid-cols-[150px_1fr]"><Select value={draft.status} onValueChange={(status) => setDrafts((current) => ({ ...current, [key]: { ...draft, status: status as EditImageReviewStatus } }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">{t("adminForm.imageStatus.approved")}</SelectItem><SelectItem value="needs_revision">{t("adminForm.imageStatus.needs_revision")}</SelectItem><SelectItem value="rejected">{t("adminForm.imageStatus.rejected")}</SelectItem></SelectContent></Select><Input value={draft.notes} maxLength={2000} placeholder={t("adminForm.quickReviewPlaceholder")} onChange={(event) => setDrafts((current) => ({ ...current, [key]: { ...draft, notes: event.target.value } }))}/></div>
          <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{image.reviewed_by ? t("adminForm.reviewedBy", { name: image.reviewed_by }) : t("adminForm.awaitingImageReview")}</p><Button size="sm" disabled={pending || !draft.notes.trim()} onClick={() => onSave(project, image, draft.status, draft.notes.trim())}><Save className="h-3.5 w-3.5"/>{t("common.save")}</Button></div>
        </div>
      </article>;
    })}</div>
    {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">{t("adminForm.noPictureReviews")}</p>}
  </section>;
};

export default AdminEditImageReviews;
