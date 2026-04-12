import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/ProjectCard";
import { Search, SlidersHorizontal } from "lucide-react";
import projectsService, { Project } from "@/services/projectsService";

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

const BrowseProjects = () => {
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

  const projectsQuery = useQuery({
    queryKey: ["projects", { search, selectedCategory, ordering }],
    queryFn: () => projectsService.listProjects({
      search: search || undefined,
      category: selectedCategory === "All" ? undefined : selectedCategory,
      ordering,
    }),
  });

  const categories = ["All", ...(categoriesQuery.data?.map((category) => category.name) ?? [])];
  const categorySlugByName = new Map(categoriesQuery.data?.map((category) => [category.name, category.slug]) ?? []);
  const selectedCategorySlug = selectedCategory === "All" ? "All" : categorySlugByName.get(selectedCategory) ?? selectedCategory;
  const projects = projectsQuery.data?.results.map(toProjectCard) ?? [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border bg-card py-10">
        <div className="container">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Explore Projects</h1>
          <p className="text-muted-foreground">Discover verified projects creating real impact in Palestine.</p>
        </div>
      </section>

      <div className="container py-8">
        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="most-funded">Most Funded</option>
            <option value="ending-soon">Ending Soon</option>
          </select>
        </div>

        {/* Category chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === "All" ? "All" : categorySlugByName.get(cat) ?? cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategorySlug === (cat === "All" ? "All" : categorySlugByName.get(cat))
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {projectsQuery.isLoading ? (
          <div className="rounded-xl border border-border bg-card p-16 text-center text-sm text-muted-foreground">
            Loading projects...
          </div>
        ) : projectsQuery.isError ? (
          <div className="rounded-xl border border-border bg-card p-16 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Could not load projects</h3>
            <p className="text-sm text-muted-foreground">Check the backend API and try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => projectsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-16 text-center">
            <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No projects found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSelectedCategory("All"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProjects;
