import { useTranslation } from "react-i18next";
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
  { icon: Shield, bgClass: "bg-primary/5", borderClass: "border-primary/20", hoverBorderClass: "hover:border-primary/50", textClass: "text-primary", iconBgClass: "bg-primary/10" },
  { icon: Eye, bgClass: "bg-secondary/5", borderClass: "border-secondary/20", hoverBorderClass: "hover:border-secondary/50", textClass: "text-secondary", iconBgClass: "bg-secondary/10" },
  { icon: Heart, bgClass: "bg-accent/5", borderClass: "border-accent/20", hoverBorderClass: "hover:border-accent/50", textClass: "text-accent", iconBgClass: "bg-accent/10" },
  { icon: Users, bgClass: "bg-primary/5", borderClass: "border-primary/20", hoverBorderClass: "hover:border-primary/50", textClass: "text-primary", iconBgClass: "bg-primary/10" },
  { icon: Target, bgClass: "bg-secondary/5", borderClass: "border-secondary/20", hoverBorderClass: "hover:border-secondary/50", textClass: "text-secondary", iconBgClass: "bg-secondary/10" },
  { icon: Globe, bgClass: "bg-accent/5", borderClass: "border-accent/20", hoverBorderClass: "hover:border-accent/50", textClass: "text-accent", iconBgClass: "bg-accent/10" },
];

const milestones = [
  { year: "2023", icon: Lightbulb }, { year: "2024", icon: TrendingUp }, { year: "2025", icon: Globe },
];

const stats = [
  { value: "230+", icon: Sparkles }, { value: "$2.4M", icon: TrendingUp }, { value: "12,000+", icon: Users }, { value: "89%", icon: BadgeCheck },
];
const AboutPage = () => {
  const { t } = useTranslation();
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
              <span className="text-sm font-medium text-primary">{t("info.aboutBadge")}</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
            >
              {t("info.aboutTitle")}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-8 text-xl leading-relaxed text-muted-foreground md:text-2xl max-w-3xl"
            >
              {t("about.meaning")}
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
                  {t("info.startJourney")} {" "}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="hover:scale-105 transition-transform"
                asChild
              >
                <Link to="/projects">{t("home.browse")}</Link>
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
                key={index}
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
                  className="text-3xl font-bold text-foreground md:text-4xl tabular-nums" dir="ltr"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
                  {t(`about.stats.${index}`)}
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
                {t("about.missionTitle")}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t("about.missionText")}
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
                {t("about.visionTitle")}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t("about.visionText")}
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
                <span className="text-sm font-medium text-accent">{t("about.journey")}</span>
              </motion.div>
              <h2 className="text-4xl font-bold text-foreground mb-6 md:text-5xl">
                {t("about.journeyTitle")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("about.journeyText1")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("about.journeyText2")}
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
                        <bdi className="text-sm font-bold text-primary" dir="ltr">{milestone.year}</bdi>
                        <div className="h-px w-8 bg-border" />
                      </div>
                      <h4 className="font-semibold text-foreground">{t(`about.milestones.${index}.title`)}</h4>
                      <p className="text-sm text-muted-foreground">{t(`about.milestones.${index}.description`)}</p>
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
                    <p className="text-2xl font-bold gradient-text">{t("about.growth")}</p>
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
                    <p className="text-2xl font-bold text-foreground" dir="ltr">89%</p>
                    <p className="text-sm text-muted-foreground">{t("about.successRate")}</p>
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
              {t("about.valuesTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("about.valuesText")}
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
                key={index}
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
                <h3 className="mb-3 text-xl font-bold text-foreground">{t(`about.values.${index}.title`)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(`about.values.${index}.description`)}</p>
                
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
                      <h3 className="text-lg font-bold text-foreground">{t("about.verificationProcess")}</h3>
                      <p className="text-sm text-muted-foreground">{t("about.multiStep")}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[0, 1, 2].map((stepIndex) => (
                      <motion.div
                        key={stepIndex}
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: stepIndex * 0.1, duration: 0.4 }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                          {stepIndex + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{t(`about.reviewSteps.${stepIndex}.title`)}</p>
                          <p className="text-sm text-muted-foreground">{t(`about.reviewSteps.${stepIndex}.description`)}</p>
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
                <span className="text-sm font-medium text-secondary">{t("about.trustSafety")}</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6 md:text-5xl">
                {t("about.reviewTitle")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("about.reviewText1")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {t("about.reviewText2")}
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link to="/how-it-works" onClick={() => window.scrollTo(0, 0)}>
                  {t("about.learnMore")} {" "}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
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
              {t("about.testimonial")}
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary">
                NA
              </div>
              <div className="text-start">
                <p className="font-semibold text-foreground">Noor Al-Huda</p>
                <p className="text-sm text-muted-foreground">{t("about.testimonialRole")}</p>
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
              {t("about.ctaTitle")}
            </h2>
            <p className="mb-10 text-xl text-primary-foreground/90 font-medium leading-relaxed">
              {t("about.ctaText")}
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="xl"
                  className="bg-primary-foreground text-primary hover:bg-primary-white shadow-xl font-bold h-16 px-10 text-lg rounded-2xl"
                  asChild
                >
                  <Link to="/projects">{t("home.browse")}</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="xl"
                  className="bg-transparent border-2 border-teal-300 text-teal-300 hover:bg-teal-300/10 shadow-sm font-bold h-16 px-10 text-lg rounded-2xl"
                  asChild
                >
                  <Link to="/start-project">{t("about.start")}</Link>
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
