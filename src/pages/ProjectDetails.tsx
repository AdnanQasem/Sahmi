import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/i18n/format";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProjectCard from "@/components/ProjectCard";
import projectsService, { Project, ConfirmedPayment } from "@/services/projectsService";
import investmentsService from "@/services/investmentsService";
import { API_BASE_URL, getFieldErrors, getErrorMessage } from "@/services/api";
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
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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

  const paymentsQuery = useQuery({
    queryKey: ["project-payments", id],
    queryFn: () => projectsService.getProjectPayments(id as string),
    enabled: !!id,
  });

  const [newPaymentIds, setNewPaymentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id || !projectQuery.data?.id) return;

    let eventSource: EventSource | null = null;
    let pollInterval: number | null = null;
    const projectId = projectQuery.data.id;

    const refreshProjectData = async () => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["project", id] }),
          queryClient.invalidateQueries({ queryKey: ["project-payments", id] }),
          queryClient.invalidateQueries({ queryKey: ["projects"] }),
        ]);
      } catch (err) {
        console.error("Error refreshing project data", err);
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      void refreshProjectData();
      pollInterval = window.setInterval(() => {
        void refreshProjectData();
      }, 8000);
    };

    const connectSSE = () => {
      const baseUrl = API_BASE_URL.replace(/\/?$/, "/");
      const url = `${baseUrl}projects/${id}/events/`;
      
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "error") {
            startPolling();
            return;
          }

          if (payload.type === "investment_confirmed" && payload.project_id === projectId) {
            const payment = payload.payment as ConfirmedPayment | undefined;
            if (!payment) return;

            // Update project totals in React Query cache
            queryClient.setQueryData(["project", id], (oldProject: any) => {
              if (!oldProject) return oldProject;
              return {
                ...oldProject,
                funded_amount: String(payload.funded_amount),
                investor_count: payload.investor_count,
                funding_percent: payload.funding_percent,
              };
            });

            // Append new payment to the payments list in cache
            queryClient.setQueryData<ConfirmedPayment[]>(["project-payments", id], (oldPayments) => {
              const list = oldPayments || [];
              if (list.some((p) => p.id === payment.id)) {
                return list;
              }
              return [payment, ...list];
            });

            // Highlight the new payment card
            setNewPaymentIds((prev) => {
              const next = new Set(prev);
              next.add(payment.id);
              return next;
            });
            setTimeout(() => {
              setNewPaymentIds((prev) => {
                const next = new Set(prev);
                next.delete(payment.id);
                return next;
              });
            }, 5000);

            void refreshProjectData();
            toast.success(`Investment of ${formatCurrency(Number(payment.amount))} by ${payment.investor_name} has been confirmed.`);
          }
        } catch (err) {
          console.error("Error parsing SSE event data", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("SSE connection error, falling back to polling...", err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startPolling();
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [id, projectQuery.data?.id, queryClient]);

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginPrompt(false);
    }
  }, [isAuthenticated]);

  const investMutation = useMutation({
    mutationFn: () => investmentsService.createInvestment({
      project: projectQuery.data!.id,
      amount,
      payment_method: "bank_transfer",
    }),
    onSuccess: async () => {
      toast.success(t("projects.investmentSubmitted"));
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
      toast.success(t("projects.deleted"));
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
        {t("dashboard.projectLoading")}
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">{t("projects.notFound")}</h1>
        <p className="mb-4 text-sm text-muted-foreground">{t("projects.unavailable")}</p>
        <Button asChild>
          <Link to="/projects">{t("projects.backToProjects")}</Link>
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
      setShowLoginPrompt(true);
      return;
    }
    setShowLoginPrompt(false);
    investMutation.mutate();
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="container flex items-center gap-3 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects"><ArrowLeft className="me-1 h-4 w-4 rtl-flip" /> {t("projects.backToProjects")}</Link>
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
                  <CheckCircle className="h-3 w-3" />{t("projects.verified")}</Badge>
              )}
              <Badge variant="outline">{t(`status.${project.status}`, { defaultValue: project.status })}</Badge>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{project.title}</h1>
            <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{t("projects.by", { name: "" })} <strong className="text-foreground">{founder}</strong></span>
              <span>|</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>
            </p>
            {canManageProject && (
              <div className="mb-6 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/projects/${project.slug}/edit`}>{t("common.edit")}</Link>
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
                {["Overview", "Story", "Funding Plan", "Recent Payments", "Updates", "Team", "FAQ"].map((tab) => (
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
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{t("projects.overview")}</h3>
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{project.description}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />{t("projects.transparencyReport")}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> {t("common.status")}: {t(`status.${project.status}`, { defaultValue: project.status })}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Verification: {project.is_verified ? "Verified by Sahmi team" : "Pending review"}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Minimum investment: {formatCurrency(Number(project.minimum_investment))}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Expected ROI: {Number(project.expected_roi).toFixed(2)}%</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="story">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{project.description}</p>
              </TabsContent>

              <TabsContent value="funding-plan">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{t("projects.fundingProgress")}</h3>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{t("projects.fundingProgress")}</span>
                      <span className="text-muted-foreground">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Goal: {formatCurrency(Number(project.goal_amount))} | Minimum investment: {formatCurrency(Number(project.minimum_investment))} | Campaign duration: {project.funding_period_days} days
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="recent-payments" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{t("projects.recentBackers")}</h3>
                  {paymentsQuery.isLoading ? (
                    <div className="text-sm text-muted-foreground">{t("projects.loadingPayments")}</div>
                  ) : !paymentsQuery.data || paymentsQuery.data.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noPayments")}</div>
                  ) : (
                    <div className="grid gap-3">
                      {paymentsQuery.data.map((payment: any) => {
                        const isHighlighted = newPaymentIds.has(payment.id);
                        return (
                          <div
                            key={payment.id}
                            className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-1000 ${
                              isHighlighted
                                ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/15 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]"
                                : "border-border bg-card"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                {payment.investor_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{payment.investor_name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <span>{formatDate(payment.date, { dateStyle: "medium" })}</span>
                                  <span>•</span>
                                  <span className="capitalize">{t(`payment.${payment.payment_method}`, { defaultValue: payment.payment_method })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary text-base">{formatCurrency(Number(payment.amount))}</div>
                              <div className="text-xs text-success font-medium">{t("status.confirmed")}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="updates">
                <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noUpdates")}</div>
              </TabsContent>

              <TabsContent value="team">
                <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
                    {founder.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{founder}</h4>
                    <p className="text-sm text-muted-foreground">{t("projects.founderLabel")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {project.entrepreneur?.email}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faq">
                <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noFaq")}</div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                {project.status === "active" ? (
                  <>
                    <div className="mb-1 text-3xl font-bold text-primary">{formatCurrency(Number(project.funded_amount))}</div>
                    <div className="mb-4 text-sm text-muted-foreground">raised of {formatCurrency(Number(project.goal_amount))} goal</div>
                    <Progress value={percent} className="mb-4 h-3" />
                    <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <div className="font-bold text-foreground">{percent}%</div>
                        <div className="text-xs text-muted-foreground">{t("projects.funded")}</div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{project.investor_count}</div>
                        <div className="text-xs text-muted-foreground">{t("projects.investors")}</div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{project.days_left ?? 0}</div>
                        <div className="text-xs text-muted-foreground">{t("projects.daysLeft")}</div>
                      </div>
                    </div>
                    <form className="space-y-3" onSubmit={handleInvest}>
                      <Input
                        type="number"
                        min={Number(project.minimum_investment)}
                        step="1"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder={`Minimum ${formatCurrency(Number(project.minimum_investment))}`}
                        required
                      />
                      {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount}</p>}
                      <Button size="lg" className="w-full" type="submit" disabled={investMutation.isPending}>
                        <Heart className="mr-2 h-4 w-4" /> {investMutation.isPending ? "Submitting..." : "Contribute Now"}
                      </Button>
                    </form>
                    {showLoginPrompt && (
                      <Alert className="mt-4 border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-foreground shadow-sm [&>svg]:text-primary">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-primary">{t("errors.unauthorized")}</AlertTitle>
                        <AlertDescription className="space-y-3">
                          <p>{t("errors.unauthorized")}</p>
                          <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary hover:to-primary shadow-sm shadow-primary/20" asChild>
                            <Link to="/login">{t("projects.loginToInvest")}</Link>
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{t("projects.comingSoon")}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{t("projects.comingSoonText")}</p>
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                      <p className="mb-1 font-medium text-foreground">{t("projects.goalAmount")}</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(Number(project.goal_amount))}</p>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">{t("projects.activeContribution")}</p>
                  </div>
                )}
                <Button size="lg" variant="outline" className="mt-4 w-full" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  <Share2 className="mr-2 h-4 w-4" />{t("projects.share")}</Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="mb-3 text-sm font-semibold text-foreground">{t("projects.trustSafety")}</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {t("projects.verifiedData")}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {t("projects.authenticatedRequests")}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {t("projects.transparentTotals")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">{t("home.featured")}</h2>
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
