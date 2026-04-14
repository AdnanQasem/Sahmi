import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  iconColorClass?: string;
  iconBgClass?: string;
  index?: number;
}

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  trendValue,
  iconColorClass = "text-primary",
  iconBgClass = "bg-primary/10",
  index = 0,
}: StatCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
      }}
      whileHover={{ y: -3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 cursor-pointer transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2 transition-colors duration-200 group-hover:text-foreground">
              {label}
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight transition-transform duration-200">
              {value}
            </p>
            {subtext && (
              <p className="mt-2 text-xs text-muted-foreground transition-opacity duration-200 group-hover:opacity-100">
                {subtext}
              </p>
            )}
          </div>
          <motion.div
            animate={{ 
              rotate: isHovered ? 5 : 0,
            }}
            transition={{ duration: 0.2 }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBgClass} ${iconColorClass}`}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        </div>

        <motion.div 
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
          initial={{ width: "0%" }}
          animate={{ width: isHovered ? "100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

export default StatCard;