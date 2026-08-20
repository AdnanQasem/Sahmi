import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/i18n/format";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProjectCard from "@/components/ProjectCard";
import projectsService, { Project, ConfirmedPayment } from "@/services/projectsService";
import ProjectCostTable from "@/components/projects/ProjectCostTable";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectUpdateChange from "@/components/projects/ProjectUpdateChange";
import ProjectRepaymentProcess from "@/components/projects/ProjectRepaymentProcess";
import AdminReviewFeedback from "@/components/projects/AdminReviewFeedback";
import RequiredProjectDocuments from "@/components/projects/RequiredProjectDocuments";
import { toProjectCard } from "@/lib/mappers";
import { calculateFundingPercent, fundingProgressBarWidth, fundingProgressColor } from "@/lib/fundingProgress";
import investmentsService from "@/services/investmentsService";
import { API_BASE_URL, getFieldErrors, getErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle, Users, Clock, Heart, Share2, ArrowLeft,
  Calendar, MapPin, FileText, AlertTriangle,
} from "lucide-react";

const fallbackImage = "/placeholder.svg";

const ProjectDetails = () => {
  const { t, i18n: activeI18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsService.getProject(id as string),
    enabled: !!id,
  });

  const contentLanguage = activeI18n.resolvedLanguage?.startsWith("ar") ? "ar" : "en";
  const translationQuery = useQuery({
    queryKey: ["project-translation", id, contentLanguage, projectQuery.data?.updated_at],
    queryFn: () => projectsService.getProjectTranslation(id as string, contentLanguage),
    enabled: !!id && !!projectQuery.data,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
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
  const repaymentsQuery = useQuery({
    queryKey: ["project-repayments", id],
    queryFn: () => projectsService.getProjectRepayments(id as string),
    enabled: !!id && isAuthenticated && projectQuery.data?.status === "completed",
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
          queryClient.invalidateQueries({ queryKey: ["project-repayments", id] }),
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
            queryClient.setQueryData<Project>(["project", id], (oldProject) => {
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
            toast.success(t("projects.confirmedInvestmentNotice", {
              amount: formatCurrency(Number(payment.amount)),
              name: payment.investor_name,
            }));
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
  }, [id, projectQuery.data?.id, queryClient, t]);

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
      toast.error(getErrorMessage(error, t("projects.investmentSubmitFailed")));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.deleteProject(projectQuery.data!.slug),
    onSuccess: () => {
      toast.success(t("projects.deleted"));
      navigate("/projects");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("projects.deleteFailed")));
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
  const percent = calculateFundingPercent(
    Number(project.funded_amount),
    Number(project.goal_amount),
  );
  const progressWidth = fundingProgressBarWidth(percent);
  const progressColor = fundingProgressColor(percent);
  const remainingFunding = Math.max(
    Number(project.goal_amount) - Number(project.funded_amount),
    0,
  );
  const founder = project.entrepreneur?.business_name || project.entrepreneur?.full_name || t("projects.founderFallback");
  const translatedContent = translationQuery.data;
  const publicDescription = translatedContent?.description || project.description;
  const publicCostItems = translatedContent?.cost_items || project.cost_items || [];
  const publicFaqs = translatedContent?.faqs || project.faqs || [];
  const translatedMilestones = new Map(
    (translatedContent?.milestones || []).map((milestone) => [milestone.id, milestone]),
  );
  const publicMilestones = (project.milestones || []).map((milestone) => ({
    ...milestone,
    ...(milestone.id ? translatedMilestones.get(milestone.id) : undefined),
  }));
  const usesRepaymentTab = project.status === "completed";
  const projectTabs = [
    ["overview", "projects.tabs.overview"],
    ["funding-plan", "projects.tabs.fundingPlan"],
    ["timeline", "projects.tabs.timeline"],
    ["recent-payments", usesRepaymentTab ? "projects.tabs.recentRepayments" : "projects.tabs.recentPayments"],
    ["updates", "projects.tabs.updates"],
    ["team", "projects.tabs.team"],
    ["faq", "projects.tabs.faq"],
  ] as const;
  const related = (relatedQuery.data?.results ?? [])
    .filter((item) => item.id !== project.id)
    .slice(0, 3)
    .map(toProjectCard);
  const canManageProject = !!user && (user.id === project.entrepreneur?.id || user.user_type === "admin");
  const postFundingStatusLabel = project.status === "implementation"
    ? t("projects.badges.inImplementation")
    : project.status === "completed"
      ? t(project.repayment_status === "completed" ? "projects.badges.projectCompleted" : "projects.badges.repayingInvestors")
      : t("projects.badges.fullyFunded");

  const handleInvest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (user?.user_type !== "investor") {
      return;
    }
    setShowLoginPrompt(false);
    if (Number(amount) > remainingFunding) {
      setFieldErrors({
        amount: t("projects.exceedingValue", {
          amount: formatCurrency(remainingFunding),
        }),
      });
      return;
    }
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
              <Badge variant="muted">{project.category_detail?.name ?? t("projects.projectFallback")}</Badge>
              {project.is_verified && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />{t("projects.verified")}</Badge>
              )}
              <Badge
                variant={project.status === "completed" ? "success" : "outline"}
                className={["fully_funded", "implementation", "completed"].includes(project.status)
                  ? `border-success/30 ${project.status === "completed" ? "text-white" : "text-success"}`
                  : undefined}
              >
                {["fully_funded", "implementation", "completed"].includes(project.status)
                  ? postFundingStatusLabel
                  : t(`status.${project.status}`, { defaultValue: project.status })}
              </Badge>
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
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  {deleteMutation.isPending ? t("common.deleting") : t("projects.deleteProject")}
                </Button>
                <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !deleteMutation.isPending && setDeleteDialogOpen(open)}>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("projects.deleteProject")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("projects.deleteConfirmation")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteMutation.isPending}>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteMutation.mutate()}
                      >
                        {deleteMutation.isPending ? t("common.deleting") : t("projects.deleteProject")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {canManageProject && (
              <AdminReviewFeedback feedback={project.admin_review_feedback} className="mb-6" />
            )}

            {(user?.is_staff || user?.user_type === "admin") && (
              <RequiredProjectDocuments
                className="mb-6"
                documents={{
                  business_plan: project.business_plan,
                  financial_projections: project.financial_projections,
                  ownership_proof: project.ownership_proof,
                }}
                proposedDocuments={project.pending_edit_request?.files}
              />
            )}

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
                {projectTabs.map(([value, labelKey]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    {t(labelKey)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{t("projects.overview")}</h3>
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{publicDescription}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />{t("projects.transparencyReport")}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> {t("common.status")}: {["fully_funded", "implementation", "completed"].includes(project.status) ? postFundingStatusLabel : t(`status.${project.status}`, { defaultValue: project.status })}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> {t("projects.verificationLabel")}: {t(project.is_verified ? "projects.verifiedByTeam" : "projects.pendingReview")}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> {t("projects.minimumInvestment")}: {formatCurrency(Number(project.minimum_investment))}</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> {t("projects.expectedRoi")}: {formatPercent(Number(project.expected_roi))}</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="funding-plan">
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{t("projects.tabs.fundingPlan")}</span>
                      <span style={{ color: progressColor }}>{formatPercent(percent)}</span>
                    </div>
                    <Progress value={progressWidth} className="h-2" indicatorStyle={{ backgroundColor: progressColor }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("projects.campaignSummary", {
                      goal: formatCurrency(Number(project.goal_amount)),
                      minimum: formatCurrency(Number(project.minimum_investment)),
                      days: formatNumber(project.funding_period_days),
                    })}
                  </p>
                  <div className="space-y-2 pt-2">
                    <h4 className="text-sm font-semibold text-foreground">{t("projects.costTable")}</h4>
                    <ProjectCostTable
                      items={publicCostItems}
                      fundedAmount={Number(project.funded_amount)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">{t("projects.timeline")}</h3>
                <ProjectTimeline milestones={publicMilestones} />
              </TabsContent>

              <TabsContent value="recent-payments" className="space-y-4">
                <div className="space-y-4">
                  {project.status === "completed" && (
                    <ProjectRepaymentProcess
                      repaymentStatus={project.repayment_status}
                      nextRepaymentDate={project.next_repayment_date}
                      totalRepaid={project.total_repaid}
                      repayments={repaymentsQuery.data}
                    />
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{t(project.status === "completed" ? "projects.repaymentSchedule" : "projects.recentBackers")}</h3>
                  {project.status === "completed" ? (
                    !isAuthenticated ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("repaymentDashboard.signInToView")}</div>
                    : repaymentsQuery.isLoading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
                    : repaymentsQuery.isError ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("repaymentDashboard.notAuthorized")}</div>
                    : !repaymentsQuery.data?.length ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noRepayments")}</div>
                    : <div className="grid gap-3">{repaymentsQuery.data.map((repayment) => (
                      <div key={repayment.id} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3 sm:items-center">
                        <div><p className="text-xs text-muted-foreground">{t("projects.scheduledDate")}</p><p className="font-medium text-foreground">{formatDate(repayment.scheduled_date, { dateStyle: "medium" })}</p></div>
                        <div><p className="text-xs text-muted-foreground">{t("common.amount")}</p><p className="font-bold text-primary">{formatCurrency(repayment.amount)}</p></div>
                        <div className="sm:text-end"><Badge variant="outline">{t(`status.${repayment.status}`, { defaultValue: repayment.status })}</Badge>{repayment.actual_payment_date && <p className="mt-1 text-xs text-muted-foreground">{formatDate(repayment.actual_payment_date, { dateStyle: "medium" })}</p>}</div>
                      </div>
                    ))}</div>
                  ) : paymentsQuery.isLoading ? (
                    <div className="text-sm text-muted-foreground">{t("projects.loadingPayments")}</div>
                  ) : !paymentsQuery.data || paymentsQuery.data.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noPayments")}</div>
                  ) : (
                    <div className="grid gap-3">
                      {paymentsQuery.data.map((payment: ConfirmedPayment) => {
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
                {!project.updates?.length ? (
                  <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noUpdates")}</div>
                ) : <div className="space-y-4">{project.updates.map((update) => (
                  <article key={update.id} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs font-medium text-muted-foreground">{formatDate(update.published_at, { dateStyle: "medium", timeStyle: "short" })}</p>
                    <h3 className="mt-1 font-semibold text-foreground">{t("projects.publishedChanges")}</h3>
                    <div className="mt-4 space-y-3">{Object.entries(update.changes).map(([field, change]) => (
                      <ProjectUpdateChange key={field} field={field} change={change} />
                    ))}</div>
                  </article>
                ))}</div>}
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
                {!publicFaqs.length ? <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{t("projects.noFaq")}</div>
                : <div className="space-y-3">{publicFaqs.map((faq, index) => <details key={index} className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer font-semibold text-foreground">{faq.question}</summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div>}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                {["fundraising", "fully_funded", "implementation", "completed"].includes(project.status) ? (
                  <>
                    <div className="mb-1 text-3xl font-bold text-primary">{formatCurrency(Number(project.funded_amount))}</div>
                    <div className="mb-4 text-sm text-muted-foreground">
                      {t("projects.goalOnly", { goal: formatCurrency(Number(project.goal_amount)) })}
                    </div>
                    <Progress value={progressWidth} className="mb-4 h-3" indicatorStyle={{ backgroundColor: progressColor }} />
                    <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <div className="font-bold" style={{ color: progressColor }}>{formatPercent(percent)}</div>
                        <div className="text-xs text-muted-foreground">{t("projects.funded")}</div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{formatNumber(project.investor_count)}</div>
                        <div className="text-xs text-muted-foreground">{t("projects.investors")}</div>
                      </div>
                      <div>
                        {project.status === "fundraising" ? (
                          <>
                            <div className="font-bold text-foreground">{formatNumber(project.days_left ?? 0)}</div>
                            <div className="text-xs text-muted-foreground">{t("projects.daysLeft")}</div>
                          </>
                        ) : (
                          <div className="font-semibold text-success">{postFundingStatusLabel}</div>
                        )}
                      </div>
                    </div>
                    {project.status === "fundraising" && isAuthenticated && (user?.user_type !== "investor" || user?.is_staff) ? (
                      <div className="rounded-lg bg-muted/50 p-4 text-center text-sm font-medium text-muted-foreground">
                        {t("projects.investorsOnly")}
                      </div>
                    ) : project.status === "fundraising" ? (
                      <form className="space-y-3" onSubmit={handleInvest}>
                        <Input
                          type="number"
                          min={Number(project.minimum_investment)}
                          step="1"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          placeholder={t("projects.minimumPlaceholder", { amount: formatCurrency(Number(project.minimum_investment)) })}
                          required
                        />
                        {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount}</p>}
                        <Button size="lg" className="w-full" type="submit" disabled={investMutation.isPending}>
                          <Heart className="me-2 h-4 w-4" /> {investMutation.isPending ? t("common.submitting") : t("projects.investNow")}
                        </Button>
                      </form>
                    ) : (
                      <div className="rounded-lg bg-success/10 p-4 text-center text-sm font-semibold text-success">
                        {t(
                          project.repayment_status === "completed"
                            ? "projects.fundingAndRepaymentsCompleted"
                            : "projects.fundingCompleted",
                        )}
                      </div>
                    )}
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

        {project.status === "completed" && (
          <section className="mt-16 rounded-3xl border border-success/20 bg-success/[0.04] p-6 sm:p-8">
            <div className="mb-6">
              <Badge variant="success" className="mb-3 gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {postFundingStatusLabel}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">{t("projects.successStory.title")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("projects.successStory.description")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicMilestones.map((milestone) => (
                <article key={milestone.id ?? milestone.order} className="rounded-xl border border-success/15 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                    <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{milestone.deliverables || milestone.description}</p>
                  {milestone.actual_completion_date && (
                    <p className="mt-3 text-xs font-medium text-success">
                      {t("projects.successStory.completedOn", {
                        date: formatDate(milestone.actual_completion_date, { dateStyle: "medium" }),
                      })}
                    </p>
                  )}
                </article>
              ))}
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground">{t("projects.successStory.finalEvidence")}</h3>
              {project.images?.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {project.images.map((item) => (
                    <figure key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
                      <img src={item.image} alt={item.alt_text || project.title} className="aspect-video w-full object-cover" loading="lazy" />
                      {item.alt_text && <figcaption className="p-3 text-sm text-muted-foreground">{item.alt_text}</figcaption>}
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  {t("projects.successStory.noPublicEvidence")}
                </p>
              )}
            </div>
          </section>
        )}

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
