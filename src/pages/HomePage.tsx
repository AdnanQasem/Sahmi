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
    number: "01",
    icon: Lightbulb,
    title: "Submit Your Project",
    description: "Share your innovative idea and funding goal. Our team reviews every project to ensure quality, transparency, and community value.",
    features: ["Project Review", "Goal Setting", "Documentation"],
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    borderColor: "group-hover:border-primary/50",
  },
  {
    number: "02",
    icon: Users,
    title: "Get Community Support",
    description: "Supporters discover and back projects they believe in. Track funding progress in real-time and build your supporter community.",
    features: ["Real-time Tracking", "Community Updates", "Backer Rewards"],
    gradient: "from-secondary/20 via-secondary/10 to-transparent",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary",
    borderColor: "group-hover:border-secondary/50",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Create Lasting Impact",
    description: "Bring your funded vision to life with continuous support. Keep your backers updated as you make meaningful change.",
    features: ["Progress Updates", "Impact Reports", "Success Stories"],
    gradient: "from-accent/20 via-accent/10 to-transparent",
    iconBg: "bg-accent/20",
    iconColor: "text-accent",
    borderColor: "group-hover:border-accent/50",
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

      {/* How It Works */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-24 md:py-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container relative z-10">
          {/* Section Header */}
          <motion.div 
            className="mx-auto mb-20 max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Simple Process</span>
            </motion.div>
            
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl mb-6">
              How <span className="gradient-text">Sahmi</span> Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Three simple steps to transform ideas into reality with the power of community. No complexity, just impact.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div 
            className="grid gap-8 md:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                className="group relative"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                
                <motion.div
                  whileHover={{ y: -8 }}
                  className="relative h-full"
                >
                  {/* Card */}
                  <div className={`relative h-full rounded-3xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl ${step.borderColor}`}>
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative p-8 flex flex-col h-full">
                      {/* Step number and icon */}
                      <div className="flex items-start justify-between mb-8">
                        <motion.div 
                          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconBg}`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                        >
                          <step.icon className={`h-8 w-8 ${step.iconColor}`} />
                        </motion.div>
                        
                        <motion.div 
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                        >
                          <span className={`text-sm font-bold ${step.iconColor}`}>
                            {step.number}
                          </span>
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {step.description}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        {step.features.map((feature, fIndex) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + fIndex * 0.1 }}
                            className="flex items-center gap-3"
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                              <BadgeCheck className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              {feature}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Arrow indicator */}
                      <motion.div
                        className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        <ArrowRight className={`h-5 w-5 ${step.iconColor}`} />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <p className="text-muted-foreground mb-6">
              Ready to start your journey?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-secondary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                <Link to="/start-project">
                  Submit Your Project
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="hover:bg-muted border-border" asChild>
                <Link to="/how-it-works">
                  Learn More
                </Link>
              </Button>
            </div>
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
