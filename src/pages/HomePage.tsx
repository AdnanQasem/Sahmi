import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/ProjectCard";
import projectsService, { Project } from "@/services/projectsService";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BadgeCheck,
  TrendingUp,
  Users,
  Heart,
  Eye,
  Lightbulb,
  Star,
  UserCheck,
  Quote,
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

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const stats = [
  { label: "Projects Funded", value: "230+", icon: TrendingUp },
  { label: "Total Raised", value: "$2.4M", icon: Heart },
  { label: "Supporters", value: "12,000+", icon: Users },
  { label: "Success Rate", value: "89%", icon: Star },
];

const steps = [
  {
    icon: Lightbulb,
    title: "Submit Your Project",
    description: "Share your idea and goal. We review all projects to ensure quality and transparency.",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    hoverBorderClass: "hover:border-primary/50",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
    hoverBgClass: "group-hover:bg-primary",
    hoverTextClass: "group-hover:text-primary-foreground",
  },
  {
    icon: TrendingUp,
    title: "Create Impact",
    description: "Bring your funded idea to life. Keep your supportive community updated as you grow.",
    bgClass: "bg-accent/5",
    borderClass: "border-accent/20",
    hoverBorderClass: "hover:border-accent/50",
    textClass: "text-accent",
    iconBgClass: "bg-accent/10",
    hoverBgClass: "group-hover:bg-accent",
    hoverTextClass: "group-hover:text-accent-foreground",
  },
  {
    icon: Users,
    title: "Get Support",
    description: "Supporters back projects they believe in. Track your funding progress in real-time.",
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/20",
    hoverBorderClass: "hover:border-secondary/50",
    textClass: "text-secondary",
    iconBgClass: "bg-secondary/10",
    hoverBgClass: "group-hover:bg-secondary",
    hoverTextClass: "group-hover:text-secondary-foreground",
  },
];

