import { useTranslation } from "react-i18next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BrainCircuit,
  ExternalLink,
  FileStack,
  FolderCog,
  Landmark,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../DashboardLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProjectAssetsPanel from "@/components/admin/AdminProjectAssetsPanel";
import AdminProjectFileFields from "@/components/admin/project-edit/AdminProjectFileFields";
import AdminProjectFinanceFields from "@/components/admin/project-edit/AdminProjectFinanceFields";
import {
  AdminProjectGovernanceFields,
  AdminProjectIntelligenceFields,
} from "@/components/admin/project-edit/AdminProjectGovernanceFields";
import AdminProjectIdentityFields from "@/components/admin/project-edit/AdminProjectIdentityFields";
import {
  adminProjectToForm,
  freshAdminProjectForm,
} from "@/components/admin/project-edit/adminProjectForm";
import type {
  AdminProjectFormValue,
  AdminProjectUpdate,
} from "@/components/admin/project-edit/AdminProjectFormTypes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage, getFieldErrors } from "@/services/api";
import adminProjectsService, {
  type AdminProjectPayload,
} from "@/services/adminProjectsService";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { formDemoData } from "@/demo/formDemoData";
import { createProjectDemoDocuments, loadProjectDemoFiles } from "@/demo/demoFiles";

