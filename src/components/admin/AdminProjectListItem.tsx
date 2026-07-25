import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  CirclePause,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type { Project, ProjectModerationPayload } from "@/services/projectsService";
import { formatCurrency, formatDate } from "@/i18n/format";

interface AdminProjectListItemProps {
  project: Project;
  isBusy: boolean;
  onReview: (project: Project) => void;
  onStatusChange: (project: Project, status: ProjectModerationPayload["status"]) => void;
  onDelete: (project: Project) => void;
}

const AdminProjectListItem = ({
  project,
  isBusy,
  onReview,
  onStatusChange,
  onDelete,
}: AdminProjectListItemProps) => {
  const { t } = useTranslation();
  const pendingReview = !project.is_verified && project.status === "draft";
  const isArchived = Boolean(project.deleted_at);
  const fundedPercent = Math.min(Math.max(Number(project.funding_percent) || 0, 0), 100);

  return (
    <article className="group rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 sm:h-24 sm:w-32">
            {project.cover_image ? (
              <img
                src={project.cover_image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-primary/45">
                {project.title.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 py-0.5">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-foreground">{project.title}</h3>
              <StatusBadge status={isArchived ? "deleted" : pendingReview ? "pending_review" : project.status} />
              {project.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("admin.verified")}
                </span>
              )}
            </div>
            <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {project.short_description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3 w-3" />
                {project.entrepreneur?.full_name || project.entrepreneur?.email || t("adminForm.unknown")}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.location}
              </span>
              <span>{project.category_detail?.name || t("adminForm.uncategorized")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3 lg:w-72">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("adminForm.funding")}</p>
            <p className="mt-1 text-sm font-bold text-foreground" dir="ltr">
              {formatCurrency(project.funded_amount)}
              <span className="font-normal text-muted-foreground"> / {formatCurrency(project.goal_amount)}</span>
            </p>
          </div>
          <div className="text-end">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("adminForm.submitted")}</p>
            <p className="mt-1 text-xs font-medium text-foreground" dir="auto">
              {formatDate(project.created_at, { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-500"
              style={{ width: fundedPercent + "%" }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={fundedPercent}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 lg:w-44">
          {pendingReview ? (
            <Button size="sm" className="flex-1 lg:flex-none" onClick={() => onReview(project)} disabled={isBusy}>
              {t("admin.reviewQueue")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1 lg:flex-none" asChild>
              <Link to={"/dashboard/admin/projects/" + project.id + "/edit"}>
                <Pencil className="h-3.5 w-3.5" />
                {t("common.edit")}
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label={t("adminForm.moreActions", { title: project.title })}
                disabled={isBusy}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{t("adminForm.projectActions")}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={"/projects/" + project.slug}>
                  <ExternalLink className="me-2 h-4 w-4" />
                  {t("adminForm.viewProject")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={"/dashboard/admin/projects/" + project.id + "/edit"}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t("adminForm.advancedEdit")}
                </Link>
              </DropdownMenuItem>
              {pendingReview && (
                <DropdownMenuItem onSelect={() => onReview(project)}>
                  <CheckCircle2 className="me-2 h-4 w-4" />
                  {t("admin.reviewQueue")} submission
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {project.status === "active" && (
                <DropdownMenuItem onSelect={() => onStatusChange(project, "paused")}>
                  <CirclePause className="me-2 h-4 w-4" />
                  {t("adminForm.pauseCampaign")}
                </DropdownMenuItem>
              )}
              {project.status === "paused" && project.is_verified && (
                <DropdownMenuItem onSelect={() => onStatusChange(project, "active")}>
                  <Play className="me-2 h-4 w-4" />
                  {t("adminForm.resumeCampaign")}
                </DropdownMenuItem>
              )}
              {(project.status === "active" || project.status === "paused") && (
                <DropdownMenuItem onSelect={() => onStatusChange(project, "closed")}>
                  <CheckCircle2 className="me-2 h-4 w-4" />
                  {t("adminForm.closeCampaign")}
                </DropdownMenuItem>
              )}
              {project.status === "closed" && (
                <DropdownMenuItem onSelect={() => onStatusChange(project, "successful")}>
                  <CheckCircle2 className="me-2 h-4 w-4" />
                  {t("adminForm.markSuccessful")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onSelect={() => onDelete(project)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t("adminForm.deleteProject")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
};

export default AdminProjectListItem;