const trustPoints = [
  { 
    icon: BadgeCheck, 
    title: "Verified Projects", 
    desc: "Every project undergoes a thorough review process before being listed.",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    hoverBorderClass: "hover:border-primary/50",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
  { 
    icon: Eye, 
    title: "Full Transparency", 
    desc: "Track every dollar raised with detailed funding breakdowns and updates.",
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/20",
    hoverBorderClass: "hover:border-secondary/50",
    textClass: "text-secondary",
    iconBgClass: "bg-secondary/10",
  },
  { 
    icon: UserCheck, 
    title: "Founder Verification", 
    desc: "Project founders are verified to ensure accountability and trust.",
    bgClass: "bg-accent/5",
    borderClass: "border-accent/20",
    hoverBorderClass: "hover:border-accent/50",
    textClass: "text-accent",
    iconBgClass: "bg-accent/10",
  },
];


const HomePage = () => {
  const { user } = useAuth();
  const canCreateProject = !user || user.user_type === "entrepreneur" || user.user_type === "admin";
  const featuredProjectsQuery = useQuery({
    queryKey: ["projects", "featured"],
    queryFn: () => projectsService.listProjects({ page_size: 3, ordering: "-investor_count" }),
  });
  const featuredProjects = featuredProjectsQuery.data?.results.map(toProjectCard) ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/sahmi-hero-bg.png')" }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/20" />
        
        <div className="container relative z-10 py-24 md:py-40">
          <motion.div 
            className="max-w-3xl text-left"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="mb-6 border-primary/30 text-foreground bg-background/50 backdrop-blur-sm">
                🇵🇸 Empowering Palestinian Innovation
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="mb-8 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-7xl"
            >
              Invest in Palestinian Ideas That Create{" "}
              <span className="gradient-text drop-shadow-sm">Real Impact</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="mb-10 text-lg leading-relaxed text-foreground/90 md:text-xl font-medium max-w-2xl"
            >
              Sahmi connects entrepreneurs with supporters through a transparent, simple, and trustworthy crowdfunding experience.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col items-start gap-4 sm:flex-row sm:justify-start"
            >
              <Button size="xl" asChild className="shadow-lg hover:shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <Link to="/projects">
                  Explore Projects <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              {canCreateProject && (
                <Button size="xl" variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80 text-foreground shadow-sm hover:scale-105 active:scale-95" asChild>
                  <Link to="/start-project">Start Your Project</Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/30 backdrop-blur-sm py-12">
        <div className="container">
          <motion.div 
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {stats.map((stat) => (
              <motion.div 
                key={stat.label} 
                variants={fadeInUp}
                className="text-center group border-r border-border last:border-0 md:border-r"
              >
                <stat.icon className="mx-auto mb-3 h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                <div className="text-3xl font-bold text-foreground md:text-4xl tabular-nums tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works (Bento Grid) */}
      <section className="bg-muted/10 py-24 md:py-32">
        <div className="container">
          <motion.div 
            className="mx-auto mb-20 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              How <span className="gradient-text">Sahmi</span> Works
            </h2>
            <p className="text-lg text-muted-foreground">Three simple steps to transform ideas into reality with the power of community.</p>
          </motion.div>

          <motion.div 
            className="grid gap-6 md:grid-cols-12 md:grid-rows-2 h-auto md:h-[600px]"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Step 1 - Large Card */}
            <motion.div 
              variants={fadeInUp}
              className={`md:col-span-8 md:row-span-1 group relative overflow-hidden rounded-3xl border ${steps[0].bgClass} ${steps[0].borderClass} p-8 shadow-sm transition-all hover:shadow-xl ${steps[0].hoverBorderClass} flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${steps[0].iconBgClass} ${steps[0].textClass} transition-colors ${steps[0].hoverBgClass} ${steps[0].hoverTextClass}`}>
                  {(() => { const Icon = steps[0].icon; return <Icon className="h-8 w-8" />; })()}
                </div>
                <div className={`text-sm font-bold uppercase tracking-widest ${steps[0].textClass}`}>Step 01</div>
              </div>
              <div className="mt-8">
                <h3 className="mb-4 text-3xl font-bold text-foreground">{steps[0].title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">{steps[0].description}</p>
              </div>
              <div className="absolute -bottom-12 -right-12 h-64 w-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
            </motion.div>

            {/* Step 2 - Medium Card */}
            <motion.div 
              variants={fadeInUp}
              className={`md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-3xl border ${steps[1].bgClass} ${steps[1].borderClass} p-8 shadow-sm transition-all hover:shadow-xl ${steps[1].hoverBorderClass} flex flex-col justify-center text-center`}
            >
              <div className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl ${steps[1].iconBgClass} ${steps[1].textClass} transition-colors ${steps[1].hoverBgClass} ${steps[1].hoverTextClass}`}>
                {(() => { const Icon = steps[1].icon; return <Icon className="h-10 w-10" />; })()}
              </div>
              <div className={`mb-4 text-sm font-bold uppercase tracking-widest ${steps[1].textClass}`}>Step 03</div>
              <h3 className="mb-6 text-3xl font-bold text-foreground">{steps[1].title}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">{steps[1].description}</p>
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>

            {/* Step 3 - Large Card */}
            <motion.div 
              variants={fadeInUp}
              className={`md:col-span-8 md:row-span-1 group relative overflow-hidden rounded-3xl border ${steps[2].bgClass} ${steps[2].borderClass} p-8 shadow-sm transition-all hover:shadow-xl ${steps[2].hoverBorderClass} flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${steps[2].iconBgClass} ${steps[2].textClass} transition-colors ${steps[2].hoverBgClass} ${steps[2].hoverTextClass}`}>
                  {(() => { const Icon = steps[2].icon; return <Icon className="h-8 w-8" />; })()}
                </div>
                <div className={`text-sm font-bold uppercase tracking-widest ${steps[2].textClass}`}>Step 02</div>
              </div>
              <div className="mt-8">
                <h3 className="mb-4 text-3xl font-bold text-foreground">{steps[2].title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">{steps[2].description}</p>
              </div>
              <div className="absolute -top-12 -left-12 h-64 w-64 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors duration-500" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-background py-24 md:py-32">
        <div className="container">
          <div className="mb-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 
                className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Featured <span className="gradient-text">Projects</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">High-impact initiatives curated for the Sahmi community.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Button variant="ghost" size="lg" className="group hidden hover:bg-muted md:flex text-primary font-bold" asChild>
                <Link to="/projects">
                  View All Projects
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
          
          <motion.div 
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {featuredProjectsQuery.isLoading && (
              <motion.div variants={fadeInUp} className="col-span-full rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Loading featured projects...
              </motion.div>
            )}
            {featuredProjectsQuery.isError && (
              <motion.div variants={fadeInUp} className="col-span-full rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Featured projects are unavailable right now.
              </motion.div>
            )}
            {!featuredProjectsQuery.isLoading && !featuredProjectsQuery.isError && featuredProjects.length === 0 && (
              <motion.div variants={fadeInUp} className="col-span-full rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No featured projects are live yet.
              </motion.div>
            )}
            {featuredProjects.map((p) => (
              <motion.div key={p.id} variants={fadeInUp}>
                <ProjectCard project={p} />
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-12 text-center md:hidden">
            <Button size="xl" variant="outline" className="w-full" asChild>
              <Link to="/projects">View All Projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section (New) */}
      <section className="bg-card/50 py-24 md:py-32 overflow-hidden border-y border-border">
        <div className="container">
          <motion.div 
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-6">Voices of <span className="gradient-text">Impact</span></h2>
            <p className="text-lg text-muted-foreground">Join thousands of supporters making a difference across Palestine.</p>
          </motion.div>

          <motion.div 
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { name: "Sami Al-Haddad", role: "Investor", text: "Sahmi provided a transparent way for me to support local talent. The verification process gives me peace of mind." },
              { name: "Noor Mansour", role: "Entrepreneur", text: "Thanks to Sahmi, our solar project went from an idea to reality in three months. The community support is incredible." },
              { name: "Fatima Jaber", role: "Supporter", text: "I love tracking the progress of projects I've backed. The transparency here is unlike any other platform." }
            ].map((t, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeInUp}
                className="bg-background p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow relative"
              >
                <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/10" />
                <p className="text-lg italic text-foreground/80 mb-8 relative z-10 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{t.name}</div>
                    <div className="text-sm text-primary font-medium">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="bg-background py-24 md:py-32">
        <div className="container">
          <motion.div 
            className="mx-auto mb-20 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Built on <span className="gradient-text">Trust</span>
            </h2>
            <p className="text-lg text-muted-foreground">We prioritize security and transparency to ensure every contribution makes a real difference.</p>
          </motion.div>
          
          <motion.div 
            className="grid gap-8 md:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {trustPoints.map((tp) => (
              <motion.div 
                key={tp.title} 
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className={`group flex flex-col items-center rounded-3xl border ${tp.bgClass} ${tp.borderClass} p-10 text-center shadow-sm transition-all hover:shadow-xl ${tp.hoverBorderClass}`}
              >
                <div className={`mb-8 flex h-20 w-20 items-center justify-center rounded-2xl ${tp.iconBgClass} ${tp.textClass} transition-all duration-300 group-hover:scale-110`}>
                  <tp.icon className="h-10 w-10" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-foreground">{tp.title}</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">{tp.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="container relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
              Ready to Make a <span className="text-teal-300 drop-shadow-md">Difference</span>?
            </h2>
            <p className="mb-10 text-xl text-primary-foreground/90 font-medium leading-relaxed">
              Whether you're an entrepreneur with a vision or a supporter looking to create impact, Sahmi is your platform.
            </p>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-white shadow-xl font-bold h-16 px-10 text-lg rounded-2xl" asChild>
                  <Link to="/projects">Explore Projects</Link>
                </Button>
              </motion.div>
              {canCreateProject && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="xl" className="bg-transparent border-2 border-teal-300 text-teal-300 hover:bg-teal-300/10 shadow-sm font-bold h-16 px-10 text-lg rounded-2xl" asChild>
                    <Link to="/start-project">Start Your Project</Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      </section>
    </div>
  );
};

export default HomePage;
