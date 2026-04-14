import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Eye,
  Heart,
  Users,
  Target,
  Globe,
  Sparkles,
  Leaf,
  Lightbulb,
  ArrowRight,
  BadgeCheck,
  Quote,
  MapPin,
  Clock,
  TrendingUp,
} from "lucide-react";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: "easeOut" },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const values = [
  {
    icon: Shield,
    title: "Trust & Integrity",
    desc: "Every project is carefully reviewed. We verify founders and require transparent funding plans.",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    hoverBorderClass: "hover:border-primary/50",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    desc: "Supporters can track exactly how funds are used through regular updates and detailed breakdowns.",
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/20",
    hoverBorderClass: "hover:border-secondary/50",
    textClass: "text-secondary",
    iconBgClass: "bg-secondary/10",
  },
  {
    icon: Heart,
    title: "Community First",
    desc: "We exist to strengthen Palestinian communities by channeling support to where it matters most.",
    bgClass: "bg-accent/5",
    borderClass: "border-accent/20",
    hoverBorderClass: "hover:border-accent/50",
    textClass: "text-accent",
    iconBgClass: "bg-accent/10",
  },
  {
    icon: Users,
    title: "Inclusive Access",
    desc: "Anyone with a viable project can apply. We support entrepreneurs at every stage.",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
    hoverBorderClass: "hover:border-primary/50",
    textClass: "text-primary",
    iconBgClass: "bg-primary/10",
  },
  {
    icon: Target,
    title: "Impact Driven",
    desc: "We measure success not just in dollars raised, but in lasting community impact created.",
    bgClass: "bg-secondary/5",
    borderClass: "border-secondary/20",
    hoverBorderClass: "hover:border-secondary/50",
    textClass: "text-secondary",
    iconBgClass: "bg-secondary/10",
  },
  {
    icon: Globe,
    title: "Global Reach",
    desc: "Connect Palestinian entrepreneurs with supporters worldwide who share their vision.",
    bgClass: "bg-accent/5",
    borderClass: "border-accent/20",
    hoverBorderClass: "hover:border-accent/50",
    textClass: "text-accent",
    iconBgClass: "bg-accent/10",
  },
];

const milestones = [
  { year: "2023", title: "The Beginning", desc: "Sahmi was founded with a vision", icon: Lightbulb },
  { year: "2024", title: "Growing Community", desc: "Over $2M raised for Palestinian projects", icon: TrendingUp },
  { year: "2025", title: "Global Impact", desc: "Expanding to reach more entrepreneurs", icon: Globe },
];

const stats = [
  { label: "Projects Funded", value: "230+", icon: Sparkles },
  { label: "Total Raised", value: "$2.4M", icon: TrendingUp },
  { label: "Supporters", value: "12,000+", icon: Users },
  { label: "Success Rate", value: "89%", icon: BadgeCheck },
];

