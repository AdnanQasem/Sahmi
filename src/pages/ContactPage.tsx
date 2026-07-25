import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  Globe,
  ChevronDown,
  Sparkles,
  Users,
  Heart,
  ArrowRight,
  CheckCircle,
  Twitter,
  Linkedin,
  Instagram,
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

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const teamMembers = [
  { name: "Adnan Qasem", image: "" }, { name: "Ikrayyem Alabadla", image: "" },
  { name: "Abdullah Al Otti", image: "" }, { name: "Ahmed Qudaih", image: "" },
  { name: "Mohammed Al Madhoon", image: "" }, { name: "Moomen Jibril", image: "" },
];

const contactInfo = [
  { icon: Mail, value: "support@sahmi.ps", bgClass: "bg-primary/5", borderClass: "border-primary/20", iconBgClass: "bg-primary/10", textClass: "text-primary", href: "mailto:support@sahmi.ps" },
  { icon: Phone, value: "+970 2 298 0000", bgClass: "bg-secondary/5", borderClass: "border-secondary/20", iconBgClass: "bg-secondary/10", textClass: "text-secondary", href: "tel:+97022980000" },
  { icon: MapPin, value: null, bgClass: "bg-accent/5", borderClass: "border-accent/20", iconBgClass: "bg-accent/10", textClass: "text-accent", href: "#" },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "#", color: "hover:bg-sky-500 hover:text-white" },
  { icon: Linkedin, label: "LinkedIn", href: "#", color: "hover:bg-blue-600 hover:text-white" },
  { icon: Instagram, label: "Instagram", href: "#", color: "hover:bg-pink-500 hover:text-white" },
];

const faqIndexes = [0, 1, 2, 3, 4, 5];
const ContactPage = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormState({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative overflow-hidden bg-background py-24 md:py-32"
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />

        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="container relative z-10"
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
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("info.contactBadge")}</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
            >
              {t("info.contactTitle")}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto text-xl leading-relaxed text-muted-foreground md:text-2xl max-w-2xl"
            >
              {t("contact.heroText")}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Contact Info Cards */}
      <section className="py-16 md:py-24 bg-muted/10 border-y border-border">
        <div className="container">
          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {contactInfo.map((info, index) => (
              <motion.a
                key={index}
                href={info.href}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group relative overflow-hidden rounded-2xl border ${info.borderClass} ${info.bgClass} p-8 shadow-sm transition-all hover:shadow-xl`}
              >
                <motion.div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${info.iconBgClass} ${info.textClass} transition-all duration-300 group-hover:scale-110`}
                  whileHover={{ rotate: 5 }}
                >
                  <info.icon className="h-7 w-7" />
                </motion.div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t(`contact.cards.${index}.title`)}
                </h3>
                <p className="mb-2 text-xl font-bold text-foreground" dir={index < 2 ? "ltr" : "auto"}><bdi>{info.value ?? t(`contact.cards.${index}.value`)}</bdi></p>
                <p className="text-muted-foreground">{t(`contact.cards.${index}.description`)}</p>

                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
            {/* Form */}
            <motion.div
              variants={slideInLeft}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-3xl border border-border bg-card p-8 md:p-10 shadow-lg">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    {t("contact.formTitle")}
                  </h2>
                  <p className="text-muted-foreground">
                    {t("contact.formText")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="name" className="text-foreground font-medium">
                        {t("contact.fullName")}
                      </Label>
                      <Input
                        id="name"
                        placeholder={t("contact.namePlaceholder")}
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        className="mt-2 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                        required
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="email" className="text-foreground font-medium">
                        {t("contact.email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={(e) =>
                          setFormState({ ...formState, email: e.target.value })
                        }
                        className="mt-2 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                        required
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="subject" className="text-foreground font-medium">
                      {t("contact.subject")}
                    </Label>
                    <Input
                      id="subject"
                      placeholder={t("contact.subjectPlaceholder")}
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState({ ...formState, subject: e.target.value })
                      }
                      className="mt-2 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="message" className="text-foreground font-medium">
                      {t("contact.message")}
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t("contact.messagePlaceholder")}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      className="mt-2 min-h-[140px] rounded-xl border-border/60 focus:border-primary focus:ring-primary resize-none"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 rounded-xl text-lg font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          {t("contact.sending")}
                        </motion.div>
                      ) : isSubmitted ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <CheckCircle className="h-5 w-5" />
                          {t("contact.sent")}
                        </motion.div>
                      ) : (
                        <>
                          {t("contact.send")}
                          <Send className="ms-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Quick Info & Social */}
            <motion.div
              variants={slideInRight}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Response Time */}
              <motion.div
                className="rounded-3xl border border-border bg-card p-8 shadow-sm"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {t("contact.fastTitle")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t("contact.fastText")}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* {t("contact.globalTitle")} */}
              <motion.div
                className="rounded-3xl border border-border bg-card p-8 shadow-sm"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shrink-0">
                    <Globe className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {t("contact.globalTitle")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our team speaks Arabic and English, and we support users from all
                      over the world. No matter where you are, we&apos;re here for you.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Social Links */}
              <motion.div
                className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-secondary/5 p-8"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {t("contact.connectTitle")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("contact.connectText")}
                </p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all ${social.color} shadow-sm`}
                    >
                      <social.icon className="h-5 w-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-muted/10 border-y border-border">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

        <div className="container">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("contact.teamBadge")}</span>
            </motion.div>

            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl mb-6">
              {t("contact.teamTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("contact.teamText")}
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <motion.div
                  className="mb-6 mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border/60 shadow-inner transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold tracking-wider text-primary/60">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  )}
                </motion.div>

                <h3 className="mb-1 text-xl font-bold text-foreground">
                  {member.name}
                </h3>
                <p className="mb-4 text-sm font-semibold text-primary uppercase tracking-widest">
                  {t(`contact.team.${index}.role`)}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`contact.team.${index}.description`)}
                </p>

                {/* Decorative Corner */}
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <MessageCircle className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">{t("contact.faqBadge")}</span>
            </motion.div>

            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
              {t("contact.faqTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("contact.faqText")}
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {faqIndexes.map((faqIndex) => (
              <motion.div
                key={faqIndex}
                variants={fadeInUp}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faqIndex ? null : faqIndex)}
                  className="flex w-full items-center justify-between p-6 text-start hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">{t(`contact.faqs.${faqIndex}.question`)}</span>
                  <motion.div
                    animate={{ rotate: openFaq === faqIndex ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === faqIndex ? "auto" : 0,
                    opacity: openFaq === faqIndex ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    {t(`contact.faqs.${faqIndex}.answer`)}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Still Have Questions */}
          <motion.div
            className="mt-12 text-center rounded-2xl border border-border bg-muted/10 p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Heart className="mx-auto h-8 w-8 text-primary mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t("contact.stillQuestions")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("contact.stillText")}
            </p>
            <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              {t("contact.contactUs")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />

        {/* Animated Decorative Elements */}
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
              {t("contact.ctaTitle")}
            </h2>
            <p className="mb-10 text-xl text-primary-foreground/90 font-medium leading-relaxed">
              {t("contact.ctaText")}
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="xl"
                  className="bg-primary-foreground text-primary hover:bg-primary-white shadow-xl font-bold h-16 px-10 text-lg rounded-2xl"
                >
                  {t("contact.explore")}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="xl"
                  className="bg-transparent border-2 border-teal-300 text-teal-300 hover:bg-teal-300/10 shadow-sm font-bold h-16 px-10 text-lg rounded-2xl"
                >
                  {t("contact.start")}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
