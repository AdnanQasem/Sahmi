import { useTranslation } from "react-i18next";
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
  { icon: Lightbulb, bgClass: "bg-primary/5", borderClass: "border-primary/20", hoverBorderClass: "hover:border-primary/50", textClass: "text-primary", iconBgClass: "bg-primary/10" },
  { icon: Shield, bgClass: "bg-secondary/5", borderClass: "border-secondary/20", hoverBorderClass: "hover:border-secondary/50", textClass: "text-secondary", iconBgClass: "bg-secondary/10" },
  { icon: Users, bgClass: "bg-accent/5", borderClass: "border-accent/20", hoverBorderClass: "hover:border-accent/50", textClass: "text-accent", iconBgClass: "bg-accent/10" },
  { icon: TrendingUp, bgClass: "bg-primary/5", borderClass: "border-primary/20", hoverBorderClass: "hover:border-primary/50", textClass: "text-primary", iconBgClass: "bg-primary/10" },
];
const supporterSteps = [
  { icon: Eye, bgClass: "bg-primary/5", borderClass: "border-primary/20", textClass: "text-primary", iconBgClass: "bg-primary/10" },
  { icon: Sparkles, bgClass: "bg-secondary/5", borderClass: "border-secondary/20", textClass: "text-secondary", iconBgClass: "bg-secondary/10" },
  { icon: BadgeCheck, bgClass: "bg-accent/5", borderClass: "border-accent/20", textClass: "text-accent", iconBgClass: "bg-accent/10" },
  { icon: TrendingUp, bgClass: "bg-primary/5", borderClass: "border-primary/20", textClass: "text-primary", iconBgClass: "bg-primary/10" },
];
const benefits = [BadgeCheck, Eye, Wallet, MessageSquare];
const faqIndexes = [0, 1, 2, 3];
const HowItWorksPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canCreateProject = !user || user.user_type === "entrepreneur" || user.user_type === "admin";
  const isInvestor = user?.user_type === "investor";

  const renderEntrepreneursSection = (bgClass: string) => (
    <section className={`${bgClass} py-24 md:py-32`}>
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
            {t("info.entrepreneurs")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("info.entrepreneursText")}
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
              key={index}
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
                    {t("info.step", { number: `0${index + 1}` })}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{t(`how.entrepreneurSteps.${index}.title`)}</h3>
                  <p className="mb-4 text-muted-foreground">{t(`how.entrepreneurSteps.${index}.description`)}</p>
                  <ul className="space-y-2">
                    {[0, 1, 2].map((detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {t(`how.entrepreneurSteps.${index}.details.${detailIndex}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute -bottom-16 end-[-4rem] h-48 w-48 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-opacity group-hover:opacity-50" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );

  const renderSupportersSection = (bgClass: string) => (
    <section className={`${bgClass} py-24 md:py-32`}>
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
            {t("info.supporters")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("info.supportersText")}
          </p>
        </motion.div>

        <motion.div
          className="mb-8 grid gap-6 md:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          {supporterSteps.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className={`group flex flex-col items-center rounded-3xl border ${step.bgClass} ${step.borderClass} p-6 text-center shadow-sm transition-all hover:shadow-xl hover:border-primary/30`}
            >
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconBgClass} ${step.textClass} transition-transform group-hover:scale-110`}>
                <step.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{t(`how.supporterSteps.${index}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`how.supporterSteps.${index}.description`)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );

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
              {t("how.titleBefore")} <span className="gradient-text">{t("how.titleAfter")}</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg leading-relaxed text-muted-foreground md:text-xl"
            >
              {t("how.subtitle")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {isInvestor ? (
        <>
          {renderSupportersSection("bg-muted/10")}
          {renderEntrepreneursSection("bg-background")}
        </>
      ) : (
        <>
          {renderEntrepreneursSection("bg-muted/10")}
          {renderSupportersSection("bg-background")}
        </>
      )}

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
              {t("how.whyBefore")} <span className="gradient-text">Sahmi</span>{t("how.whyAfter")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("how.whyText")}
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {benefits.map((BenefitIcon, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="group rounded-3xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-xl"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <BenefitIcon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{t(`how.benefits.${index}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`how.benefits.${index}.description`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 bg-muted/10 py-24 md:py-32">
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
              {t("how.faqTitleBefore")} <span className="gradient-text">{t("how.faqTitleAfter")}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("how.faqText")}
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-3xl space-y-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {faqIndexes.map((faqIndex) => (
              <motion.div
                key={faqIndex}
                variants={fadeInUp}
                className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md"
              >
                <h3 className="mb-3 text-lg font-semibold text-foreground">{t(`how.faqs.${faqIndex}.question`)}</h3>
                <p className="text-muted-foreground">{t(`how.faqs.${faqIndex}.answer`)}</p>
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
              {t("how.ctaBefore")} <span className="text-teal-300 drop-shadow-md">{t("how.ctaAccent")}</span>؟
            </h2>
            <p className="mb-10 text-xl text-primary-foreground/90">
              {t("how.ctaText")}
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-white shadow-xl font-bold h-14 px-8 text-lg rounded-2xl" asChild>
                  <Link to="/projects">
                    {t("how.explore")} <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                  </Link>
                </Button>
              </motion.div>
              {canCreateProject && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="xl" variant="outline" className="bg-transparent border-2 border-teal-300 text-teal-300 hover:bg-teal-300/10 font-bold h-14 px-8 text-lg rounded-2xl" asChild>
                    <Link to="/start-project">{t("how.start")}</Link>
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
