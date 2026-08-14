import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/ProjectCard";
import { Search, SlidersHorizontal } from "lucide-react";
import projectsService, { Project } from "@/services/projectsService";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

const fallbackImage = "/placeholder.svg";

const toProjectCard = (project: Project) => ({
  id: project.id,
  slug: project.slug,
  title: project.title,
  description: project.short_description || project.description,
  category: project.category_detail?.name ?? i18n.t("projects.projectFallback"),
  founder: project.entrepreneur?.business_name || project.entrepreneur?.full_name || i18n.t("projects.founderFallback"),
  image: project.cover_image || fallbackImage,
  goal: Number(project.goal_amount),
  raised: Number(project.funded_amount),
  investors: project.investor_count,
  daysLeft: project.days_left ?? 0,
  repaymentStatus: project.repayment_status,
  verified: project.is_verified,
});

const BrowseProjects = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("trending");

  const categoriesQuery = useQuery({
    queryKey: ["project-categories"],
    queryFn: projectsService.listCategories,
  });

  const ordering =
    sortBy === "newest" ? "-created_at" :
    sortBy === "most-funded" ? "-funded_amount" :
    sortBy === "ending-soon" ? "end_date" :
    "-investor_count";

  const activeProjectsQuery = useQuery({
    queryKey: ["projects", "active", { search, selectedCategory, ordering }],
    queryFn: () => projectsService.listProjects({
      search: search || undefined,
      category: selectedCategory === "All" ? undefined : selectedCategory,
      ordering,
      status: "active",
      page_size: 100,
    }),
  });

  const fundedProjectsQuery = useQuery({
    queryKey: ["projects", "successful"],
    queryFn: () => projectsService.listProjects({
      ordering: "-funded_amount",
      page_size: 100,
    }),
  });

  const categories = ["All", ...(categoriesQuery.data?.map((category) => category.name) ?? [])];
  const categorySlugByName = new Map(categoriesQuery.data?.map((category) => [category.name, category.slug]) ?? []);
  const selectedCategorySlug = selectedCategory === "All" ? "All" : categorySlugByName.get(selectedCategory) ?? selectedCategory;
  const activeProjects = activeProjectsQuery.data?.results
    .filter((project) => project.status === "active" && Number(project.funded_amount) < Number(project.goal_amount))
    .map(toProjectCard) ?? [];
  const fundedProjects = fundedProjectsQuery.data?.results
    .filter((project) => (
      project.status === "successful"
      || (Number(project.goal_amount) > 0 && Number(project.funded_amount) >= Number(project.goal_amount))
    ))
    .map(toProjectCard) ?? [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border bg-card py-10">
        <div className="container">
          <h1 className="mb-2 text-3xl font-bold text-foreground">{t("projects.title")}</h1>
          <p className="text-muted-foreground">{t("projects.subtitle")}</p>
        </div>
      </section>

      <div className="container py-8">
        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("projects.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="trending">{t("projects.trending")}</option>
            <option value="newest">{t("projects.newest")}</option>
            <option value="most-funded">{t("projects.mostFunded")}</option>
            <option value="ending-soon">{t("projects.endingSoon")}</option>
          </select>
        </div>

        {/* Category chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat === "All" ? t("projects.allCategories") : cat}
              onClick={() => setSelectedCategory(cat === "All" ? "All" : categorySlugByName.get(cat) ?? cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategorySlug === (cat === "All" ? "All" : categorySlugByName.get(cat))
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {cat === "All" ? t("projects.allCategories") : cat}
            </button>
          ))}
        </div>

        {/* Active opportunities */}
        <section aria-labelledby="active-opportunities-heading">
          <h2 id="active-opportunities-heading" className="mb-5 text-2xl font-bold text-foreground">
            {t("projects.activeOpportunities")}
          </h2>

          {activeProjectsQuery.isLoading ? (
            <div className="rounded-xl border border-border bg-card p-16 text-center text-sm text-muted-foreground">
              {t("projects.loading")}
            </div>
          ) : activeProjectsQuery.isError ? (
            <div className="rounded-xl border border-border bg-card p-16 text-center">
              <h3 className="mb-2 text-lg font-semibold text-foreground">{t("projects.loadError")}</h3>
              <p className="text-sm text-muted-foreground">{t("errors.network")}</p>
              <Button variant="outline" className="mt-4" onClick={() => activeProjectsQuery.refetch()}>{t("common.retry")}</Button>
            </div>
          ) : activeProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-16 text-center">
              <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">{t("projects.noResults")}</h3>
              <p className="text-sm text-muted-foreground">{t("projects.noResults")}</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSelectedCategory("All"); }}>{t("projects.clearFilters")}</Button>
            </div>
          )}
        </section>

        {/* Successfully funded projects */}
        <section
          aria-labelledby="successfully-funded-heading"
          className="mt-16 rounded-3xl border border-success/20 bg-success/[0.04] p-5 sm:p-8"
        >
          <div className="mb-6">
            <h2 id="successfully-funded-heading" className="text-2xl font-bold text-foreground">
              {t("projects.successfullyFundedProjects")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("projects.successfullyFundedDescription")}
            </p>
          </div>

          {fundedProjectsQuery.isLoading ? (
            <div className="rounded-xl border border-success/15 bg-card/70 p-12 text-center text-sm text-muted-foreground">
              {t("projects.loading")}
            </div>
          ) : fundedProjectsQuery.isError ? (
            <div className="rounded-xl border border-success/15 bg-card/70 p-12 text-center">
              <p className="text-sm text-muted-foreground">{t("projects.loadError")}</p>
              <Button variant="outline" className="mt-4" onClick={() => fundedProjectsQuery.refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : fundedProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fundedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} successfullyFunded />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-success/15 bg-card/70 p-10 text-center text-sm text-muted-foreground">
              {t("projects.noSuccessfullyFundedProjects")}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowseProjects;
