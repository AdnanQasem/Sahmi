import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/ProjectCard";
import { sampleProjects } from "@/data/sampleProjects";
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
} from "lucide-react";

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

const teamMembers = [
  {
    name: "Adnan Qasem",
    role: "Co-Founder & CEO",
    description: "Driving the vision to connect Palestinian entrepreneurs with global supporters.",
    image: "", 
  },
  {
    name: "Ikrayyem Alabadla",
    role: "Co-Founder",
    description: "Ensuring platform transparency, trust, and technical execution.",
    image: "", 
  },
  {
    name: "Abdullah Al Otti",
    role: "Operations & Strategy",
    description: "Streamlining the process of vetting and supporting new business ideas.",
    image: "", 
  },
  {
    name: "Ahmed Qudaih",
    role: "Community Growth",
    description: "Building strong relationships with founders and the investor community.",
    image: "", 
  },
  {
    name: "Mohammed Al Madhoon",
    role: "Product Design",
    description: "Creating a seamless, intuitive experience for all users on Sahmi.",
    image: "", 
  },
  {
    name: "Moomen Jibril",
    role: "Partnerships",
    description: "Forging critical alliances with organizations to amplify impact.",
    image: "", 
  },
];

const HomePage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/sahmi-hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/20" />
        
        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-3xl text-left">
            <Badge variant="outline" className="mb-6 border-primary/30 text-foreground bg-background/50 backdrop-blur-sm">
              🇵🇸 Empowering Palestinian Innovation
            </Badge>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Invest in Palestinian Ideas That Create{" "}
              <span className="gradient-text drop-shadow-sm">Real Impact</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-foreground/90 md:text-xl font-medium max-w-2xl">
              Sahmi connects entrepreneurs with supporters through a transparent, simple, and trustworthy crowdfunding experience.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-start">
              <Button size="xl" asChild className="shadow-lg">
                <Link to="/projects">
                  Explore Projects <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80 text-foreground shadow-sm" asChild>
                <Link to="/start-project">Start Your Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-10">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center animate-count-up">
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-foreground md:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/20 pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="container">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl drop-shadow-md"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              How <span className="gradient-text">Sahmi</span> Works
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <div 
                key={step.title} 
                className={`group relative flex flex-col items-center justify-center rounded-2xl border ${step.bgClass} ${step.borderClass} p-8 text-center shadow-sm transition-all hover:-translate-y-1 ${step.hoverBorderClass} hover:shadow-md md:aspect-square`}
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconBgClass} ${step.textClass} transition-colors ${step.hoverBgClass} ${step.hoverTextClass}`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <div className={`mb-2 text-sm font-bold uppercase tracking-wider ${step.textClass}`}>Step {i + 1}</div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-muted/20 pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <h2 
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl drop-shadow-md"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Featured <span className="gradient-text">Projects</span>
            </h2>
            <Button variant="ghost" className="group hidden hover:bg-background md:flex mb-1" asChild>
              <Link to="/projects">
                View All 
                <span className="w-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out group-hover:w-5 group-hover:opacity-100">
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sampleProjects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/projects">View All Projects</Link>
            </Button>
          </div>
        </div>
      </section>


      {/* Trust & Transparency */}
      <section className="bg-muted/20 pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl drop-shadow-md"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Why Choose <span className="gradient-text">Sahmi</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {trustPoints.map((tp) => (
              <div 
                key={tp.title} 
                className={`group flex flex-col items-center rounded-2xl border ${tp.bgClass} ${tp.borderClass} p-6 text-center shadow-sm transition-all hover:-translate-y-1 ${tp.hoverBorderClass} hover:shadow-md`}
              >
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tp.iconBgClass} ${tp.textClass} transition-colors`}>
                  <tp.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{tp.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{tp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet The Team */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Subtle Background Gradient for Depth */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

        <div className="container relative z-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl drop-shadow-md"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Meet The <span className="gradient-text">Team</span>
            </h2>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="group flex flex-col items-center rounded-2xl border border-border/40 bg-card/60 p-6 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-md">
                <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted/50 transition-transform duration-500 group-hover:scale-105">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold tracking-wider text-muted-foreground/50">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-bold text-foreground">{member.name}</h3>
                <p className="mb-3 text-sm font-semibold text-primary">{member.role}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-hero py-16 md:py-20">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Make a <span className="text-teal-300 drop-shadow-md">Difference</span>?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/90 font-medium">
            Whether you're an entrepreneur with a vision or a supporter looking to create impact, Sahmi is your platform.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center mt-2">
            <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg font-bold transition-all hover:-translate-y-1" asChild>
              <Link to="/projects">Explore Projects</Link>
            </Button>
            <Button size="xl" className="bg-transparent border-2 border-teal-300 text-teal-300 hover:border-teal-300 hover:bg-teal-300 hover:text-teal-950 font-bold shadow-sm transition-all hover:-translate-y-1" asChild>
              <Link to="/start-project">Start Your Project</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
