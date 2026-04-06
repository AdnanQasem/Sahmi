import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectCard from "@/components/ProjectCard";
import { sampleProjects } from "@/data/sampleProjects";
import {
  CheckCircle, Users, Clock, Heart, Share2, ArrowLeft,
  Calendar, MapPin, FileText, MessageSquare, AlertTriangle,
} from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();
  const project = sampleProjects.find((p) => p.id === id) || sampleProjects[0];
  const percent = Math.min(Math.round((project.raised / project.goal) * 100), 100);
  const related = sampleProjects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Back nav */}
      <div className="border-b border-border bg-card">
        <div className="container flex items-center gap-3 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects</Link>
          </Button>
        </div>
      </div>

      {/* Hero image */}
      <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
        <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="muted">{project.category}</Badge>
              {project.verified && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{project.title}</h1>
            <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span>by <strong className="text-foreground">{project.founder}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Palestine</span>
            </p>

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
                  <p className="leading-relaxed text-muted-foreground">
                    {project.description} This project aims to create sustainable, long-term impact
                    by combining community engagement with innovative solutions. Every contribution
                    directly supports the local economy and creates opportunities for future growth.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" /> Transparency Report
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Project verified by Sahmi team</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Founder identity confirmed</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Funding plan reviewed and approved</li>
                    <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-success" /> Regular updates required</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="story">
                <p className="leading-relaxed text-muted-foreground">
                  This project was born from a deep commitment to strengthening our community.
                  As a Palestinian entrepreneur, I've seen firsthand the challenges our people face
                  and the incredible resilience that drives us forward. Through this initiative,
                  we aim to build something lasting — something that creates real jobs,
                  real opportunity, and real hope.
                </p>
              </TabsContent>

              <TabsContent value="funding-plan">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">How Funds Will Be Used</h3>
                  {[
                    { label: "Equipment & Materials", pct: 40 },
                    { label: "Operations & Setup", pct: 25 },
                    { label: "Team & Training", pct: 20 },
                    { label: "Marketing & Outreach", pct: 10 },
                    { label: "Contingency", pct: 5 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{item.pct}%</span>
                      </div>
                      <Progress value={item.pct} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="updates">
                <div className="space-y-4">
                  {[
                    { date: "Mar 15, 2026", title: "Milestone reached: 50% funded!", text: "We're halfway there! Thank you to all our amazing supporters." },
                    { date: "Mar 1, 2026", title: "Project launched on Sahmi", text: "Excited to share our vision with the community. Let's make this happen together." },
                  ].map((u) => (
                    <div key={u.date} className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> {u.date}
                      </div>
                      <h4 className="mb-1 text-sm font-semibold text-foreground">{u.title}</h4>
                      <p className="text-sm text-muted-foreground">{u.text}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="team">
                <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
                    {project.founder.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{project.founder}</h4>
                    <p className="text-sm text-muted-foreground">Project Founder</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Passionate entrepreneur dedicated to building sustainable solutions for Palestinian communities.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faq">
                <div className="space-y-4">
                  {[
                    { q: "How will my contribution be used?", a: "100% of contributions go directly to the project. You can see the detailed funding breakdown in the Funding Plan tab." },
                    { q: "What happens if the goal isn't reached?", a: "If the project doesn't reach its minimum funding goal, all contributions are returned to supporters." },
                    { q: "How can I track progress?", a: "Project owners post regular updates, and you'll receive notifications on milestones and key developments." },
                  ].map((faq) => (
                    <div key={faq.q} className="rounded-lg border border-border bg-card p-4">
                      <h4 className="mb-2 text-sm font-semibold text-foreground">{faq.q}</h4>
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar funding card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-1 text-3xl font-bold text-primary">${project.raised.toLocaleString()}</div>
                <div className="mb-4 text-sm text-muted-foreground">raised of ${project.goal.toLocaleString()} goal</div>
                <Progress value={percent} className="mb-4 h-3" />
                <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <div className="font-bold text-foreground">{percent}%</div>
                    <div className="text-xs text-muted-foreground">Funded</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{project.supporters}</div>
                    <div className="text-xs text-muted-foreground">Supporters</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{project.daysLeft}</div>
                    <div className="text-xs text-muted-foreground">Days Left</div>
                  </div>
                </div>
                <Button size="lg" className="mb-3 w-full">
                  <Heart className="mr-2 h-4 w-4" /> Contribute Now
                </Button>
                <Button size="lg" variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" /> Share Project
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Trust & Safety</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Verified project</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Funds held securely</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Transparent reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Related Projects</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectDetails;
