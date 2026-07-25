import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import projectsService, { ProjectCreatePayload } from "@/services/projectsService";
import { getFieldErrors, getErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

const EditProject = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminReturnPath = "/dashboard/admin#projects-section";
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ProjectCreatePayload>({
    title: "",
    category: "",
    short_description: "",
    description: "",
    location: "",
    location_governorate: "",
    goal_amount: "",
    minimum_investment: "",
    expected_roi: "",
    funding_period_days: "",
    video_url: "",
    cover_image: null,
  });

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsService.getProject(id as string),
    enabled: !!id,
  });

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: projectsService.listCategories,
  });

  useEffect(() => {
    if (!projectQuery.data) return;
    setForm({
      title: projectQuery.data.title,
      category: projectQuery.data.category,
      short_description: projectQuery.data.short_description,
      description: projectQuery.data.description,
      location: projectQuery.data.location,
      location_governorate: projectQuery.data.location_governorate ?? "",
      goal_amount: projectQuery.data.goal_amount,
      minimum_investment: projectQuery.data.minimum_investment,
      expected_roi: projectQuery.data.expected_roi,
      funding_period_days: String(projectQuery.data.funding_period_days),
      video_url: projectQuery.data.video_url ?? "",
      cover_image: null,
    });
  }, [projectQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => projectsService.updateProject(id as string, form),
    onSuccess: (project) => {
      toast.success(t("projects.successUpdate"));
      navigate(user?.is_staff ? adminReturnPath : `/projects/${project.slug}`);
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error, "Could not update project."));
    },
  });

  const updateForm = (field: keyof ProjectCreatePayload, value: string | File | null) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  if (projectQuery.isLoading) {
    return <div className="container py-16 text-center text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to={user?.is_staff ? adminReturnPath : `/projects/${id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" /> {user?.is_staff ? "Back to Admin" : "Back to Project"}
            </Link>
          </Button>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t("projects.editTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("projects.formIntro")}</p>
        </div>
      </section>

      <form
        className="container max-w-3xl space-y-6 py-8"
        onSubmit={(event) => {
          event.preventDefault();
          updateMutation.mutate();
        }}
      >
        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-5">
            <div>
              <Label htmlFor="title">{t("projects.projectTitle")}</Label>
              <Input id="title" className="mt-1.5" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
              {fieldErrors.title && <p className="mt-1 text-xs text-destructive">{fieldErrors.title}</p>}
            </div>
            <div>
              <Label htmlFor="category">{t("projects.category")}</Label>
              <select id="category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {fieldErrors.category && <p className="mt-1 text-xs text-destructive">{fieldErrors.category}</p>}
            </div>
            <div>
              <Label htmlFor="short_description">{t("projects.shortDescription")}</Label>
              <Textarea id="short_description" className="mt-1.5" rows={3} value={form.short_description} onChange={(event) => updateForm("short_description", event.target.value)} />
              {fieldErrors.short_description && <p className="mt-1 text-xs text-destructive">{fieldErrors.short_description}</p>}
            </div>
            <div>
              <Label htmlFor="description">{t("projects.fullStory")}</Label>
              <Textarea id="description" className="mt-1.5" rows={8} value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
              {fieldErrors.description && <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="location">{t("projects.location")}</Label>
                <Input id="location" className="mt-1.5" value={form.location} onChange={(event) => updateForm("location", event.target.value)} />
                {fieldErrors.location && <p className="mt-1 text-xs text-destructive">{fieldErrors.location}</p>}
              </div>
              <div>
                <Label htmlFor="goal_amount">{t("projects.goalAmount")}</Label>
                <Input id="goal_amount" type="number" className="mt-1.5" value={form.goal_amount} onChange={(event) => updateForm("goal_amount", event.target.value)} />
                {fieldErrors.goal_amount && <p className="mt-1 text-xs text-destructive">{fieldErrors.goal_amount}</p>}
              </div>
              <div>
                <Label htmlFor="minimum_investment">{t("projects.minimumInvestment")}</Label>
                <Input id="minimum_investment" type="number" className="mt-1.5" value={form.minimum_investment} onChange={(event) => updateForm("minimum_investment", event.target.value)} />
              </div>
              <div>
                <Label htmlFor="expected_roi">{t("projects.expectedRoi")} (%)</Label>
                <Input id="expected_roi" type="number" className="mt-1.5" value={form.expected_roi} onChange={(event) => updateForm("expected_roi", event.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="cover_image">{t("projects.replaceCover")}</Label>
              <Input id="cover_image" type="file" accept="image/*" className="mt-1.5" onChange={(event) => updateForm("cover_image", event.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to={user?.is_staff ? adminReturnPath : "/dashboard/entrepreneur"}>{t("common.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