const AboutPage = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative overflow-hidden bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Parallax Background */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/sahmi-hero-bg.png')",
            y: heroY,
          }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
        
        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="container relative z-10 py-24 md:py-40"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            className="mx-auto max-w-4xl text-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Our Story</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
            >
              About{" "}
              <span className="gradient-text">Sahmi</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-8 text-xl leading-relaxed text-muted-foreground md:text-2xl max-w-3xl"
            >
              <span className="font-semibold text-primary">Sahmi</span> — meaning{" "}
              <span className="italic">"my share"</span> in Arabic — is a crowdfunding
              platform built to empower Palestinian entrepreneurs and connect them with a
              global community of supporters.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="xl"
                className="shadow-lg hover:shadow-primary/20 transition-all hover:scale-105"
                asChild
              >
                <Link to="/start-project">
                  Start Your Journey{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="hover:scale-105 transition-transform"
                asChild
              >
                <Link to="/projects">Explore Projects</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-1">
            <motion.div
              className="w-1.5 h-3 rounded-full bg-primary"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/30 backdrop-blur-sm py-16">
        <div className="container">
          <motion.div
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center group"
              >
                <motion.div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground"
                  whileHover={{ rotate: 5 }}
                >
                  <stat.icon className="h-6 w-6" />
                </motion.div>
                <motion.div
                  className="text-3xl font-bold text-foreground md:text-4xl tabular-nums"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Cards */}
      <section className="py-24 md:py-32 bg-muted/10">
        <div className="container">
          <motion.div
            className="grid gap-8 lg:grid-cols-2"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              variants={slideInLeft}
              className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-background p-10 shadow-sm transition-all hover:shadow-xl hover:border-primary/40"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
              <motion.div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                whileHover={{ rotate: -5 }}
              >
                <Target className="h-8 w-8" />
              </motion.div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                Our Mission
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                To provide Palestinian entrepreneurs with a trustworthy, transparent platform
                to raise funds, build community support, and turn their ideas into reality. We
                believe that every great idea deserves a chance, and every community deserves
                access to opportunity.
              </p>
            </motion.div>

            <motion.div
              variants={slideInRight}
              className="group relative overflow-hidden rounded-3xl border border-secondary/20 bg-background p-10 shadow-sm transition-all hover:shadow-xl hover:border-secondary/40"
            >
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/5 blur-3xl transition-all group-hover:bg-secondary/10" />
              <motion.div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-all group-hover:bg-secondary group-hover:text-secondary-foreground"
                whileHover={{ rotate: 5 }}
              >
                <Globe className="h-8 w-8" />
              </motion.div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                Our Vision
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                A thriving Palestinian entrepreneurial ecosystem where innovation flourishes,
                communities prosper, and supporters worldwide can play a meaningful role in
                creating positive change.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Our Journey</span>
              </motion.div>
              <h2 className="text-4xl font-bold text-foreground mb-6 md:text-5xl">
                Building Hope,{" "}
                <span className="gradient-text">One Project at a Time</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Sahmi was born from a simple belief: that Palestinian entrepreneurs deserve
                access to the resources they need to bring their visions to life. In a world
                full of challenges, we saw an opportunity to create bridges between innovative
                minds and caring supporters.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Today, we've helped hundreds of projects find their footing, creating a ripple
                effect of positive change that extends far beyond the initial funding. Each
                success story is a testament to the resilience and creativity of Palestinian
                entrepreneurs.
              </p>

              {/* Timeline */}
              <motion.div
                className="mt-10 space-y-6"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    variants={fadeInUp}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <milestone.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-primary">{milestone.year}</span>
                        <div className="h-px w-8 bg-border" />
                      </div>
                      <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                      <p className="text-sm text-muted-foreground">{milestone.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <motion.div
                  className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center p-12">
                    <motion.div
                      className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Leaf className="h-12 w-12" />
                    </motion.div>
                    <p className="text-2xl font-bold text-foreground mb-2">Growth Through</p>
                    <p className="text-2xl font-bold gradient-text">Community</p>
                  </div>
                </motion.div>
              </div>
              
              {/* Floating Stats Card */}
              <motion.div
                className="absolute -bottom-6 -left-6 rounded-2xl border border-border bg-card p-6 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">89%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 md:py-32 bg-muted/10 border-y border-border">
        <div className="container">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-6">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do at Sahmi.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {values.map((v, index) => (
              <motion.div
                key={v.title}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group relative overflow-hidden rounded-2xl border ${v.borderClass} ${v.bgClass} p-8 shadow-sm transition-all hover:shadow-xl ${v.hoverBorderClass}`}
              >
                <motion.div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${v.iconBgClass} ${v.textClass} transition-all duration-300 group-hover:scale-110`}
                  whileHover={{ rotate: 5 }}
                >
                  <v.icon className="h-7 w-7" />
                </motion.div>
                <h3 className="mb-3 text-xl font-bold text-foreground">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
                
                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Review Process */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="relative">
                <motion.div
                  className="rounded-3xl border border-border bg-card p-8 shadow-xl"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Verification Process</h3>
                      <p className="text-sm text-muted-foreground">Multi-step review system</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { step: "1", title: "Identity Verification", desc: "Founder identity confirmed" },
                      { step: "2", title: "Plan Review", desc: "Business model assessment" },
                      { step: "3", title: "Transparency Check", desc: "Documentation validation" },
                    ].map((item, idx) => (
                      <motion.div
                        key={item.step}
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1, duration: 0.4 }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <BadgeCheck className="h-5 w-5 text-success" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Decorative */}
                <motion.div
                  className="absolute -z-10 -bottom-4 -right-4 h-full w-full rounded-3xl bg-primary/5"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
                <BadgeCheck className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-secondary">Trust & Safety</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6 md:text-5xl">
                How We Review{" "}
                <span className="gradient-text">Projects</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Every project submitted to Sahmi undergoes a careful review process. Our team
                verifies founder identity, reviews the business plan and funding allocation, and
                ensures transparency standards are met.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Only projects that pass our comprehensive review are listed on the platform. This
                protects both entrepreneurs and supporters, ensuring a trustworthy ecosystem for
                everyone.
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link to="/how-it-works">
                  Learn More About Our Process{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 md:py-32 bg-muted/10 border-y border-border">
        <div className="container">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 } }
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex mb-8"
            >
              <Quote className="h-12 w-12 text-primary/30" />
            </motion.div>
            <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed mb-8">
              "Sahmi gave us more than just funding—it gave us a community that believed in our
              vision. The transparency and support we received made all the difference in
              bringing our project to life."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary">
                NA
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Noor Al-Huda</p>
                <p className="text-sm text-muted-foreground">Founder, Gaza Tech Initiative</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container relative z-10">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
              Join Our{" "}
              <span className="text-teal-300 drop-shadow-md">Community</span>
            </h2>
            <p className="mb-10 text-xl text-primary-foreground/90 font-medium leading-relaxed">
              Whether you&apos;re an entrepreneur with a vision or a supporter looking to create
              impact, Sahmi is your platform.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="xl"
                  className="bg-primary-foreground text-primary hover:bg-primary-white shadow-xl font-bold h-16 px-10 text-lg rounded-2xl"
                  asChild
                >
                  <Link to="/projects">Explore Projects</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="xl"
                  className="bg-transparent border-2 border-teal-300 text-teal-300 hover:bg-teal-300/10 shadow-sm font-bold h-16 px-10 text-lg rounded-2xl"
                  asChild
                >
                  <Link to="/start-project">Start Your Project</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
