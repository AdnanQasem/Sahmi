import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Lightbulb,
  Users,
  TrendingUp,
  CheckCircle,
  Shield,
  Eye,
  ArrowRight,
  FileText,
  Sparkles,
  Wallet,
  MessageSquare,
  BadgeCheck,
  Target,
} from "lucide-react";

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

const entrepreneurSteps = [
  {
    icon: Lightbulb,
    title: "Submit Your Project",
    description: "Share your vision with our community through a simple application process.",
    details: [
      "Fill out our project form with your idea, story, and funding goal",
      "Upload images and supporting documents to showcase your project",
      "Our team reviews your submission within 2-3 business days",
    ],
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    hoverBorderClass: "hover:border-primary/50",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Project Review",
    description: "Our team verifies your identity and reviews your business plan.",
    details: [
      "Identity verification for accountability",
      "Business plan and funding allocation review",
      "Quality and transparency standards check",
    ],
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/20",
    hoverBorderClass: "hover:border-secondary/50",
    textClass: "text-secondary",
    iconBgClass: "bg-secondary/10",
  },
  {
    icon: Users,
    title: "Get Support",
    description: "Receive backing from supporters who believe in your mission.",
    details: [
      "Approved projects go live for the community to discover",
      "Share your project to gain traction",
      "Track your funding progress in real-time",
    ],
    bgClass: "bg-accent/5",
    borderClass: "border-accent/20",
    hoverBorderClass: "hover:border-accent/50",
    textClass: "text-accent",
    iconBgClass: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Create Impact",
    description: "Turn your funded idea into reality with community support.",
    details: [
      "Receive funds once your goal is reached",
      "Post regular updates to keep supporters informed",
      "Build your project and create lasting change",
    ],
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    hoverBorderClass: "hover:border-primary/50",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
];

const supporterSteps = [
  {
    icon: Eye,
    title: "Discover Projects",
    description: "Browse verified projects across various categories and find ones you care about.",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "Choose Impact",
    description: "Select projects that align with your values and contribute any amount.",
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/20",
    textClass: "text-secondary",
    iconBgClass: "bg-secondary/10",
  },
  {
    icon: BadgeCheck,
    title: "Trust the Process",
    description: "All projects are verified and transparent with regular updates.",
    bgClass: "bg-accent/5",
    borderClass: "border-accent/20",
    textClass: "text-accent",
    iconBgClass: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your contributions and see the difference you're making.",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
];

const benefits = [
  {
    icon: BadgeCheck,
    title: "Verified Projects",
    description: "Every project undergoes thorough review before listing.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Track every dollar with detailed funding breakdowns.",
  },
  {
    icon: Wallet,
    title: "Secure Payments",
    description: "Your contributions are processed safely and securely.",
  },
  {
    icon: MessageSquare,
    title: "Direct Connection",
    description: "Communicate directly with project founders.",
  },
];

const faqs = [
  {
    question: "How long does the review process take?",
    answer: "Our team typically reviews submissions within 2-3 business days. You'll receive an email notification once your project is approved or if we need additional information.",
  },
  {
    question: "What happens if a project doesn't reach its goal?",
    answer: "Projects that don't reach their funding goal can still keep the funds raised. We encourage founders to be transparent with supporters about how funds will be used.",
  },
  {
    question: "Is there a fee to use Sahmi?",
    answer: "Creating a project is free. We only charge a small platform fee on successfully funded projects to keep the platform running.",
  },
  {
    question: "How do I know projects are legitimate?",
    answer: "Every project goes through our verification process. We verify founder identity, review business plans, and ensure transparency standards are met before any project goes live.",
  },
];

const HowItWorksPage = () => {
  const { user } = useAuth();
  const canCreateProject = !user || user.user_type === "entrepreneur" || user.user_type === "admin";

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-background">
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/sahmi-hero-bg.png')" }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/20" />

        <div className="container relative z-10 py-20 md:py-28">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              How <span className="gradient-text">Sahmi</span> Works
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg leading-relaxed text-muted-foreground md:text-xl"
            >
              A simple, transparent process to bring your project to life or support meaningful causes in Palestine.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/10 py-24 md:py-32">
        <div className="container">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              For <span className="gradient-text">Entrepreneurs</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Turn your vision into reality with these four simple steps.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {entrepreneurSteps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className={`group relative overflow-hidden rounded-3xl border ${step.bgClass} ${step.borderClass} p-8 shadow-sm transition-all hover:shadow-xl ${step.hoverBorderClass}`}
              >
                <div className="flex items-start gap-5">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.iconBgClass} ${step.textClass} transition-transform group-hover:scale-110`}>
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className={`mb-2 text-sm font-bold uppercase tracking-widest ${step.textClass}`}>
                      Step 0{index + 1}
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                    <p className="mb-4 text-muted-foreground">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-opacity group-hover:opacity-50" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              For <span className="gradient-text">Supporters</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Make a difference by supporting verified projects with confidence.
            </p>
          </motion.div>

          <motion.div
            className="mb-8 grid gap-6 md:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {supporterSteps.map((step) => (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className={`group flex flex-col items-center rounded-3xl border ${step.bgClass} ${step.borderClass} p-6 text-center shadow-sm transition-all hover:shadow-xl ${step.hoverBorderClass || 'hover:border-primary/30'}`}
              >
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconBgClass} ${step.textClass} transition-transform group-hover:scale-110`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-card/50 border-y border-border py-24">
        <div className="container">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Why Choose <span className="gradient-text">Sahmi</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              Built on trust, transparency, and a commitment to Palestinian entrepreneurship.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="group rounded-3xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-xl"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <benefit.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/10 py-24 md:py-32">
        <div className="container">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-3xl space-y-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md"
              >
                <h3 className="mb-3 text-lg font-semibold text-foreground">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="container relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl">
              Ready to Get <span className="text-teal-300 drop-shadow-md">Started</span>?
            </h2>
            <p className="mb-10 text-xl text-primary-foreground/90">
              Join thousands of entrepreneurs and supporters making an impact across Palestine.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-white shadow-xl font-bold h-14 px-8 text-lg rounded-2xl" asChild>
                  <Link to="/projects">
                    Explore Projects <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              {canCreateProject && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="xl" variant="outline" className="bg-transparent border-2 border-teal-300 text-teal-300 hover:bg-teal-300/10 font-bold h-14 px-8 text-lg rounded-2xl" asChild>
                    <Link to="/start-project">Start Your Project</Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      </section>
    </div>
  );
};

export default HowItWorksPage;