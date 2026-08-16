import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import projectsService, { ProjectCreatePayload } from "@/services/projectsService";
import { getFieldErrors, getErrorMessage } from "@/services/api";
import { CheckCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import ProjectCostTableEditor from "@/components/projects/ProjectCostTableEditor";
import { emptyProjectCostItem, validateProjectCostTable } from "@/lib/projectCosts";
import ProjectTimelineEditor from "@/components/projects/ProjectTimelineEditor";
import { emptyProjectMilestone, validateProjectMilestones } from "@/lib/projectMilestones";
import ProjectDocumentFields from "@/components/projects/ProjectDocumentFields";
import { validateRequiredProjectDocuments } from "@/lib/projectDocuments";
import ProjectFaqEditor from "@/components/projects/ProjectFaqEditor";

const stepKeys = [
  "projects.steps.basicInfo",
  "projects.steps.projectStory",
  "projects.steps.fundingGoal",
  "projects.steps.timeline",
  "projects.steps.media",
  "projects.steps.faq",
  "projects.steps.review",
] as const;

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
type ProjectDemoTools = typeof import("@/demo/projectDemoPresets");

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
  faqs: [],
  milestones: [emptyProjectMilestone()],
  funding_period_days: "30",
  video_url: "",
  cover_image: null,
  business_plan: null,
  financial_projections: null,
  ownership_proof: null,
};

const START_PROJECT_DRAFT_KEY = "sahmi:start-project-draft:v1";
type StoredProjectForm = Omit<ProjectCreatePayload, "cover_image" | "business_plan" | "financial_projections" | "ownership_proof">;
interface StartProjectDraft {
  form: StoredProjectForm;
  currentStep: number;
  fundingBreakdown: string;
  risks: string;
  acceptedTerms: boolean;
  acceptedUpdates: boolean;
}

const withoutFiles = (form: ProjectCreatePayload): StoredProjectForm => {
  const stored = { ...form };
  delete stored.cover_image;
  delete stored.business_plan;
  delete stored.financial_projections;
  delete stored.ownership_proof;
  return stored;
};

const readDraft = (): StartProjectDraft | null => {
  try {
    const value = sessionStorage.getItem(START_PROJECT_DRAFT_KEY);
    return value ? JSON.parse(value) as StartProjectDraft : null;
  } catch {
    return null;
  }
};

