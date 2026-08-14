import type { ProjectMilestone } from "@/services/projectsService";
import i18n from "@/i18n";

const toDateInput = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const suggestedMilestoneDate = (index = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + (index + 1) * 30);
  return toDateInput(date);
};

export const emptyProjectMilestone = (index = 0): ProjectMilestone => ({
  title: "",
  description: "",
  target_date: suggestedMilestoneDate(index),
  deliverables: "",
  percentage_of_project: index === 0 ? "100" : "",
  order: index + 1,
});

export const reindexProjectMilestones = (milestones: ProjectMilestone[]) =>
  milestones.map((milestone, index) => ({ ...milestone, order: index + 1 }));

export const milestonePercentageTotal = (milestones: ProjectMilestone[]) =>
  milestones.reduce((total, milestone) => {
    const percentage = Number(milestone.percentage_of_project);
    return total + (Number.isFinite(percentage) ? percentage : 0);
  }, 0);

export const validateProjectMilestones = (milestones: ProjectMilestone[]) => {
  if (!milestones.length) return i18n.t("validation.milestoneRequired");
  if (milestones.length > 20) return i18n.t("validation.milestoneLimit");

  let previousDate = "";
  for (const milestone of milestones) {
    if (!milestone.title.trim() || !milestone.description.trim()) {
      return i18n.t("validation.milestoneDetailsRequired");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(milestone.target_date)) {
      return i18n.t("validation.milestoneDateRequired");
    }
    if (previousDate && milestone.target_date < previousDate) {
      return i18n.t("validation.milestoneDateOrder");
    }
    previousDate = milestone.target_date;
    const percentage = Number(milestone.percentage_of_project);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      return i18n.t("validation.milestonePercentageRange");
    }
  }

  if (Math.abs(milestonePercentageTotal(milestones) - 100) > 0.005) {
    return i18n.t("validation.milestonePercentageTotal");
  }
  return null;
};
