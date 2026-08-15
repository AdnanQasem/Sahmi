import type { ProjectData } from "@/components/ProjectCard";
import i18n from "@/i18n";
import type { Project } from "@/services/projectsService";

const fallbackImage = "/placeholder.svg";

export const toProjectCard = (project: Project): ProjectData => ({
  id: project.id,
  slug: project.slug,
  title: project.title,
  description: project.short_description || project.description,
  category: project.category_detail?.name ?? i18n.t("projects.projectFallback"),
  founder:
    project.entrepreneur?.business_name
    || project.entrepreneur?.full_name
    || i18n.t("projects.founderFallback"),
  image: project.cover_image || fallbackImage,
  goal: Number(project.goal_amount),
  raised: Number(project.funded_amount),
  investors: project.investor_count,
  daysLeft: project.days_left ?? 0,
  status: project.status,
  repaymentStatus: project.repayment_status,
  verified: project.is_verified,
});
