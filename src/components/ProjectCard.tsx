import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatNumber, formatPercent } from "@/i18n/format";
import { calculateFundingPercent, fundingProgressBarWidth, fundingProgressColor } from "@/lib/fundingProgress";

export interface ProjectData {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category: string;
  founder: string;
  image: string;
  goal: number;
  raised: number;
  investors: number;
  daysLeft: number;
  repaymentStatus?: "on_track" | "delayed" | "completed";
  verified: boolean;
}

interface ProjectCardProps {
  project: ProjectData;
  successfullyFunded?: boolean;
}

const ProjectCard = ({ project, successfullyFunded = false }: ProjectCardProps) => {
  const { t } = useTranslation();
  const percentFunded = calculateFundingPercent(project.raised, project.goal);
  const progressColor = fundingProgressColor(percentFunded);

  return (
    <motion.div 
      whileHover={{ y: -10, transition: { duration: 0.3, ease: "easeOut" } }}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-2xl ${
        successfullyFunded
          ? "border-success/25 bg-success/[0.04] hover:border-success/40"
          : "border-border/50 bg-card hover:border-primary/20"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute start-3 top-3">
          <Badge variant="muted" className="bg-card/90 text-foreground backdrop-blur-sm">
            {project.category}
          </Badge>
        </div>
        {successfullyFunded && (
          <Badge
            variant="outline"
            className="absolute end-3 top-3 gap-1 border-success/30 bg-card/95 text-success backdrop-blur-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("projects.successfullyFundedBadge")}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-foreground">
          {project.title}
        </h3>
        <p className="mb-1 text-xs text-muted-foreground">{t("projects.by", { name: project.founder })}</p>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-auto">
          <div className="mb-4 pt-1">
            <div className="mb-2 flex items-end justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold leading-none tracking-tight text-foreground">{formatCurrency(project.raised)}</span>
                <span className="text-xs font-medium text-muted-foreground">{t("projects.ofGoal", { goal: formatCurrency(project.goal) })}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: progressColor }}>
                {formatPercent(percentFunded)}
              </span>
            </div>
            
            {/* Custom Fintech Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/50">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${fundingProgressBarWidth(percentFunded)}%`,
                  backgroundColor: progressColor,
                }}
                role="progressbar"
                aria-valuenow={fundingProgressBarWidth(percentFunded)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={formatPercent(percentFunded)}
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(project.investors)} {t("projects.investors")}
            </span>
            {percentFunded >= 100 ? (
              <span className="max-w-[70%] text-end font-semibold text-success">
                {t(
                  project.repaymentStatus === "completed"
                    ? "projects.fundingAndRepaymentsCompleted"
                    : "projects.fundingCompleted",
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatNumber(project.daysLeft)} {t("projects.daysLeft")}
              </span>
            )}
          </div>

          <Button size="sm" className="w-full" asChild>
            <Link to={`/projects/${project.slug ?? project.id}`}>{t("projects.viewProject")}</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
