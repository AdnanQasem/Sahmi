import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Smartphone,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  AlertCircle,
  Camera,
  Save,
  Loader2,
  Languages,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Activity,
  History,
  Coins,
} from "lucide-react";

type SettingsSection = "profile" | "account" | "security" | "notifications" | "billing";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  }
};

const tabVariants = {
  hidden: { opacity: 0, x: 15 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.08
    }
  },
  exit: { 
    opacity: 0, 
    x: -15,
    transition: { duration: 0.2 }
  }
};

const SettingsPage = () => {
  const { user } = useAuth();
  const roleBase = user?.user_type === "investor" ? "/dashboard/investor" : "/dashboard/entrepreneur";
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: "+966 50 123 4567",
    bio: "Active investor focusing on tech startups, renewable energy, and fintech developments across the MENA region. Passionate about high-growth business models.",
    location: "Riyadh, Saudi Arabia",
    website: "https://sahmi.io",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
    language: "english",
    timezone: "Asia/Riyadh (UTC+3)",
    recoveryEmail: "backup.investor@example.com",
    autoReinvest: false,
    defaultInvestment: "5000",
  });

  const [walletBalance, setWalletBalance] = useState(25000);
  const [downloadingInvoice, setDownloadingInvoice] = useState<Record<number, boolean>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [revokedSessions, setRevokedSessions] = useState<Record<number, boolean>>({});

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    projectUpdates: true,
    investorMessages: true,
    fundingMilestones: true,
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "Not Entered", color: "bg-muted text-muted-foreground", width: "w-0" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-destructive text-destructive-foreground", width: "w-1/3" };
    if (score <= 4) return { score, label: "Medium", color: "bg-warning text-warning-foreground", width: "w-2/3" };
    return { score, label: "Strong", color: "bg-success text-success-foreground", width: "w-full" };
  };

  const sections = [
    { id: "profile" as const, label: "Profile", icon: User, description: "Personal information" },
    { id: "account" as const, label: "Account", icon: Mail, description: "Email and phone" },
    { id: "security" as const, label: "Security", icon: Shield, description: "Password and 2FA" },
    { id: "notifications" as const, label: "Notifications", icon: Bell, description: "Alert preferences" },
    { id: "billing" as const, label: "Billing", icon: CreditCard, description: "Payment methods" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast.success("Settings saved successfully!", {
      description: "Your preferences and profile details have been updated.",
    });
  };

  const handleConnect = (provider: string) => {
    const isCurrentlyConnected = !!connected[provider];
    if (isCurrentlyConnected) {
      setConnected(prev => ({ ...prev, [provider]: false }));
      toast.success(`Disconnected from ${provider}`, {
        description: `Your Sahmi account is no longer linked to ${provider}.`
      });
    } else {
      const toastId = toast.loading(`Connecting to ${provider}...`, {
        description: "Please authorize the connection in the pop-up window."
      });
      setTimeout(() => {
        setConnected(prev => ({ ...prev, [provider]: true }));
        toast.success(`Successfully connected to ${provider}!`, {
          id: toastId,
          description: `Your Sahmi account is now linked to ${provider}.`
        });
      }, 1200);
    }
  };

  const handleDeposit = () => {
    setWalletBalance(prev => prev + 5000);
    toast.success("Deposit Successful", {
      description: "Successfully deposited $5,000.00 into your Sahmi wallet."
    });
  };

  const handleWithdraw = () => {
    if (walletBalance < 5000) {
      toast.error("Insufficient Funds", {
        description: "Your wallet balance is too low for this withdrawal (minimum $5,000.00)."
      });
      return;
    }
    setWalletBalance(prev => prev - 5000);
    toast.success("Withdrawal Initiated", {
      description: "Your request to withdraw $5,000.00 has been sent for bank processing."
    });
  };

  const handleDownloadInvoice = async (index: number, description: string) => {
    setDownloadingInvoice(prev => ({ ...prev, [index]: true }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDownloadingInvoice(prev => ({ ...prev, [index]: false }));
    toast.success("Invoice Downloaded", {
      description: `Invoice for "${description}" has been saved as PDF.`
    });
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <motion.div
            key="profile"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border">
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <motion.div 
                  className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  whileHover={{ opacity: 1 }}
                >
                  <Camera className="h-6 w-6 text-white" />
                </motion.div>
              </motion.div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-semibold text-foreground">{user?.full_name}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {user?.user_type === "entrepreneur" ? "Project Owner" : "Investor"}
                  </Badge>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="Your full name"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="relative group">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="City, Country"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Website</label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </motion.div>
            </div>
          </motion.div>
        );

      case "account":
        return (
          <motion.div
            key="account"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="p-5 rounded-2xl border border-warning/30 bg-warning/5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Email Change Required</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Changing your email will require verification from both your current and new email addresses.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Primary Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 pr-20 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                  />
                  <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2 bg-success/10 text-success border-success/20 text-xs">
                    Verified
                  </Badge>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="relative group">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </motion.div>

              {/* Language and Region selectors */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preferred Language</label>
                <div className="relative group">
                  <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full pl-10 pr-10 h-11 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="english">English (US)</option>
                    <option value="arabic">العربية (Arabic)</option>
                    <option value="french">Français (French)</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <div className="relative group">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full pl-10 pr-10 h-11 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Asia/Riyadh (UTC+3)">Riyadh, Saudi Arabia (UTC+3)</option>
                    <option value="Asia/Dubai (UTC+4)">Dubai, UAE (UTC+4)</option>
                    <option value="Europe/London (GMT)">London, UK (GMT)</option>
                    <option value="America/New_York (EST)">New York, USA (EST)</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                </div>
              </motion.div>
            </div>

            {/* Verification Tiers Status */}
            <motion.div variants={itemVariants} className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      Verification Level: Tier 2
                      <Badge className="bg-success/15 text-success border-success/20 text-[10px] font-semibold py-0">Approved</Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">Enables investment limits up to $100,000 per transaction.</p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.info("Verification Request Submitted", {
                    description: "Our compliance team will review your account credentials for Tier 3 upgrade."
                  })}
                  className="bg-card hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                >
                  Request Tier 3 Upgrade
                </Button>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 pt-2 border-t border-border/60">
                {[
                  { label: "Identity Verified", status: true },
                  { label: "Accreditation Checked", status: true },
                  { label: "Proof of Funds Verified", status: true },
                ].map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className="h-4 w-4 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="font-medium text-foreground/80">{tier.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Connected Accounts */}
            <motion.div variants={itemVariants} className="pt-4 space-y-3">
              <h4 className="font-medium text-foreground">Connected Accounts</h4>
              <div className="space-y-3">
                {["Google", "LinkedIn", "Twitter"].map((provider) => {
                  const isLinked = !!connected[provider];
                  return (
                    <motion.div
                      key={provider}
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border">
                          <KeyRound className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {provider}
                            {isLinked && (
                              <Badge className="bg-success/10 text-success border-success/20 text-[10px] py-0">Linked</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isLinked ? "Sign in enabled through this provider" : "Not connected"}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={isLinked ? "ghost" : "outline"} 
                        size="sm" 
                        onClick={() => handleConnect(provider)}
                        className={isLinked ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "hover:bg-primary/5 hover:border-primary/30"}
                      >
                        {isLinked ? "Disconnect" : "Connect"}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Deactivation zone */}
            <motion.div variants={itemVariants} className="pt-4 border-t border-border/80">
              <div className="p-5 rounded-2xl border border-muted-foreground/20 bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">Temporary Deactivation</h4>
                  <p className="text-xs text-muted-foreground">Temporarily freeze your account activities. You can reactivate anytime by logging back in.</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => toast.warning("Confirm Deactivation", {
                    description: "To confirm temporary deactivation, please contact support@sahmi.io.",
                    action: {
                      label: "Contact Support",
                      onClick: () => window.open("mailto:support@sahmi.io")
                    }
                  })}
                  className="text-muted-foreground hover:text-foreground border-muted-foreground/30 hover:bg-muted"
                >
                  Deactivate Account
                </Button>
              </div>
            </motion.div>
          </motion.div>
        );

      case "security":
        const strength = getPasswordStrength(formData.newPassword);
        return (
          <motion.div
            key="security"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Change Password
              </h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Current Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="pl-10 pr-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="pl-10 pr-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {formData.newPassword && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="space-y-2 mt-2 p-3 rounded-xl border border-border bg-muted/20 animate-fade-in"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-primary" /> Password Strength:
                        </span>
                        <span className={`font-semibold capitalize ${
                          strength.score <= 2 ? "text-destructive" : strength.score <= 4 ? "text-warning" : "text-success"
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            formData.newPassword.length >= 8 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/60"
                          }`}>
                            <Check className="h-2 w-2" />
                          </div>
                          <span>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            /[A-Z]/.test(formData.newPassword) && /[a-z]/.test(formData.newPassword) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/60"
                          }`}>
                            <Check className="h-2 w-2" />
                          </div>
                          <span>Uppercase & lowercase</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            /[0-9]/.test(formData.newPassword) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/60"
                          }`}>
                            <Check className="h-2 w-2" />
                          </div>
                          <span>Contains a number</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            /[^A-Za-z0-9]/.test(formData.newPassword) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/60"
                          }`}>
                            <Check className="h-2 w-2" />
                          </div>
                          <span>Contains a special character</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Backup Recovery Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Backup Recovery Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      value={formData.recoveryEmail}
                      onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })}
                      className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="recovery@email.com"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-1">
                    Used to securely reset your credentials if you lose access to your primary email.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4 border-t border-border space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Two-Factor Authentication
              </h4>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">Use an authenticator app for 2FA</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const nextVal = !formData.twoFactorEnabled;
                    setFormData({ ...formData, twoFactorEnabled: nextVal });
                    if (nextVal) {
                      toast.success("Two-Factor Authentication enabled!", {
                        description: "Your account is now protected with a secondary authenticator app."
                      });
                    } else {
                      toast.warning("Two-Factor Authentication disabled", {
                        description: "Your account security has been downgraded."
                      });
                    }
                  }}
                  className={`relative h-7 w-14 rounded-full transition-colors duration-300 ${
                    formData.twoFactorEnabled ? "bg-success" : "bg-muted"
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.twoFactorEnabled ? 28 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md"
                  />
                </motion.button>
              </div>

              {formData.twoFactorEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl border border-success/30 bg-success/5"
                >
                  <div className="flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Two-factor authentication is enabled</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Active Sessions */}
            <motion.div variants={itemVariants} className="pt-4 border-t border-border space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Active Sessions
              </h4>
              <div className="space-y-3">
                {[
                  { device: "MacBook Pro", location: "Riyadh, SA", current: true },
                  { device: "iPhone 15 Pro", location: "Riyadh, SA", current: false },
                  { device: "Windows Desktop", location: "Dubai, UAE", current: false },
                ].map((session, index) => {
                  const isRevoked = !!revokedSessions[index];
                  if (isRevoked) return null;
                  
                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border">
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {session.device}
                            {session.current && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                                Current
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{session.location}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setRevokedSessions(prev => ({ ...prev, [index]: true }));
                            toast.success(`Session on ${session.device} revoked successfully!`);
                          }}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Revoke
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Login History Log */}
            <motion.div variants={itemVariants} className="pt-4 border-t border-border space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Security Login History
              </h4>
              <div className="overflow-hidden rounded-xl border border-border/80">
                <div className="bg-muted/30 divide-y divide-border/60">
                  {[
                    { timestamp: "Today, 19:42", ip: "197.34.120.8", method: "Password + 2FA", status: "Success" },
                    { timestamp: "May 25, 14:10", ip: "94.23.45.109", method: "Password Connection", status: "Success" },
                    { timestamp: "May 12, 09:15", ip: "197.34.120.8", method: "Google Linked Login", status: "Success" },
                  ].map((log, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 text-xs gap-2">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{log.timestamp}</p>
                        <p className="text-muted-foreground">IP: {log.ip} • Method: {log.method}</p>
                      </div>
                      <Badge className="bg-success/10 text-success border-success/20 text-[10px] py-0 px-2">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            key="notifications"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {[
              {
                title: "Project Updates",
                description: "Get notified when projects you follow are updated",
                key: "projectUpdates" as const,
                icon: Bell,
              },
              {
                title: "Investor Messages",
                description: "Receive messages from potential investors",
                key: "investorMessages" as const,
                icon: Mail,
              },
              {
                title: "Funding Milestones",
                description: "Be notified when you reach funding goals",
                key: "fundingMilestones" as const,
                icon: Check,
              },
              {
                title: "Email Notifications",
                description: "Receive email notifications for important updates",
                key: "emailNotifications" as const,
                icon: Mail,
              },
              {
                title: "Push Notifications",
                description: "Get push notifications on your devices",
                key: "pushNotifications" as const,
                icon: Bell,
              },
              {
                title: "Marketing Emails",
                description: "Receive tips and updates about Sahmi",
                key: "marketingEmails" as const,
                icon: Mail,
              },
            ].map((item, index) => (
              <motion.div
                key={item.key}
                variants={itemVariants}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative h-7 w-14 rounded-full transition-colors duration-300 ${
                    notifications[item.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.key] ? 28 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md"
                  />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        );

      case "billing":
        return (
          <motion.div
            key="billing"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {/* Interactive wallet balance card */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary text-primary-foreground p-6 shadow-lg shadow-primary/20">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-primary-foreground/75 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Coins className="h-4 w-4" /> Sahmi Investment Wallet
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-extrabold tracking-tight">
                      ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                    <span className="text-xs text-primary-foreground/80 font-medium">USD</span>
                  </div>
                  <p className="text-xs text-primary-foreground/70">
                    Use these funds to instantly commit to raising projects.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    type="button" 
                    onClick={handleDeposit}
                    className="bg-white text-primary hover:bg-white/95 font-semibold shadow-md flex items-center gap-1.5 h-10 px-4 rounded-xl transition-all"
                  >
                    <ArrowDownRight className="h-4 w-4" /> Deposit Funds
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleWithdraw}
                    variant="outline"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold flex items-center gap-1.5 h-10 px-4 rounded-xl transition-all"
                  >
                    <ArrowUpRight className="h-4 w-4" /> Withdraw
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Auto-invest controls */}
            <motion.div variants={itemVariants} className="p-5 rounded-2xl border border-border bg-card space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Auto-Invest Configuration
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically invest available wallet funds into newly launched green initiatives.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const nextVal = !formData.autoReinvest;
                    setFormData(prev => ({ ...prev, autoReinvest: nextVal }));
                    if (nextVal) {
                      toast.success("Auto-Invest Enabled!", {
                        description: `Automatically allocating $${Number(formData.defaultInvestment).toLocaleString()} per project.`
                      });
                    } else {
                      toast.info("Auto-Invest Disabled");
                    }
                  }}
                  className={`relative h-7 w-14 rounded-full transition-colors duration-300 shrink-0 ${
                    formData.autoReinvest ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.autoReinvest ? 28 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md"
                  />
                </motion.button>
              </div>

              {formData.autoReinvest && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 border-t border-border/60 space-y-3"
                >
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Default Ticket Size per Project
                  </label>
                  <div className="flex gap-2">
                    {["1000", "5000", "10000"].map((size) => {
                      const isActive = formData.defaultInvestment === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, defaultInvestment: size }));
                            toast.success(`Investment size updated to $${Number(size).toLocaleString()}`);
                          }}
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                            isActive
                              ? "bg-primary/10 text-primary border-primary"
                              : "bg-background hover:bg-muted border-border text-muted-foreground"
                          }`}
                        >
                          ${Number(size).toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Methods
              </h4>
              <div className="space-y-3">
                {[
                  { type: "Visa", last4: "4242", exp: "12/25", primary: true },
                  { type: "Mastercard", last4: "8888", exp: "06/26", primary: false },
                ].map((card, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          {card.type} •••• {card.last4}
                          {card.primary && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                              Primary
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">Expires {card.exp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!card.primary && (
                        <Button variant="outline" size="sm" className="hover:bg-primary/5 hover:border-primary/30">
                          Set Primary
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30 transition-all">
                <CreditCard className="mr-2 h-4 w-4" />
                Add New Payment Method
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-6 border-t border-border space-y-4">
              <h4 className="font-medium text-foreground">Billing History</h4>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { date: "Jan 15, 2024", desc: "Investment - Solar Project", amount: "$5,000.00", status: "Completed" },
                      { date: "Dec 20, 2023", desc: "Platform Fee", amount: "$50.00", status: "Completed" },
                      { date: "Nov 10, 2023", desc: "Investment - Clean Water Initiative", amount: "$2,500.00", status: "Completed" },
                    ].map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.date}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.desc}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{item.amount}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!!downloadingInvoice[index]}
                            onClick={() => handleDownloadInvoice(index, item.desc)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                          >
                            {downloadingInvoice[index] ? (
                              <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
                            ) : (
                              <Download className="h-4.5 w-4.5" />
                            )}
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <DashboardLayout roleBase={roleBase}>
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Navigation */}
          <motion.nav 
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {sections.map((section) => (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                  activeSection === section.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                }`}
              >
                <section.icon className={`h-5 w-5 ${activeSection === section.id ? "text-primary" : ""}`} />
                <div className="flex-1">
                  <p className="font-medium">{section.label}</p>
                  <p className={`text-xs ${activeSection === section.id ? "text-primary/70" : "text-muted-foreground"}`}>
                    {section.description}
                  </p>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${activeSection === section.id ? "rotate-90" : ""}`} />
              </motion.button>
            ))}
          </motion.nav>

          {/* Content Area */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-transparent" />
            
            <AnimatePresence mode="wait">
              {renderSectionContent()}
            </AnimatePresence>

            {/* Save Button */}
            <motion.div 
              className="mt-8 pt-6 border-t border-border flex justify-end gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="outline" className="hover:bg-muted transition-colors">
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-secondary text-primary-foreground px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <span className="relative flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/50 to-transparent" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" className="hover:bg-destructive/90">
              Delete Account
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SettingsPage;
