import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import projectsService, { ProjectCreatePayload } from "@/services/projectsService";
import { getFieldErrors, getErrorMessage } from "@/services/api";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import ProjectCostTableEditor from "@/components/projects/ProjectCostTableEditor";
import { emptyProjectCostItem, validateProjectCostTable } from "@/lib/projectCosts";
import ProjectTimelineEditor from "@/components/projects/ProjectTimelineEditor";
import { emptyProjectMilestone, validateProjectMilestones } from "@/lib/projectMilestones";

const steps = ["Basic Info", "Project Story", "Funding Goal", "Timeline", "Media", "Review"];

const initialForm: ProjectCreatePayload = {
  title: "",
  category: "",
  short_description: "",
  description: "",
  location: "",
  location_governorate: "",
  goal_amount: "",
  minimum_investment: "100",
  expected_roi: "0",
  cost_items: [emptyProjectCostItem()],
  milestones: [emptyProjectMilestone()],
  funding_period_days: "30",
  video_url: "",
  cover_image: null,
};

const StartProject = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<ProjectCreatePayload>(initialForm);
  const [fundingBreakdown, setFundingBreakdown] = useState("");
  const [risks, setRisks] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedUpdates, setAcceptedUpdates] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: projectsService.listCategories,
  });

  const createMutation = useMutation({
    mutationFn: () => projectsService.createProject({
      ...form,
      description: [
        form.description,
        fundingBreakdown ? `\n\nFunding breakdown:\n${fundingBreakdown}` : "",
        risks ? `\n\nRisks and challenges:\n${risks}` : "",
      ].join(""),
    }),
    onSuccess: (project) => {
      toast.success(t("projects.submittedReview"));
      navigate("/dashboard/entrepreneur");
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not submit project."));
    },
  });

  const updateForm = <K extends keyof ProjectCreatePayload>(
    field: K,
    value: ProjectCreatePayload[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateStep = () => {
    const errors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!form.title.trim()) errors.title = "Project title is required.";
      if (!form.category) errors.category = "Category is required.";
      if (!form.short_description.trim()) errors.short_description = "Short description is required.";
      if (!form.location.trim()) errors.location = "Location is required.";
    }
    if (currentStep === 1 && !form.description.trim()) {
      errors.description = "Project story is required.";
    }
    if (currentStep === 2) {
      if (!form.goal_amount) errors.goal_amount = "Funding goal is required.";
      if (!form.funding_period_days) errors.funding_period_days = "Campaign duration is required.";
      const costError = validateProjectCostTable(form.cost_items, form.goal_amount);
      if (costError) errors.cost_items = costError;
    }
    if (currentStep === 3) {
      const milestoneError = validateProjectMilestones(form.milestones);
      if (milestoneError) errors.milestones = milestoneError;
    }
    if (currentStep === 5) {
      if (!acceptedTerms) errors.terms = "You must accept the terms before submitting.";
      if (!acceptedUpdates) errors.transparency = "You must commit to supporter updates.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep()) {
      setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    if (validateStep()) {
      createMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t("projects.startTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("projects.formIntro")}</p>
        </div>
      </section>

      <div className="container max-w-3xl py-8">
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      i < currentStep
                        ? "bg-primary text-primary-foreground"
                        : i === currentStep
                        ? "bg-primary text-primary-foreground ring-4 ring-primary-light"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < currentStep ? <CheckCircle className="h-5 w-5" /> : i + 1}
                  </div>
                  <span className="mt-1.5 hidden text-xs text-muted-foreground sm:block">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {currentStep === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">{t("projects.basicInfo")}</h2>
              <p className="text-sm text-muted-foreground">{t("projects.fundamentalsHelp")}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">{t("projects.projectTitle")}</Label>
                  <Input id="title" placeholder={t("projects.titleExample")} className="mt-1.5" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">{t("projects.titleHelp")}</p>
                  {fieldErrors.title && <p className="mt-1 text-xs text-destructive">{fieldErrors.title}</p>}
                </div>
                <div>
                  <Label htmlFor="category">{t("projects.category")}</Label>
                  <select id="category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">{t("projects.selectCategory")}</option>
                    {categoriesQuery.data?.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <p className="mt-1 text-xs text-destructive">{fieldErrors.category}</p>}
                </div>
                <div>
                  <Label htmlFor="short_description">{t("projects.shortDescription")}</Label>
                  <Textarea id="short_description" placeholder={t("projects.summaryPlaceholder")} className="mt-1.5" rows={3} value={form.short_description} onChange={(event) => updateForm("short_description", event.target.value)} />
                  {fieldErrors.short_description && <p className="mt-1 text-xs text-destructive">{fieldErrors.short_description}</p>}
                </div>
                <div>
                  <Label htmlFor="location">{t("projects.location")}</Label>
                  <Input id="location" placeholder={t("projects.locationExample")} className="mt-1.5" value={form.location} onChange={(event) => updateForm("location", event.target.value)} />
                  {fieldErrors.location && <p className="mt-1 text-xs text-destructive">{fieldErrors.location}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">{t("projects.story")}</h2>
              <p className="text-sm text-muted-foreground">{t("projects.storyHelp")}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">{t("projects.fullStory")}</Label>
                  <Textarea id="description" placeholder={t("projects.storyPlaceholder")} className="mt-1.5" rows={8} value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">{t("projects.storyDetailHelp")}</p>
                  {fieldErrors.description && <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>}
                </div>
                <div>
                  <Label htmlFor="risks">{t("projects.risks")}</Label>
                  <Textarea id="risks" placeholder={t("projects.risksPlaceholder")} className="mt-1.5" rows={4} value={risks} onChange={(event) => setRisks(event.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">{t("projects.goalAmount")}</h2>
              <p className="text-sm text-muted-foreground">{t("projects.fundingHelp")}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal_amount">{t("projects.goalAmount")} ({t("common.currency")})</Label>
                  <Input id="goal_amount" type="number" placeholder="e.g., 25000" className="mt-1.5" value={form.goal_amount} onChange={(event) => updateForm("goal_amount", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">{t("projects.amountHelp")}</p>
                  {fieldErrors.goal_amount && <p className="mt-1 text-xs text-destructive">{fieldErrors.goal_amount}</p>}
                </div>
                <div>
                  <Label htmlFor="minimum_investment">{t("projects.minimumInvestment")} ({t("common.currency")})</Label>
                  <Input id="minimum_investment" type="number" className="mt-1.5" value={form.minimum_investment} onChange={(event) => updateForm("minimum_investment", event.target.value)} />
                  {fieldErrors.minimum_investment && <p className="mt-1 text-xs text-destructive">{fieldErrors.minimum_investment}</p>}
                </div>
                <div>
                  <Label htmlFor="expected_roi">{t("projects.expectedRoi")} (%)</Label>
                  <Input id="expected_roi" type="number" className="mt-1.5" value={form.expected_roi} onChange={(event) => updateForm("expected_roi", event.target.value)} />
                  {fieldErrors.expected_roi && <p className="mt-1 text-xs text-destructive">{fieldErrors.expected_roi}</p>}
                </div>
                <div>
                  <Label htmlFor="funding_period_days">{t("projects.duration")}</Label>
                  <Input id="funding_period_days" type="number" placeholder="e.g., 30" className="mt-1.5" value={form.funding_period_days} onChange={(event) => updateForm("funding_period_days", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">{t("projects.durationHelp")}</p>
                  {fieldErrors.funding_period_days && <p className="mt-1 text-xs text-destructive">{fieldErrors.funding_period_days}</p>}
                </div>
                <div>
                  <Label htmlFor="funding_breakdown">{t("projects.breakdown")}</Label>
                  <Textarea id="funding_breakdown" placeholder={t("projects.breakdownPlaceholder")} className="mt-1.5" rows={4} value={fundingBreakdown} onChange={(event) => setFundingBreakdown(event.target.value)} />
                </div>
                <ProjectCostTableEditor
                  items={form.cost_items}
                  goalAmount={form.goal_amount}
                  onChange={(items) => updateForm("cost_items", items)}
                  error={fieldErrors.cost_items}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <ProjectTimelineEditor
              milestones={form.milestones}
              onChange={(milestones) => updateForm("milestones", milestones)}
              error={fieldErrors.milestones}
            />
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">{t("projects.media")}</h2>
              <p className="text-sm text-muted-foreground">{t("projects.mediaHelp")}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cover_image">{t("projects.coverImage")}</Label>
                  <Input id="cover_image" type="file" accept="image/*" className="mt-1.5" onChange={(event) => updateForm("cover_image", event.target.files?.[0] ?? null)} />
                  <p className="mt-1 text-xs text-muted-foreground">{t("projects.imageHelp")}</p>
                  {fieldErrors.cover_image && <p className="mt-1 text-xs text-destructive">{fieldErrors.cover_image}</p>}
                </div>
                <div>
                  <Label htmlFor="video_url">{t("projects.video")}</Label>
                  <Input id="video_url" placeholder="https://youtube.com/..." className="mt-1.5" value={form.video_url} onChange={(event) => updateForm("video_url", event.target.value)} />
                  {fieldErrors.video_url && <p className="mt-1 text-xs text-destructive">{fieldErrors.video_url}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">{t("common.submit")}</h2>
              <p className="text-sm text-muted-foreground">{t("projects.reviewText")}</p>
              <div className="rounded-lg border border-border bg-background p-5 text-sm text-muted-foreground">
                <p>{t("projects.reviewNotice")}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="terms" className="mt-1 rounded border-border" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">{t("projects.termsConfirm")}</label>
                </div>
                {fieldErrors.terms && <p className="text-xs text-destructive">{fieldErrors.terms}</p>}
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="transparency" className="mt-1 rounded border-border" checked={acceptedUpdates} onChange={(event) => setAcceptedUpdates(event.target.checked)} />
                  <label htmlFor="transparency" className="text-sm text-muted-foreground">{t("projects.updatesCommitment")}</label>
                </div>
                {fieldErrors.transparency && <p className="text-xs text-destructive">{fieldErrors.transparency}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep(Math.max(0, currentStep - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentStep === 0 || createMutation.isPending}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />{t("common.back")}</Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleContinue}>{t("common.next")}<ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartProject;
