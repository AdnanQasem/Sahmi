import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import investmentsService from "@/services/investmentsService";
import projectsService from "@/services/projectsService";
import {
  Search,
  Users,
  TrendingUp,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  ChevronDown,
  Filter,
  Download,
  MoreVertical,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Send,
  Eye,
} from "lucide-react";

const currency = (value: number) => formatCurrency(value);
const shortDate = (value: string) => formatDate(value, { month: "short", day: "numeric", year: "numeric" });

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

const mockInvestors = [
  {
    id: "1",
    name: "Sarah Ahmed",
    email: "sarah.ahmed@email.com",
    avatar: "SA",
    totalInvested: 25000,
    projectCount: 4,
    lastInvestment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    status: "active",
    projects: ["Solar Energy Initiative", "Clean Water Project"],
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
  {
    id: "2",
    name: "Mohammad Hassan",
    email: "m.hassan@email.com",
    avatar: "MH",
    totalInvested: 18500,
    projectCount: 3,
    lastInvestment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    status: "active",
    projects: ["Tech Hub Development"],
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
  {
    id: "3",
    name: "Layla Khaled",
    email: "layla.k@email.com",
    avatar: "LK",
    totalInvested: 42000,
    projectCount: 6,
    lastInvestment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    status: "premium",
    projects: ["Solar Energy Initiative", "Clean Water Project", "Youth Education"],
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180),
  },
  {
    id: "4",
    name: "Ahmad Nasser",
    email: "a.nasser@email.com",
    avatar: "AN",
    totalInvested: 8000,
    projectCount: 2,
    lastInvestment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    status: "active",
    projects: ["Agricultural Innovation"],
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "5",
    name: "Fatima Omar",
    email: "fatima.omar@email.com",
    avatar: "FO",
    totalInvested: 35000,
    projectCount: 5,
    lastInvestment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    status: "premium",
    projects: ["Tech Hub Development", "Healthcare Access", "Clean Water Project"],
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
  },
  {
    id: "6",
    name: "Yusuf Mansour",
    email: "yusuf.m@email.com",
    avatar: "YM",
    totalInvested: 12000,
    projectCount: 2,
    lastInvestment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    status: "active",
    projects: ["Solar Energy Initiative"],
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
  },
];

const InvestorsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "amount" | "name">("recent");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "premium">("all");
  const [selectedInvestor, setSelectedInvestor] = useState<typeof mockInvestors[0] | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "projects"],
    queryFn: projectsService.listMyProjects,
  });

  const investmentsQuery = useQuery({
    queryKey: ["dashboard", "entrepreneur", "investments"],
    queryFn: investmentsService.listInvestments,
  });

  const projects = projectsQuery.data?.results ?? [];
  const investments = investmentsQuery.data?.results ?? [];

  const filteredInvestors = mockInvestors.filter((investor) => {
    const matchesSearch = 
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || investor.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "amount") return b.totalInvested - a.totalInvested;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return b.lastInvestment.getTime() - a.lastInvestment.getTime();
  });

  const totalInvestments = filteredInvestors.reduce((sum, i) => sum + i.totalInvested, 0);
  const activeInvestors = filteredInvestors.filter(i => i.status === "active").length;
  const premiumInvestors = filteredInvestors.filter(i => i.status === "premium").length;
  const avgInvestment = filteredInvestors.length > 0 ? Math.round(totalInvestments / filteredInvestors.length) : 0;

  const kpiCards = [
    {
      label: t("investorPage.totalInvestors"),
      value: formatNumber(filteredInvestors.length),
      subtext: t("investorPage.activeCount", { count: formatNumber(activeInvestors) }),
      icon: Users,
      gradient: "from-primary to-primary/80",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: t("investorPage.totalInvested"),
      value: currency(totalInvestments),
      subtext: t("investorPage.acrossProjects"),
      icon: DollarSign,
      gradient: "from-success to-success/80",
      bgColor: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: t("investorPage.premiumInvestors"),
      value: formatNumber(premiumInvestors),
      subtext: t("investorPage.topSupporters"),
      icon: Sparkles,
      gradient: "from-warning to-warning/80",
      bgColor: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      label: t("investorPage.averageInvestment"),
      value: currency(avgInvestment),
      subtext: t("investorPage.perInvestor"),
      icon: TrendingUp,
      gradient: "from-secondary to-secondary/80",
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
    },
  ];

  return (
    <DashboardLayout roleBase="/dashboard/entrepreneur">
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-6 sm:p-8">
            <div className="space-y-2">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">{t("investorPage.badge")}</span>
              </motion.div>
              <motion.h1 
                className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t("investorPage.title")}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {t("investorPage.subtitle")}
              </motion.p>
            </div>
            <motion.div 
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                variant="outline"
                size="lg"
                className="group bg-background/80 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-300"
              >
                <Download className="me-2 h-4 w-4" />
                {t("investorPage.export")}
              </Button>
              <Button 
                size="lg"
                className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-secondary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              >
                <Send className="me-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                {t("investorPage.sendUpdate")}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <AnimatePresence mode="wait">
            {kpiCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${card.bgColor}`} />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{card.label}</p>
                    <motion.p 
                      className="text-3xl font-bold text-foreground tabular-nums tracking-tight"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    >
                      {card.value}
                    </motion.p>
                    <p className="mt-2 text-xs text-muted-foreground">{card.subtext}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bgColor} ${card.iconColor} shadow-lg`}
                  >
                    <card.icon className="h-6 w-6" />
                  </motion.div>
                </div>
                
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ width: '100%' }} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("investorPage.search")}
              className="ps-10 h-11 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
              {["all", "active", "premium"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as typeof filterStatus)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {t(status === "all" ? "common.all" : status === "premium" ? "dashboard.premium" : "status.active")}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-11 appearance-none rounded-xl border border-border bg-card px-4 pe-10 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="recent">{t("investorPage.mostRecent")}</option>
                <option value="amount">{t("investorPage.highestAmount")}</option>
                <option value="name">{t("investorPage.nameOrder")}</option>
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Investors List */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredInvestors.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6"
                  >
                    <Users className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("investorPage.noInvestors")}</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {t(searchQuery ? "investorPage.adjustSearch" : "investorPage.backersAppear")}
                  </p>
                </motion.div>
              ) : (
                filteredInvestors.map((investor, index) => (
                  <motion.div
                    key={investor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedInvestor(investor)}
                    className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      selectedInvestor?.id === investor.id ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-start gap-4">
                      {/* Avatar */}
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-bold text-primary-foreground shadow-lg ${
                          investor.status === "premium"
                            ? "bg-gradient-to-br from-warning to-warning/70 shadow-warning/30"
                            : "bg-gradient-to-br from-primary to-secondary shadow-primary/30"
                        }`}
                      >
                        {investor.avatar}
                        {investor.status === "premium" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-foreground"
                          >
                            <Sparkles className="h-3 w-3" />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {investor.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  investor.status === "premium"
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : "bg-success/10 text-success border-success/20"
                                }`}
                              >
                                {t(investor.status === "premium" ? "investorPage.premiumInvestor" : "investorPage.active")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {t("investorPage.projectCount", { count: formatNumber(investor.projectCount) })}
                              </span>
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="text-lg font-bold text-foreground">{currency(investor.totalInvested)}</p>
                            <p className="text-xs text-muted-foreground">{t("investorPage.totalInvested")}</p>
                          </div>
                        </div>

                        {/* Projects */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {investor.projects.slice(0, 2).map((project) => (
                            <Badge key={project} variant="outline" className="text-xs border-primary/20">
                              {project}
                            </Badge>
                          ))}
                          {investor.projects.length > 2 && (
                            <Badge variant="outline" className="text-xs bg-muted border-muted">
                              {t("investorPage.more", { count: formatNumber(investor.projects.length - 2) })}
                            </Badge>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t("investorPage.last", { date: shortDate(investor.lastInvestment.toISOString()) })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {investor.email}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <motion.div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ x: 2 }}
                      >
                        <ArrowRight className="h-4 w-4 text-primary rtl:rotate-180" />
                      </motion.div>
                    </div>

                    {/* Hover indicator line */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ width: '100%' }} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Quick Stats */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Selected Investor Details */}
            <AnimatePresence mode="wait">
              {selectedInvestor ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
                  
                  <div className="text-center mb-6">
                    <motion.div
                      layoutId={`avatar-${selectedInvestor.id}`}
                      className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-xl font-bold text-xl text-primary-foreground shadow-lg ${
                        selectedInvestor.status === "premium"
                          ? "bg-gradient-to-br from-warning to-warning/70"
                          : "bg-gradient-to-br from-primary to-secondary"
                      }`}
                    >
                      {selectedInvestor.avatar}
                    </motion.div>
                    <motion.h3 layoutId={`name-${selectedInvestor.id}`} className="mt-4 text-lg font-semibold text-foreground">
                      {selectedInvestor.name}
                    </motion.h3>
                    <p className="text-sm text-muted-foreground" dir="ltr"><bdi>{selectedInvestor.email}</bdi></p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold text-primary">{currency(selectedInvestor.totalInvested)}</p>
                      <p className="text-xs text-muted-foreground">{t("investorPage.totalInvested")}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold text-secondary">{selectedInvestor.projectCount}</p>
                      <p className="text-xs text-muted-foreground">{t("investorPage.projects")}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full group">
                      <Mail className="me-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                      {t("investorPage.sendMessage")}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Eye className="me-2 h-4 w-4" />
                      {t("investorPage.viewActivity")}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
                >
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4"
                    >
                      <Users className="h-8 w-8 text-primary" />
                    </motion.div>
                    <h4 className="font-semibold text-foreground mb-2">{t("investorPage.selectInvestor")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("investorPage.selectText")}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-6"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{t("investorPage.tip")}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("investorPage.tipText")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
};

export default InvestorsPage;