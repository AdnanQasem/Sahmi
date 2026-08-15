import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SahmiLogo from "@/components/SahmiLogo";
import { useAuth } from "@/hooks/useAuth";
import { getFieldErrors } from "@/services/api";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Briefcase,
  TrendingUp,
  Leaf,
  Quote,
  Loader2,
  Check,
  Rocket,
} from "lucide-react";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const benefits = [Briefcase, TrendingUp, Leaf];
const testimonials = [{ author: "Maria A." }, { author: "Khaled M." }];
const passwordRequirements = [
  { labelKey: "settings.password8", check: (p: string) => p.length >= 8 },
  { labelKey: "settings.passwordCase", check: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { labelKey: "settings.passwordNumber", check: (p: string) => /\d/.test(p) },
  { labelKey: "settings.passwordSpecial", check: (p: string) => /[!@#$%^&*]/.test(p) },
];
const RegisterPage = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"investor" | "entrepreneur">("investor");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setFieldErrors({ confirm_password: t("auth.passwordMismatch") });
      return;
    }
    setSubmitting(true);
    setFieldErrors({});
    try {
      await register({
        full_name: name,
        email,
        password,
        user_type: userType,
      });
      setShowSuccess(true);
      navigate("/projects", { replace: true });
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        variants={slideInLeft}
        initial="initial"
        animate="animate"
      >
        {/* Background */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/sahmi-hero-bg.png')",
            y: heroY,
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/90 via-secondary/80 to-primary/90" />

        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              {t("auth.registerHero")}
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              {t("auth.registerHeroText")}
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            className="space-y-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {benefits.map((BenefitIcon, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <BenefitIcon className="h-5 w-5 text-teal-200" />
                </div>
                <span className="font-medium">{t(`auth.registerBenefits.${index}`)}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial */}
          <motion.div
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Quote className="h-8 w-8 text-teal-200 mb-4" />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-white/90 mb-4 italic">
                  “{t(`auth.registerTestimonials.${currentTestimonial}.quote`)}”
                </p>
                <div>
                  <p className="font-semibold text-white">
                    {testimonials[currentTestimonial].author}
                  </p>
                  <p className="text-sm text-white/60">
                    {t(`auth.registerTestimonials.${currentTestimonial}.role`)}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex gap-2 mt-4">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === currentTestimonial
                      ? "bg-teal-200 w-6"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-16 xl:px-24"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp} className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <SahmiLogo variant="icon" size="md" />
            <span className="text-xl font-bold text-primary">{t("nav.home")}</span>
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp} className="max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20"
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <Check className="h-10 w-10 text-success" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t("auth.accountCreated")}</h2>
                <p className="text-muted-foreground">{t("auth.redirecting")}</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-8">
                  <motion.div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 mb-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Rocket className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-medium text-secondary">{t("nav.register")}</span>
                  </motion.div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                    {t("auth.registerTitle")}
                  </h1>
                  <p className="text-muted-foreground">
                    {t("auth.registerSubtitle")}
                  </p>
                </div>

                <motion.div
                  className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 shadow-lg"
                  variants={fadeInUp}
                >
                  {/* Account Type Toggle */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <Label className="text-foreground font-medium mb-3 block">
                      {t("auth.accountType")}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        onClick={() => setUserType("investor")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          userType === "investor"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium text-sm">{t("auth.investor")}</p>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setUserType("entrepreneur")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          userType === "entrepreneur"
                            ? "border-secondary bg-secondary/5 text-secondary"
                            : "border-border hover:border-secondary/30"
                        }`}
                      >
                        <Briefcase className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium text-sm">{t("auth.entrepreneur")}</p>
                      </motion.button>
                    </div>
                  </motion.div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="full_name" className="text-foreground font-medium">
                        {t("auth.fullName")}
                      </Label>
                      <div className="relative mt-2">
                        <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="full_name"
                          placeholder={t("auth.fullName")}
                          className="ps-10 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          autoComplete="name"
                          required
                        />
                      </div>
                      {fieldErrors.full_name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-xs text-destructive"
                        >
                          {fieldErrors.full_name}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="email" className="text-foreground font-medium">
                        {t("auth.email")}
                      </Label>
                      <div className="relative mt-2">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="ps-10 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          autoComplete="email"
                          required
                        />
                      </div>
                      {fieldErrors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-xs text-destructive"
                        >
                          {fieldErrors.email}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label htmlFor="password" className="text-foreground font-medium">
                        {t("auth.password")}
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.password")}
                          className="ps-10 pe-10 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Password Requirements */}
                      <div className="mt-3 space-y-2">
                        {passwordRequirements.map((req) => (
                          <motion.div
                            key={t(req.labelKey)}
                            className="flex items-center gap-2 text-sm"
                            initial={false}
                            animate={{
                              color: req.check(password) ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                            }}
                          >
                            <motion.div
                              initial={false}
                              animate={{
                                scale: req.check(password) ? 1 : 0.8,
                                opacity: req.check(password) ? 1 : 0.5,
                              }}
                            >
                              <Check className={`h-4 w-4 ${req.check(password) ? "text-success" : "text-muted-foreground"}`} />
                            </motion.div>
                            <span>{t(req.labelKey)}</span>
                          </motion.div>
                        ))}
                      </div>
                      {fieldErrors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-xs text-destructive"
                        >
                          {fieldErrors.password}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                    >
                      <Label htmlFor="confirm_password" className="text-foreground font-medium">{t("auth.confirmPassword")}</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input id="confirm_password" type={showPassword ? "text" : "password"} className="h-12 rounded-xl border-border/60 ps-10" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => { const next = { ...current }; delete next.confirm_password; return next; }); }} autoComplete="new-password" required minLength={8} />
                      </div>
                      {confirmPassword && password !== confirmPassword && <p className="mt-1 text-xs text-destructive">{t("auth.passwordMismatch")}</p>}
                      {fieldErrors.confirm_password && <p className="mt-1 text-xs text-destructive">{fieldErrors.confirm_password}</p>}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-start space-x-3"
                    >
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        className="mt-1"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {t("auth.agreePrefix")}{" "}
                        <Link to="/terms" className="text-primary hover:underline">{t("auth.terms")}</Link>{" "}
                        {t("common.and")}{" "}
                        <Link to="/privacy" className="text-primary hover:underline">{t("auth.privacy")}</Link>
                      </label>
                    </motion.div>

                    {fieldErrors.non_field_errors && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      >
                        <p className="text-sm text-destructive text-center">
                          {fieldErrors.non_field_errors}
                        </p>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all"
                        disabled={submitting || !agreedToTerms || password !== confirmPassword}
                      >
                        {submitting ? (
                          <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Loader2 className="h-5 w-5 animate-spin" />{t("auth.registering")}</motion.div>
                        ) : (
                          <span className="flex items-center gap-2">{t("auth.register")}<ArrowRight className="h-5 w-5 rtl-flip" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>

                <motion.p
                  variants={fadeInUp}
                  className="mt-8 text-center text-sm text-muted-foreground"
                >
                  {t("auth.haveAccount")}{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                  >{t("auth.login")}<motion.span whileHover={{ x: 2 }}>
                      <ArrowRight className="h-4 w-4 rtl-flip" />
                    </motion.span>
                  </Link>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
