import { describe, expect, it } from "vitest";
import { validateProjectCostTable } from "@/lib/projectCosts";
import { validateProjectMilestones } from "@/lib/projectMilestones";
import { applyProjectDemoPreset, projectDemoPresets } from "@/demo/projectDemoPresets";
import type { ProjectCreatePayload } from "@/services/projectsService";

const existingForm = (): ProjectCreatePayload => ({
  title: "",
  category: "",
  short_description: "",
  description: "",
  location: "",
  goal_amount: "",
  minimum_investment: "100",
  expected_roi: "0",
  cost_items: [],
  faqs: [],
  milestones: [],
  funding_period_days: "30",
  video_url: "",
  cover_image: new File(["image"], "real-cover.png", { type: "image/png" }),
  business_plan: new File(["plan"], "real-plan.pdf", { type: "application/pdf" }),
  financial_projections: new File(["finance"], "real-finance.pdf", { type: "application/pdf" }),
  ownership_proof: new File(["ownership"], "real-ownership.pdf", { type: "application/pdf" }),
});

describe("project demo presets", () => {
  it("provides exactly 23 realistic examples", () => {
    expect(projectDemoPresets).toHaveLength(23);
    expect(new Set(projectDemoPresets.map((preset) => preset.id)).size).toBe(23);
  });

  it("fills only regular state, uses a loaded category ID, and preserves real files", () => {
    const current = existingForm();
    const categories = [{ id: "category-from-api", name: "Agriculture", slug: "agriculture" }];
    const result = applyProjectDemoPreset(current, projectDemoPresets[0], categories);

    expect(result.form.category).toBe("category-from-api");
    expect(result.form.cover_image).toBe(current.cover_image);
    expect(result.form.business_plan).toBe(current.business_plan);
    expect(result.form.financial_projections).toBe(current.financial_projections);
    expect(result.form.ownership_proof).toBe(current.ownership_proof);
    expect(validateProjectCostTable(result.form.cost_items, result.form.goal_amount)).toBeNull();
    expect(validateProjectMilestones(result.form.milestones)).toBeNull();
  });
});
