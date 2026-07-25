import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderPlus, RefreshCw, Tags, Trash2 } from "lucide-react";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCategoryDialog from "@/components/admin/AdminCategoryDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import type {
  ProjectCategory,
  ProjectCategoryPayload,
} from "@/services/projectsService";
import adminProjectsService from "@/services/adminProjectsService";
import { getErrorMessage } from "@/services/api";

const AdminCategoriesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ProjectCategory | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: adminProjectsService.listCategories,
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => adminProjectsService.listProjects({ page_size: 100, ordering: "-created_at" }),
    staleTime: 30_000,
  });

  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  const projects = useMemo(() => projectsQuery.data?.results || [], [projectsQuery.data?.results]);

  const refreshAdminData = () => {
    void queryClient.invalidateQueries({ queryKey: ["project-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "category-options"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const saveCategoryMutation = useMutation({
    mutationFn: ({
      category,
      payload,
    }: {
      category: ProjectCategory | null;
      payload: ProjectCategoryPayload;
    }) =>
      category
        ? adminProjectsService.updateCategory(category.id, payload)
        : adminProjectsService.createCategory(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.category ? "admin.updated" : "admin.created", { item: t("admin.categoryItem") }));
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      refreshAdminData();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.categoryItem") }))),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (category: ProjectCategory) => adminProjectsService.deleteCategory(category.id),
    onSuccess: (_, category) => {
      toast.success(t("admin.deleted", { item: category.name }));
      setCategoryToDelete(null);
      refreshAdminData();
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(error, t("admin.categoryDeleteBlocked")),
      ),
  });

  const openCreateDialog = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={Tags}
          eyebrow="Catalogue administration"
          title={t("admin.categoriesTitle")}
          description={t("admin.categoriesText")}
          actions={
            <>
              <Button
                variant="outline"
                className="bg-card/80"
                onClick={() => {
                  void categoriesQuery.refetch();
                  void projectsQuery.refetch();
                }}
                disabled={categoriesQuery.isFetching || projectsQuery.isFetching}
              >
                <RefreshCw
                  className={
                    "h-4 w-4 " +
                    (categoriesQuery.isFetching || projectsQuery.isFetching ? "animate-spin" : "")
                  }
                />{t("admin.refresh")}</Button>
              <Button onClick={openCreateDialog}>
                <FolderPlus className="h-4 w-4" />{t("admin.addCategory")}</Button>
            </>
          }
        />

        <section aria-labelledby="categories-heading">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                <h2 id="categories-heading" className="text-xl font-bold text-foreground">{t("admin.categoryManagement")}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {categoriesQuery.isLoading
                  ? "Loading the catalogue..."
                  : `${categories.length} ${categories.length === 1 ? "category" : "categories"} available.`}
              </p>
            </div>
          </div>

          {categoriesQuery.isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{t("admin.categoriesLoadError")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("admin.refreshPage")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void categoriesQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />{t("common.retry")}</Button>
              </div>
            </div>
          ) : categoriesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : categories.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const projectCount = projects.filter((project) => project.category === category.id).length;
                return (
                  <article
                    key={category.id}
                    className="group flex min-h-40 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Tags className="h-4 w-4" />
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {projectCount} {projectCount === 1 ? "project" : "projects"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{category.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {category.description || "No description has been added yet."}
                    </p>
                    <div className="mt-auto flex items-center justify-end gap-1 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryDialogOpen(true);
                        }}
                      >{t("common.edit")}</Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setCategoryToDelete(category)}
                        disabled={projectCount > 0}
                        aria-label={
                          projectCount > 0
                            ? category.name + " is in use and cannot be deleted"
                            : "Delete " + category.name
                        }
                        title={
                          projectCount > 0
                            ? "Move projects to another category before deleting this one."
                            : "Delete category"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/15 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FolderPlus className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t("admin.createFirstCategory")}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("admin.categoryTip")}</p>
              <Button size="sm" className="mt-4" onClick={openCreateDialog}>{t("admin.addCategory")}</Button>
            </div>
          )}
        </section>

        <AdminCategoryDialog
          open={categoryDialogOpen}
          category={editingCategory}
          onOpenChange={(open) => {
            setCategoryDialogOpen(open);
            if (!open) setEditingCategory(null);
          }}
          onSubmit={(payload) => saveCategoryMutation.mutate({ category: editingCategory, payload })}
          isPending={saveCategoryMutation.isPending}
        />

        <AlertDialog
          open={!!categoryToDelete}
          onOpenChange={(open) => {
            if (!open && !deleteCategoryMutation.isPending) setCategoryToDelete(null);
          }}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <AlertDialogTitle>{t("admin.deleteCategoryQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>
                <strong className="font-semibold text-foreground">{categoryToDelete?.name}</strong> will be
                permanently removed. Categories assigned to projects cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteCategoryMutation.isPending}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteCategoryMutation.isPending}
                onClick={() => categoryToDelete && deleteCategoryMutation.mutate(categoryToDelete)}
              >
                {deleteCategoryMutation.isPending ? "Deleting..." : "Delete category"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCategoriesPage;