const AdminProjectEditPage = () => {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const isCreating = !projectId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminProjectPayload>(freshAdminProjectForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const initializedProjectId = useRef<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ["admin", "project", projectId],
    queryFn: () => adminProjectsService.getProject(projectId as string),
    enabled: !isCreating,
  });

  const ownersQuery = useQuery({
    queryKey: ["admin", "project-owner-options"],
    queryFn: adminProjectsService.listOwners,
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "category-options"],
    queryFn: adminProjectsService.listCategories,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!projectQuery.data || initializedProjectId.current === projectQuery.data.id) return;
    setForm(adminProjectToForm(projectQuery.data));
    initializedProjectId.current = projectQuery.data.id;
  }, [projectQuery.data]);

  const update: AdminProjectUpdate = (key, value: AdminProjectFormValue) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: AdminProjectPayload) =>
      isCreating
        ? adminProjectsService.createProject(payload)
        : adminProjectsService.updateProject(projectId as string, payload),
    onSuccess: (project) => {
      toast.success(t(isCreating ? "admin.created" : "admin.updated", { item: t("admin.projectItem") }));
      setFieldErrors({});
      void queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "project", project.id] });
      if (isCreating) {
        navigate("/dashboard/admin/projects/" + project.id + "/edit", { replace: true });
      }
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.projectItem") })));
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.entrepreneur ||
      !form.category ||
      !form.title.trim() ||
      !form.short_description.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.goal_amount
    ) {
      toast.error(t("admin.requiredProjectFields"));
      return;
    }

    saveMutation.mutate({
      ...form,
      title: form.title.trim(),
      slug: form.slug?.trim(),
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      location_governorate: form.location_governorate?.trim(),
      end_date: form.end_date || null,
      verified_by: form.verified_by || null,
      verified_at: form.verified_at || null,
      ai_confidence_score: form.ai_confidence_score || null,
      ai_classification_at: form.ai_classification_at || null,
      next_repayment_date: form.next_repayment_date || null,
      deleted_at: form.deleted_at || null,
    });
  };

  if (!isCreating && projectQuery.isPending) {
    return (
      <DashboardLayout roleBase="/dashboard/admin">
        <div className="space-y-5">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-[34rem] w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isCreating && projectQuery.isError) {
    return (
      <DashboardLayout roleBase="/dashboard/admin">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center">
          <h1 className="text-xl font-semibold text-foreground">{t("admin.projectLoadError")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.recordUnavailable")}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard/admin/projects">{t("admin.backProjects")}</Link>
            </Button>
            <Button onClick={() => void projectQuery.refetch()}>{t("admin.tryAgain")}</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const project = projectQuery.data;
  const sectionProps = { form, update, errors: fieldErrors };
  const fillProjectDemo = async () => {
    const { projectDemoPresets } = await import("@/demo/projectDemoPresets");
    const preset = projectDemoPresets[0];
    const documents = createProjectDemoDocuments(preset);
    const demoFiles = await loadProjectDemoFiles(preset).catch(() => null);
    if (!demoFiles) toast.error(t("projects.demoFilesFailed", { defaultValue: "Demo text was filled, but the sample files could not be loaded." }));
    const futureDate = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    setForm((current) => ({
      ...current,
      entrepreneur: current.entrepreneur || ownersQuery.data?.[0]?.id || "",
      category: current.category || categoriesQuery.data?.[0]?.id || "",
      title: preset.title,
      slug: "",
      short_description: preset.summary,
      description: `${preset.title} will establish a locally operated ${preset.sector} venture in ${preset.location}. The project uses measurable milestones, documented spending, and transparent progress updates to address a practical community need.`,
      location: preset.location,
      location_governorate: preset.governorate,
      goal_amount: String(preset.goal),
      minimum_investment: "100",
      expected_roi: "8",
      funding_period_days: 45,
      cost_items: [
        { name: "1", description: "Equipment and installation", quantity: "1", unit_cost: "21600" },
        { name: "2", description: "Materials and operating setup", quantity: "1", unit_cost: "16800" },
        { name: "3", description: "Training, launch, and contingency", quantity: "1", unit_cost: "9600" },
      ],
      milestones: [
        { title: "Procurement and preparation", description: "Confirm suppliers, prepare the site, and procure approved equipment.", deliverables: "Supplier agreements, prepared site, and procurement records", target_date: futureDate(30), percentage_of_project: "30", order: 1 },
        { title: "Installation and training", description: "Install equipment and train the operating team.", deliverables: "Installed equipment, training records, and operating procedures", target_date: futureDate(60), percentage_of_project: "40", order: 2 },
        { title: "Launch and review", description: "Launch operations and review initial performance.", deliverables: "Launch report, initial service records, and performance summary", target_date: futureDate(90), percentage_of_project: "30", order: 3 },
      ],
      verification_notes: formDemoData.review,
      ai_classified_category: preset.sector,
      ai_generated_summary: preset.summary,
      business_plan: documents.businessPlan,
      financial_projections: documents.financialProjections,
      ownership_proof: documents.ownershipProof,
      ...(demoFiles ? { cover_image: demoFiles.coverImage } : {}),
    }));
  };

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={FolderCog}
          eyebrow={t(isCreating ? "admin.newProjectEyebrow" : "admin.advancedEditorEyebrow")}
          title={isCreating ? t("admin.createProject") : t("admin.editProject", { title: project?.title || t("dashboard.project") })}
          description={t("admin.projectEditorText")}
          actions={
            <>
              <DemoFillButton onClick={() => void fillProjectDemo()} disabled={!ownersQuery.data?.length || !categoriesQuery.data?.length} />
              <Button variant="outline" asChild>
                <Link to="/dashboard/admin/projects">
                  <ArrowLeft className="h-4 w-4 rtl-flip" />{t("admin.projects")}</Link>
              </Button>
              {project ? (
                <Button variant="outline" asChild>
                  <Link to={"/projects/" + project.slug} target="_blank">
                    <ExternalLink className="h-4 w-4" />{t("admin.publicPage")}</Link>
                </Button>
              ) : null}
            </>
          }
        />

        <form
          onSubmit={submit}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <Tabs defaultValue="identity">
            <div className="border-b border-border p-3 sm:p-4">
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-muted/60 p-1">
                <TabsTrigger value="identity" className="gap-2">
                  <FolderCog className="h-4 w-4" />{t("admin.identity")}</TabsTrigger>
                <TabsTrigger value="finance" className="gap-2">
                  <Landmark className="h-4 w-4" />{t("admin.finance")}</TabsTrigger>
                <TabsTrigger value="moderation" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />{t("admin.moderation")}</TabsTrigger>
                <TabsTrigger value="intelligence" className="gap-2">
                  <BrainCircuit className="h-4 w-4" />{t("admin.dataAi")}</TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <FileStack className="h-4 w-4" />{t("admin.primaryFiles")}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="identity" className="m-0 p-5 sm:p-7">
              <AdminProjectIdentityFields
                {...sectionProps}
                owners={ownersQuery.data || []}
                categories={categoriesQuery.data || []}
              />
            </TabsContent>
            <TabsContent value="finance" className="m-0 p-5 sm:p-7">
              <AdminProjectFinanceFields {...sectionProps} />
            </TabsContent>
            <TabsContent value="moderation" className="m-0 p-5 sm:p-7">
              <AdminProjectGovernanceFields
                {...sectionProps}
                owners={ownersQuery.data || []}
              />
            </TabsContent>
            <TabsContent value="intelligence" className="m-0 p-5 sm:p-7">
              <AdminProjectIntelligenceFields {...sectionProps} />
            </TabsContent>
            <TabsContent value="files" className="m-0 p-5 sm:p-7">
              <AdminProjectFileFields {...sectionProps} project={project} />
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("admin.requiredFieldsNotice")}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/dashboard/admin/projects">{t("common.cancel")}</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="h-4 w-4" />
                {saveMutation.isPending
                  ? t("common.saving")
                  : isCreating
                    ? t("admin.createProject")
                    : t("admin.saveAllChanges")}
              </Button>
            </div>
          </div>
        </form>

        {project ? (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <AdminProjectAssetsPanel
              projectId={project.id}
              projectTitle={project.title}
              images={project.images || []}
              documents={project.supporting_documents || []}
            />
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("admin.saveBeforeFiles")}</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminProjectEditPage;
