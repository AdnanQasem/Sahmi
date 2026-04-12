import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/ProjectCard";
import projectsService, { Project } from "@/services/projectsService";
import investmentsService from "@/services/investmentsService";
import { getFieldErrors, getErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle, Users, Clock, Heart, Share2, ArrowLeft,
  Calendar, MapPin, FileText, AlertTriangle,
} from "lucide-react";

const fallbackImage = "/placeholder.svg";

const toProjectCard = (project: Project) => ({
  id: project.id,
  slug: project.slug,
  title: project.title,
  description: project.short_description || project.description,
  category: project.category_detail?.name ?? "Project",
  founder: project.entrepreneur?.business_name || project.entrepreneur?.full_name || "Sahmi founder",
  image: project.cover_image || fallbackImage,
  goal: Number(project.goal_amount),
  raised: Number(project.funded_amount),
  supporters: project.investor_count,
  daysLeft: project.days_left ?? 0,
  verified: project.is_verified,
});

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsService.getProject(id as string),
    enabled: !!id,
  });

  const relatedQuery = useQuery({
    queryKey: ["projects", "related", projectQuery.data?.category_detail?.slug],
    queryFn: () => projectsService.listProjects({
      category: projectQuery.data?.category_detail?.slug,
      page_size: 3,
    }),
    enabled: !!projectQuery.data?.category_detail?.slug,
  });

  const investMutation = useMutation({
    mutationFn: () => investmentsService.createInvestment({
      project: projectQuery.data!.id,
      amount,
      payment_method: "bank_transfer",
    }),
    onSuccess: async () => {
      toast.success("Investment request submitted.");
      setAmount("");
      setFieldErrors({});
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not submit investment."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.deleteProject(projectQuery.data!.slug),
    onSuccess: () => {
      toast.success("Project deleted.");
      navigate("/projects");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete project."));
    },
  });

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  if (projectQuery.isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Project not found</h1>
        <p className="mb-4 text-sm text-muted-foreground">The project may be private, deleted, or unavailable.</p>
        <Button asChild>
          <Link to="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const project = projectQuery.data;
  const percent = Math.min(Math.round(Number(project.funding_percent)), 100);
  const founder = project.entrepreneur?.business_name || project.entrepreneur?.full_name || "Sahmi founder";
  const related = (relatedQuery.data?.results ?? [])
    .filter((item) => item.id !== project.id)
    .slice(0, 3)
    .map(toProjectCard);
  const canManageProject = !!user && (user.id === project.entrepreneur?.id || user.user_type === "admin");

  const handleInvest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    if (!isAuthenticated) {
      toast.error("Please log in before contributing.");
      return;
    }
    investMutation.mutate();
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="container flex items-center gap-3 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects</Link>
          </Button>
        </div>
      </div>

      <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
        <img src={project.cover_image || fallbackImage} alt={project.title} className="h-full w-full object-cover" />
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="muted">{project.category_detail?.name ?? "Project"}</Badge>
              {project.is_verified && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
              <Badge variant="outline">{project.status}</Badge>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{project.title}</h1>
            <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>by <strong className="text-foreground">{founder}</strong></span>
              <span>|</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>
            </p>
            {canManageProject && (
              <div className="mb-6 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/projects/${project.slug}/edit`}>Edit Project</Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this project? This action will hide it from the platform.")) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                </Button>
              </div>
            )}

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
                {["Overview", "Story", "Funding Plan", "Updates", "Team", "FAQ"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase().replace(" ", "-")}
                    className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">About This Project</h3>
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{project.description}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" /> Transparency Report
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Project status: {project.status}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Verification: {project.is_verified ? "Verified by Sahmi team" : "Pending review"}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Minimum investment: ${Number(project.minimum_investment).toLocaleString()}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Expected ROI: {Number(project.expected_roi).toFixed(2)}%</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="story">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{project.description}</p>
              </TabsContent>

              <TabsContent value="funding-plan">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Funding Details</h3>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">Funding progress</span>
                      <span className="text-muted-foreground">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Goal: ${Number(project.goal_amount).toLocaleString()} | Minimum investment: ${Number(project.minimum_investment).toLocaleString()} | Campaign duration: {project.funding_period_days} days
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="updates">
                <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                  No project updates have been published yet.
                </div>
              </TabsContent>

              <TabsContent value="team">
                <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
                    {founder.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{founder}</h4>
                    <p className="text-sm text-muted-foreground">Project Founder</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {project.entrepreneur?.email}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faq">
                <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                  No FAQ entries have been published for this project yet.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-1 text-3xl font-bold text-primary">${Number(project.funded_amount).toLocaleString()}</div>
                <div className="mb-4 text-sm text-muted-foreground">raised of ${Number(project.goal_amount).toLocaleString()} goal</div>
                <Progress value={percent} className="mb-4 h-3" />
                <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <div className="font-bold text-foreground">{percent}%</div>
                    <div className="text-xs text-muted-foreground">Funded</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{project.investor_count}</div>
                    <div className="text-xs text-muted-foreground">Investors</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{project.days_left ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Days Left</div>
                  </div>
                </div>
                <form className="space-y-3" onSubmit={handleInvest}>
                  <Input
                    type="number"
                    min={Number(project.minimum_investment)}
                    step="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={`Minimum $${Number(project.minimum_investment).toLocaleString()}`}
                    required
                  />
                  {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount}</p>}
                  <Button size="lg" className="w-full" type="submit" disabled={investMutation.isPending}>
                    <Heart className="mr-2 h-4 w-4" /> {investMutation.isPending ? "Submitting..." : "Contribute Now"}
                  </Button>
                </form>
                <Button size="lg" variant="outline" className="mt-3 w-full" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share Project
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Trust & Safety</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Backend-verified project data</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Authenticated investment requests</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Transparent funding totals</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Related Projects</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
