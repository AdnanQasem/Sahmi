import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/ProjectCard";
import { Search, SlidersHorizontal } from "lucide-react";
import projectsService from "@/services/projectsService";
import { useTranslation } from "react-i18next";
import { toProjectCard } from "@/lib/mappers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 9;
const FUNDED_PAGE_SIZE = 6;
const validSorts = new Set(["trending", "newest", "most-funded", "ending-soon"]);
const positivePage = (value: string | null) => Math.max(1, Number.parseInt(value ?? "1", 10) || 1);

const BrowseProjects = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const selectedCategory = searchParams.get("category") ?? "all";
  const requestedSort = searchParams.get("sort") ?? "trending";
  const sortBy = validSorts.has(requestedSort) ? requestedSort : "trending";
  const page = positivePage(searchParams.get("page"));
  const fundedPage = positivePage(searchParams.get("funded_page"));

  const updateParams = (updates: Record<string, string | number | null>, replace = false) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || value === "trending" || value === 1) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace });
  };

  useEffect(() => setSearch(urlSearch), [urlSearch]);

  useEffect(() => {
    if (search === urlSearch) return;
    const timeout = window.setTimeout(() => updateParams({ search: search.trim() || null, page: null }, true), 300);
    return () => window.clearTimeout(timeout);
  }, [search, urlSearch]); // eslint-disable-line react-hooks/exhaustive-deps

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
    queryKey: ["projects", "active", { search: urlSearch, selectedCategory, ordering, page }],
    queryFn: () => projectsService.listProjects({
      search: urlSearch || undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
      ordering,
      status: "fundraising",
      page,
      page_size: PAGE_SIZE,
    }),
  });

  const fundedProjectsQuery = useQuery({
    queryKey: ["projects", "successful", fundedPage],
    queryFn: () => projectsService.listProjects({
      ordering: "-funded_amount",
      page: fundedPage,
      page_size: FUNDED_PAGE_SIZE,
    }),
  });

  const categories = ["All", ...(categoriesQuery.data?.map((category) => category.name) ?? [])];
  const categorySlugByName = new Map(categoriesQuery.data?.map((category) => [category.name, category.slug]) ?? []);
  const selectedCategorySlug = selectedCategory;
  const activeProjects = activeProjectsQuery.data?.results
    .filter((project) => project.status === "fundraising" && Number(project.funded_amount) < Number(project.goal_amount))
    .map(toProjectCard) ?? [];
  const fundedProjects = fundedProjectsQuery.data?.results
    .filter((project) => (
      ["fully_funded", "implementation", "completed"].includes(project.status)
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
          <Select value={sortBy} onValueChange={(value) => updateParams({ sort: value, page: null })}>
            <SelectTrigger className="w-full md:w-48" aria-label={t("projects.sortBy")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">{t("projects.trending")}</SelectItem>
              <SelectItem value="newest">{t("projects.newest")}</SelectItem>
              <SelectItem value="most-funded">{t("projects.mostFunded")}</SelectItem>
              <SelectItem value="ending-soon">{t("projects.endingSoon")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat === "All" ? t("projects.allCategories") : cat}
              onClick={() => updateParams({ category: cat === "All" ? null : categorySlugByName.get(cat) ?? cat, page: null })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategorySlug === (cat === "All" ? "all" : categorySlugByName.get(cat))
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
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSearchParams({}); }}>{t("projects.clearFilters")}</Button>
            </div>
          )}
          {(activeProjectsQuery.data?.previous || activeProjectsQuery.data?.next) && <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("common.paginationSummary", { first: (page - 1) * PAGE_SIZE + 1, last: Math.min(page * PAGE_SIZE, activeProjectsQuery.data.count), count: activeProjectsQuery.data.count })}</p>
            <div className="flex gap-2"><Button variant="outline" disabled={!activeProjectsQuery.data.previous} onClick={() => updateParams({ page: page - 1 })}>{t("common.previous")}</Button><Button variant="outline" disabled={!activeProjectsQuery.data.next} onClick={() => updateParams({ page: page + 1 })}>{t("common.next")}</Button></div>
          </div>}
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
          {(fundedProjectsQuery.data?.previous || fundedProjectsQuery.data?.next) && <div className="mt-8 flex items-center justify-end gap-2"><Button variant="outline" disabled={!fundedProjectsQuery.data.previous} onClick={() => updateParams({ funded_page: fundedPage - 1 })}>{t("common.previous")}</Button><Button variant="outline" disabled={!fundedProjectsQuery.data.next} onClick={() => updateParams({ funded_page: fundedPage + 1 })}>{t("common.next")}</Button></div>}
        </section>
      </div>
    </div>
  );
};

export default BrowseProjects;
