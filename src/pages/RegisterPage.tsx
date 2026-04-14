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

const benefits = [
  { icon: Briefcase, text: "Access to verified projects" },
  { icon: TrendingUp, text: "Track your investments" },
  { icon: Leaf, text: "Support local entrepreneurs" },
];

const testimonials = [
  {
    quote: "Joining Sahmi was the best decision for my startup. The community support is incredible.",
    author: "Maria A.",
    role: "Entrepreneur, Nablus",
  },
  {
    quote: "I've found amazing investment opportunities that I couldn't find anywhere else.",
    author: "Khaled M.",
    role: "Investor",
  },
];

const passwordRequirements = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "Contains a number", check: (p: string) => /\d/.test(p) },
  { label: "Contains a special character", check: (p: string) => /[!@#$%^&*]/.test(p) },
];

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
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
              Join the Movement for{" "}
              <span className="text-teal-200">Change</span>
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              Whether you're an entrepreneur with a vision or an investor seeking impact,
              Sahmi is your gateway to meaningful connections.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            className="space-y-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <benefit.icon className="h-5 w-5 text-teal-200" />
                </div>
                <span className="font-medium">{benefit.text}</span>
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
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div>
                  <p className="font-semibold text-white">
                    {testimonials[currentTestimonial].author}
                  </p>
                  <p className="text-sm text-white/60">
                    {testimonials[currentTestimonial].role}
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
            <span className="text-xl font-bold text-primary">Back to Home</span>
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
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Account Created!
                </h2>
                <p className="text-muted-foreground">
                  Redirecting you to sign in...
                </p>
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
                    <span className="text-xs font-medium text-secondary">Get Started</span>
                  </motion.div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                    Create your account
                  </h1>
                  <p className="text-muted-foreground">
                    Join Sahmi and start making an impact today
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
                      I want to
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
                        <p className="font-medium text-sm">Invest</p>
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
                        <p className="font-medium text-sm">Fundraise</p>
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
                        Full Name
                      </Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="full_name"
                          placeholder="Your full name"
                          className="pl-10 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
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
                        Email Address
                      </Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
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
                        Password
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10 h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                            key={req.label}
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
                            <span>{req.label}</span>
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
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">Terms</Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
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
                        disabled={submitting || !agreedToTerms}
                      >
                        {submitting ? (
                          <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating account...
                          </motion.div>
                        ) : (
                          <span className="flex items-center gap-2">
                            Create Account
                            <ArrowRight className="h-5 w-5" />
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
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                  >
                    Sign in
                    <motion.span whileHover={{ x: 2 }}>
                      <ArrowRight className="h-4 w-4" />
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
