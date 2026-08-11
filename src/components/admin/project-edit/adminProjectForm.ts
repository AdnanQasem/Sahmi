import type { AdminProject, AdminProjectPayload } from "@/services/adminProjectsService";

export const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 16);
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};

export const freshAdminProjectForm = (): AdminProjectPayload => ({
  entrepreneur: "",
  title: "",
  slug: "",
  description: "",
  short_description: "",
  category: "",
  location: "",
  location_governorate: "",
  goal_amount: "",
  funded_amount: "0",
  minimum_investment: "100",
  expected_roi: "0",
  cost_items: [{ name: "1", description: "", quantity: "1", unit_cost: "" }],
  milestones: [{
    title: "",
    description: "",
    target_date: "",
    deliverables: "",
    percentage_of_project: "100",
    order: 1,
  }],
  funding_period_days: 30,
  start_date: toLocalDateTime(new Date().toISOString()),
  end_date: null,
  status: "draft",
  is_verified: false,
  verified_by: null,
  verified_at: null,
  verification_notes: "",
  clear_business_plan: false,
  clear_financial_projections: false,
  clear_ownership_proof: false,
  clear_cover_image: false,
  video_url: "",
  ai_classified_category: "",
  ai_confidence_score: null,
  ai_classification_at: null,
  ai_generated_summary: "",
  milestone_count: 0,
  repayment_status: "on_track",
  total_repaid: "0",
  next_repayment_date: null,
  view_count: 0,
  investor_count: 0,
  rating: "0",
  reviews_count: 0,
  deleted_at: null,
});

export const adminProjectToForm = (project: AdminProject): AdminProjectPayload => ({
  entrepreneur: project.entrepreneur,
  title: project.title,
  slug: project.slug,
  description: project.description,
  short_description: project.short_description,
  category: project.category,
  location: project.location,
  location_governorate: project.location_governorate || "",
  goal_amount: project.goal_amount,
  funded_amount: project.funded_amount,
  minimum_investment: project.minimum_investment,
  expected_roi: project.expected_roi,
  cost_items: project.cost_items?.length
    ? project.cost_items
    : [{ name: "1", description: "", quantity: "1", unit_cost: "" }],
  milestones: project.milestones?.length
    ? project.milestones
    : [{
        title: "",
        description: "",
        target_date: "",
        deliverables: "",
        percentage_of_project: "100",
        order: 1,
      }],
  funding_period_days: project.funding_period_days,
  start_date: toLocalDateTime(project.start_date),
  end_date: project.end_date ? toLocalDateTime(project.end_date) : null,
  status: project.status,
  is_verified: project.is_verified,
  verified_by: project.verified_by,
  verified_at: project.verified_at ? toLocalDateTime(project.verified_at) : null,
  verification_notes: project.verification_notes || "",
  clear_business_plan: false,
  clear_financial_projections: false,
  clear_ownership_proof: false,
  clear_cover_image: false,
  video_url: project.video_url || "",
  ai_classified_category: project.ai_classified_category || "",
  ai_confidence_score: project.ai_confidence_score,
  ai_classification_at: project.ai_classification_at
    ? toLocalDateTime(project.ai_classification_at)
    : null,
  ai_generated_summary: project.ai_generated_summary || "",
  milestone_count: project.milestone_count,
  repayment_status: project.repayment_status,
  total_repaid: project.total_repaid,
  next_repayment_date: project.next_repayment_date,
  view_count: project.view_count,
  investor_count: project.investor_count,
  rating: project.rating,
  reviews_count: project.reviews_count,
  deleted_at: project.deleted_at ? toLocalDateTime(project.deleted_at) : null,
});
