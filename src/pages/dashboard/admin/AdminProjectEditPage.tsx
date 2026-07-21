import { FormEvent, useEffect, useState } from "react";
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

const AdminProjectEditPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const isCreating = !projectId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminProjectPayload>(freshAdminProjectForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    if (projectQuery.data) setForm(adminProjectToForm(projectQuery.data));
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
      toast.success(isCreating ? "Project created." : "Project updated.");
      setFieldErrors({});
      void queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "project", project.id] });
      if (isCreating) {
        navigate("/dashboard/admin/projects/" + project.id + "/edit", { replace: true });
      }
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not save this project."));
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
      toast.error("Complete the required project fields before saving.");
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
          <h1 className="text-xl font-semibold text-foreground">Project could not be loaded</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The record may have been removed or your session may have expired.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard/admin/projects">Back to projects</Link>
            </Button>
            <Button onClick={() => void projectQuery.refetch()}>Try again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const project = projectQuery.data;
  const sectionProps = { form, update, errors: fieldErrors };

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={FolderCog}
          eyebrow={isCreating ? "Admin · new project" : "Admin · advanced project editor"}
          title={isCreating ? "Create a project" : "Edit " + (project?.title || "project")}
          description="Every project field and attached asset is available here, including operational values hidden from the public editor."
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to="/dashboard/admin/projects">
                  <ArrowLeft className="h-4 w-4" /> Projects
                </Link>
              </Button>
              {project ? (
                <Button variant="outline" asChild>
                  <Link to={"/projects/" + project.slug} target="_blank">
                    <ExternalLink className="h-4 w-4" /> Public page
                  </Link>
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
                  <FolderCog className="h-4 w-4" /> Identity
                </TabsTrigger>
                <TabsTrigger value="finance" className="gap-2">
                  <Landmark className="h-4 w-4" /> Finance
                </TabsTrigger>
                <TabsTrigger value="moderation" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Moderation
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="gap-2">
                  <BrainCircuit className="h-4 w-4" /> Data & AI
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <FileStack className="h-4 w-4" /> Primary files
                </TabsTrigger>
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
            <p className="text-xs text-muted-foreground">
              Fields marked * are required. Changes become visible immediately after saving.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/dashboard/admin/projects">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="h-4 w-4" />
                {saveMutation.isPending
                  ? "Saving..."
                  : isCreating
                    ? "Create project"
                    : "Save all changes"}
              </Button>
            </div>
          </div>
        </form>

        {project ? (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <AdminProjectAssetsPanel
              projectId={project.id}
              images={project.images || []}
              documents={project.supporting_documents || []}
            />
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Save the project first to add gallery images and supporting documents.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminProjectEditPage;
