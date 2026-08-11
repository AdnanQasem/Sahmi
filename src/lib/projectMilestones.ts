import type { ProjectMilestone } from "@/services/projectsService";

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
  percentage_of_project: index === 0 ? "100" : "0",
  order: index + 1,
});

export const reindexProjectMilestones = (milestones: ProjectMilestone[]) =>
  milestones.map((milestone, index) => ({ ...milestone, order: index + 1 }));

export const redistributeMilestonePercentages = (milestones: ProjectMilestone[]) => {
  if (!milestones.length) return [];
  const base = Math.floor((10000 / milestones.length)) / 100;
  return reindexProjectMilestones(
    milestones.map((milestone, index) => ({
      ...milestone,
      percentage_of_project: (
        index === milestones.length - 1
          ? 100 - base * (milestones.length - 1)
          : base
      ).toFixed(2),
    })),
  );
};

export const milestonePercentageTotal = (milestones: ProjectMilestone[]) =>
  milestones.reduce((total, milestone) => {
    const percentage = Number(milestone.percentage_of_project);
    return total + (Number.isFinite(percentage) ? percentage : 0);
  }, 0);

export const validateProjectMilestones = (milestones: ProjectMilestone[]) => {
  if (!milestones.length) return "Add at least one project milestone.";
  if (milestones.length > 20) return "A project timeline may contain at most 20 milestones.";

  let previousDate = "";
  for (const milestone of milestones) {
    if (!milestone.title.trim() || !milestone.description.trim()) {
      return "Every milestone needs a title and description.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(milestone.target_date)) {
      return "Every milestone needs a valid target date.";
    }
    if (previousDate && milestone.target_date < previousDate) {
      return "Milestones must be ordered by target date.";
    }
    previousDate = milestone.target_date;
    const percentage = Number(milestone.percentage_of_project);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      return "Every milestone percentage must be greater than 0 and no more than 100.";
    }
  }

  if (Math.abs(milestonePercentageTotal(milestones) - 100) > 0.005) {
    return "Milestone percentages must total 100%.";
  }
  return null;
};
