import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const steps = ["Basic Info", "Project Story", "Funding Goal", "Media", "Review"];

const StartProject = () => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <h1 className="mb-2 text-2xl font-bold text-foreground">Start Your Project</h1>
          <p className="text-sm text-muted-foreground">Share your vision with the world. It only takes a few minutes.</p>
        </div>
      </section>

      <div className="container max-w-3xl py-8">
        {/* Stepper */}
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

        {/* Step content */}
        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {currentStep === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
              <p className="text-sm text-muted-foreground">Tell us about your project fundamentals.</p>
              <div className="space-y-4">
                <div>
                  <Label>Project Title</Label>
                  <Input placeholder="e.g., Solar-Powered Water Purification" className="mt-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">Choose a clear, descriptive title.</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <select className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option>Select a category</option>
                    <option>Technology</option>
                    <option>Agriculture</option>
                    <option>Education</option>
                    <option>Healthcare</option>
                    <option>Arts & Culture</option>
                    <option>Small Business</option>
                    <option>Community</option>
                    <option>Infrastructure</option>
                  </select>
                </div>
                <div>
                  <Label>Short Description</Label>
                  <Textarea placeholder="A brief summary of your project (max 200 characters)" className="mt-1.5" rows={3} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input placeholder="e.g., Ramallah, West Bank" className="mt-1.5" />
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
                  <Label>Full Story</Label>
                  <Textarea placeholder="Tell supporters about your project, why it matters, and what impact it will create..." className="mt-1.5" rows={8} />
                  <p className="mt-1 text-xs text-muted-foreground">Be genuine and detailed. Stories with clear impact tend to perform better.</p>
                </div>
                <div>
                  <Label>Risks & Challenges</Label>
                  <Textarea placeholder="What challenges might you face and how do you plan to address them?" className="mt-1.5" rows={4} />
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
                  <Label>Funding Goal (USD)</Label>
                  <Input type="number" placeholder="e.g., 25000" className="mt-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">Set a clear, achievable amount.</p>
                </div>
                <div>
                  <Label>Campaign Duration (Days)</Label>
                  <Input type="number" placeholder="e.g., 30" className="mt-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">Recommended: 30-60 days.</p>
                </div>
                <div>
                  <Label>Funding Breakdown</Label>
                  <Textarea placeholder="How will you allocate the funds? Be specific." className="mt-1.5" rows={4} />
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
                  <Label>Cover Image</Label>
                  <div className="mt-1.5 rounded-lg border-2 border-dashed border-border bg-background p-10 text-center">
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    <p className="mt-1 text-xs text-muted-foreground">Recommended: 1200x675px, JPG or PNG</p>
                  </div>
                </div>
                <div>
                  <Label>Additional Images</Label>
                  <div className="mt-1.5 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                    <p className="text-sm text-muted-foreground">Upload up to 5 additional images</p>
                  </div>
                </div>
                <div>
                  <Label>Video URL (Optional)</Label>
                  <Input placeholder="https://youtube.com/..." className="mt-1.5" />
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
                  <input type="checkbox" id="terms" className="mt-1 rounded border-border" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">I agree to Sahmi's Terms & Conditions and confirm all information is accurate.</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="transparency" className="mt-1 rounded border-border" />
                  <label htmlFor="transparency" className="text-sm text-muted-foreground">I commit to providing regular updates to my supporters.</label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button>Submit for Review</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartProject;
