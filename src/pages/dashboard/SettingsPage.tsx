import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    location: "",
    website: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    projectUpdates: true,
    investorMessages: true,
    fundingMilestones: true,
  });

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
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
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

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-sm font-medium text-foreground">Primary Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
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

            <motion.div variants={itemVariants} className="pt-4">
              <h4 className="font-medium text-foreground mb-4">Connected Accounts</h4>
              <div className="space-y-3">
                {["Google", "LinkedIn", "Twitter"].map((provider, index) => (
                  <motion.div
                    key={provider}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border">
                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{provider}</p>
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-primary/5 hover:border-primary/30">
                      Connect
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
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
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4 border-t border-border space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
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
                  onClick={() => setFormData({ ...formData, twoFactorEnabled: !formData.twoFactorEnabled })}
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

            <motion.div variants={itemVariants} className="pt-4 border-t border-border space-y-4">
              <h4 className="font-medium text-foreground">Active Sessions</h4>
              <div className="space-y-3">
                {[
                  { device: "MacBook Pro", location: "San Francisco, CA", current: true },
                  { device: "iPhone 15 Pro", location: "San Francisco, CA", current: false },
                  { device: "Windows Desktop", location: "New York, NY", current: false },
                ].map((session, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30"
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
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        Revoke
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Methods
              </h4>
              <div className="space-y-3">
                {[
                  { type: "Visa", last4: "4242", exp: "12/25", primary: true },
                  { type: "Mastercard", last4: "8888", exp: "06/26", primary: false },
                ].map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
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
                        <td className="px-4 py-3 text-right">
                          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                            {item.status}
                          </Badge>
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
    <DashboardLayout roleBase="/dashboard/entrepreneur">
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