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

const steps = ["Basic Info", "Project Story", "Funding Goal", "Media", "Review"];

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
  funding_period_days: "30",
  video_url: "",
  cover_image: null,
};

const StartProject = () => {
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
      toast.success("Project submitted for review.");
      navigate(`/projects/${project.slug}`);
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not submit project."));
    },
  });

  const updateForm = (field: keyof ProjectCreatePayload, value: string | File | null) => {
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
    }
    if (currentStep === 4) {
      if (!acceptedTerms) errors.terms = "You must accept the terms before submitting.";
      if (!acceptedUpdates) errors.transparency = "You must commit to supporter updates.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep()) {
      setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
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
          <h1 className="mb-2 text-2xl font-bold text-foreground">Start Your Project</h1>
          <p className="text-sm text-muted-foreground">Share your vision with the world. It only takes a few minutes.</p>
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
              <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
              <p className="text-sm text-muted-foreground">Tell us about your project fundamentals.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input id="title" placeholder="e.g., Solar-Powered Water Purification" className="mt-1.5" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Choose a clear, descriptive title.</p>
                  {fieldErrors.title && <p className="mt-1 text-xs text-destructive">{fieldErrors.title}</p>}
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select a category</option>
                    {categoriesQuery.data?.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <p className="mt-1 text-xs text-destructive">{fieldErrors.category}</p>}
                </div>
                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea id="short_description" placeholder="A brief summary of your project (max 200 characters)" className="mt-1.5" rows={3} value={form.short_description} onChange={(event) => updateForm("short_description", event.target.value)} />
                  {fieldErrors.short_description && <p className="mt-1 text-xs text-destructive">{fieldErrors.short_description}</p>}
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g., Ramallah, West Bank" className="mt-1.5" value={form.location} onChange={(event) => updateForm("location", event.target.value)} />
                  {fieldErrors.location && <p className="mt-1 text-xs text-destructive">{fieldErrors.location}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Project Story</h2>
              <p className="text-sm text-muted-foreground">Share the story behind your project. Why does it matter?</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Full Story</Label>
                  <Textarea id="description" placeholder="Tell supporters about your project, why it matters, and what impact it will create..." className="mt-1.5" rows={8} value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Be genuine and detailed. Stories with clear impact tend to perform better.</p>
                  {fieldErrors.description && <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>}
                </div>
                <div>
                  <Label htmlFor="risks">Risks & Challenges</Label>
                  <Textarea id="risks" placeholder="What challenges might you face and how do you plan to address them?" className="mt-1.5" rows={4} value={risks} onChange={(event) => setRisks(event.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Funding Goal</h2>
              <p className="text-sm text-muted-foreground">Set a realistic and transparent funding target.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal_amount">Funding Goal (USD)</Label>
                  <Input id="goal_amount" type="number" placeholder="e.g., 25000" className="mt-1.5" value={form.goal_amount} onChange={(event) => updateForm("goal_amount", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Set a clear, achievable amount.</p>
                  {fieldErrors.goal_amount && <p className="mt-1 text-xs text-destructive">{fieldErrors.goal_amount}</p>}
                </div>
                <div>
                  <Label htmlFor="minimum_investment">Minimum Investment (USD)</Label>
                  <Input id="minimum_investment" type="number" className="mt-1.5" value={form.minimum_investment} onChange={(event) => updateForm("minimum_investment", event.target.value)} />
                  {fieldErrors.minimum_investment && <p className="mt-1 text-xs text-destructive">{fieldErrors.minimum_investment}</p>}
                </div>
                <div>
                  <Label htmlFor="expected_roi">Expected ROI (%)</Label>
                  <Input id="expected_roi" type="number" className="mt-1.5" value={form.expected_roi} onChange={(event) => updateForm("expected_roi", event.target.value)} />
                  {fieldErrors.expected_roi && <p className="mt-1 text-xs text-destructive">{fieldErrors.expected_roi}</p>}
                </div>
                <div>
                  <Label htmlFor="funding_period_days">Campaign Duration (Days)</Label>
                  <Input id="funding_period_days" type="number" placeholder="e.g., 30" className="mt-1.5" value={form.funding_period_days} onChange={(event) => updateForm("funding_period_days", event.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Recommended: 30-60 days.</p>
                  {fieldErrors.funding_period_days && <p className="mt-1 text-xs text-destructive">{fieldErrors.funding_period_days}</p>}
                </div>
                <div>
                  <Label htmlFor="funding_breakdown">Funding Breakdown</Label>
                  <Textarea id="funding_breakdown" placeholder="How will you allocate the funds? Be specific." className="mt-1.5" rows={4} value={fundingBreakdown} onChange={(event) => setFundingBreakdown(event.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Media & Documents</h2>
              <p className="text-sm text-muted-foreground">Upload visuals and documents that support your project.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cover_image">Cover Image</Label>
                  <Input id="cover_image" type="file" accept="image/*" className="mt-1.5" onChange={(event) => updateForm("cover_image", event.target.files?.[0] ?? null)} />
                  <p className="mt-1 text-xs text-muted-foreground">Recommended: 1200x675px, JPG or PNG</p>
                  {fieldErrors.cover_image && <p className="mt-1 text-xs text-destructive">{fieldErrors.cover_image}</p>}
                </div>
                <div>
                  <Label htmlFor="video_url">Video URL (Optional)</Label>
                  <Input id="video_url" placeholder="https://youtube.com/..." className="mt-1.5" value={form.video_url} onChange={(event) => updateForm("video_url", event.target.value)} />
                  {fieldErrors.video_url && <p className="mt-1 text-xs text-destructive">{fieldErrors.video_url}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">Double-check everything before submitting.</p>
              <div className="rounded-lg border border-border bg-background p-5 text-sm text-muted-foreground">
                <p>Your project will be reviewed by our team within 2-3 business days. We verify all projects for quality and transparency before they go live.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="terms" className="mt-1 rounded border-border" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">I agree to Sahmi's Terms & Conditions and confirm all information is accurate.</label>
                </div>
                {fieldErrors.terms && <p className="text-xs text-destructive">{fieldErrors.terms}</p>}
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="transparency" className="mt-1 rounded border-border" checked={acceptedUpdates} onChange={(event) => setAcceptedUpdates(event.target.checked)} />
                  <label htmlFor="transparency" className="text-sm text-muted-foreground">I commit to providing regular updates to my supporters.</label>
                </div>
                {fieldErrors.transparency && <p className="text-xs text-destructive">{fieldErrors.transparency}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || createMutation.isPending}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleContinue}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
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