const StartProject = () => {
  const { t } = useTranslation();
  const [restoredDraft] = useState(readDraft);
  const [currentStep, setCurrentStep] = useState(restoredDraft?.currentStep ?? 0);
  const [form, setForm] = useState<ProjectCreatePayload>(() => restoredDraft?.form
    ? { ...initialForm, ...restoredDraft.form }
    : initialForm);
  const [fundingBreakdown, setFundingBreakdown] = useState(restoredDraft?.fundingBreakdown ?? "");
  const [risks, setRisks] = useState(restoredDraft?.risks ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(restoredDraft?.acceptedTerms ?? false);
  const [acceptedUpdates, setAcceptedUpdates] = useState(restoredDraft?.acceptedUpdates ?? false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [demoTools, setDemoTools] = useState<ProjectDemoTools | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState("");
  const navigate = useNavigate();
  const hasFiles = [form.cover_image, form.business_plan, form.financial_projections, form.ownership_proof].some((value) => value instanceof File);
  const isDirty = hasFiles || JSON.stringify({
    form: withoutFiles(form), currentStep, fundingBreakdown, risks, acceptedTerms, acceptedUpdates,
  }) !== JSON.stringify({
    form: withoutFiles(initialForm), currentStep: 0, fundingBreakdown: "", risks: "", acceptedTerms: false, acceptedUpdates: false,
  });

  useEffect(() => {
    if (!isDirty) {
      sessionStorage.removeItem(START_PROJECT_DRAFT_KEY);
      return;
    }
    const draft: StartProjectDraft = {
      form: withoutFiles(form), currentStep, fundingBreakdown, risks, acceptedTerms, acceptedUpdates,
    };
    sessionStorage.setItem(START_PROJECT_DRAFT_KEY, JSON.stringify(draft));
  }, [acceptedTerms, acceptedUpdates, currentStep, form, fundingBreakdown, isDirty, risks]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: projectsService.listCategories,
  });

  useEffect(() => {
    if (!isDemoMode) return;
    let active = true;
    void import("@/demo/projectDemoPresets").then((tools) => {
      if (!active) return;
      setDemoTools(tools);
      setSelectedDemoId((current) => current || tools.projectDemoPresets[0]?.id || "");
    });
    return () => { active = false; };
  }, []);

  const createMutation = useMutation({
    mutationFn: () => projectsService.createProject({
      ...form,
      description: [
        form.description,
        fundingBreakdown ? `\n\n${t("projects.breakdown")}:\n${fundingBreakdown}` : "",
        risks ? `\n\n${t("projects.risks")}:\n${risks}` : "",
      ].join(""),
    }),
    onSuccess: (project) => {
      sessionStorage.removeItem(START_PROJECT_DRAFT_KEY);
      toast.success(t("projects.submittedReview"));
      navigate("/dashboard/entrepreneur");
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, t("projects.submitFailed")));
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
      if (!form.title.trim()) errors.title = t("validation.projectTitleRequired");
      if (!form.category) errors.category = t("validation.categoryRequired");
      if (!form.short_description.trim()) errors.short_description = t("validation.shortDescriptionRequired");
      if (!form.location.trim()) errors.location = t("validation.locationRequired");
    }
    if (currentStep === 1 && !form.description.trim()) {
      errors.description = t("validation.projectStoryRequired");
    }
    if (currentStep === 2) {
      if (!form.goal_amount) errors.goal_amount = t("validation.fundingGoalRequired");
      if (!form.funding_period_days) errors.funding_period_days = t("validation.campaignDurationRequired");
      const costError = validateProjectCostTable(form.cost_items, form.goal_amount);
      if (costError) errors.cost_items = costError;
    }
    if (currentStep === 3) {
      const milestoneError = validateProjectMilestones(form.milestones);
      if (milestoneError) errors.milestones = milestoneError;
    }
    if (currentStep === 4) {
      Object.assign(errors, validateRequiredProjectDocuments(form));
    }
    if (currentStep === 6) {
      if (!acceptedTerms) errors.terms = t("validation.termsRequired");
      if (!acceptedUpdates) errors.transparency = t("validation.updatesCommitmentRequired");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep()) {
      setCurrentStep((step) => Math.min(stepKeys.length - 1, step + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    if (validateStep()) {
      createMutation.mutate();
    }
  };

  const fillDemoData = () => {
    if (!demoTools) return;
    const preset = demoTools.projectDemoPresets.find((item) => item.id === selectedDemoId)
      ?? demoTools.projectDemoPresets[0];
    if (!preset) return;
    const categories = categoriesQuery.data ?? [];
    const filled = demoTools.applyProjectDemoPreset(form, preset, categories);
    setForm(filled.form);
    setFundingBreakdown(filled.fundingBreakdown);
    setRisks(filled.risks);
    if (categories.length === 0) toast.info(t("projects.demoNeedsCategory"));
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
            {stepKeys.map((stepKey, i) => (
              <div key={stepKey} className="flex flex-1 items-center">
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
                  <span className="mt-1.5 hidden text-xs text-muted-foreground sm:block">{t(stepKey)}</span>
                </div>
                {i < stepKeys.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {isDemoMode && <div className="mb-6 flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">
              <span>{t("projects.demoExamples")}</span>
              <select
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={selectedDemoId}
                onChange={(event) => setSelectedDemoId(event.target.value)}
                disabled={!demoTools}
              >
                {demoTools?.projectDemoPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
            </label>
            <Button type="button" size="sm" variant="outline" disabled={!demoTools} onClick={fillDemoData}>
              <Sparkles className="h-4 w-4" /> {t("projects.fillDemoData")}
            </Button>
            {!categoriesQuery.isLoading && !categoriesQuery.data?.length && (
              <p className="text-xs text-warning sm:basis-full">{t("projects.demoNeedsCategory")}</p>
            )}
          </div>}
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
                <ProjectDocumentFields
                  files={form}
                  errors={fieldErrors}
                  required
                  onChange={(field, file) => updateForm(field, file)}
                  onError={(field, error) => setFieldErrors((current) => {
                    const next = { ...current };
                    if (error) next[field] = error;
                    else delete next[field];
                    return next;
                  })}
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <ProjectFaqEditor items={form.faqs} onChange={(faqs) => updateForm("faqs", faqs)} />
          )}

          {currentStep === 6 && (
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
            <ArrowLeft className="me-1 h-4 w-4 rtl-flip" />{t("common.back")}</Button>
          {currentStep < stepKeys.length - 1 ? (
            <Button onClick={handleContinue}>{t("common.next")}<ArrowRight className="ms-1 h-4 w-4 rtl-flip" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? t("common.submitting") : t("projects.submitForReview")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartProject;
