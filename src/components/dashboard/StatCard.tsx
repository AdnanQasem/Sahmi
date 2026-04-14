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
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 cursor-pointer"
    >
      <motion.div
        animate={{ scale: isHovered ? 1.02 : 1, y: isHovered ? -4 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10"
      >
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: isHovered 
              ? "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px hsl(var(--primary) / 0.2)" 
              : "0 1px 3px rgba(0,0,0,0.05)"
          }}
          transition={{ duration: 0.3 }}
          style={{ margin: -2 }}
        />
        
        <div className="flex items-start justify-between relative">
          <div className="flex-1">
            <motion.p 
              className="text-sm font-medium text-muted-foreground mb-2"
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.p>
            <motion.p 
              className="text-3xl font-bold text-foreground tabular-nums tracking-tight"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {value}
            </motion.p>
            {subtext && (
              <motion.p 
                className="mt-2 text-xs text-muted-foreground"
                animate={{ opacity: isHovered ? 1 : 0.7 }}
                transition={{ duration: 0.2 }}
              >
                {subtext}
              </motion.p>
            )}
            {trend && trendValue && (
              <motion.div 
                className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <motion.div
                  animate={{ y: trend === "up" ? [0, -2, 0] : trend === "down" ? [0, 2, 0] : [0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                </motion.div>
                <span>{trendValue}</span>
              </motion.div>
            )}
          </div>
          <motion.div
            animate={{ 
              rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
              scale: isHovered ? 1.15 : 1
            }}
            transition={{ duration: 0.4 }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBgClass} ${iconColorClass} shadow-lg`}
            style={{
              boxShadow: isHovered 
                ? `0 8px 20px ${iconColorClass.includes("primary") ? "hsl(var(--primary) / 0.2)" : iconColorClass.includes("secondary") ? "hsl(var(--secondary) / 0.2)" : "rgba(0,0,0,0.1)"}`
                : "none"
            }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-2xl"
        initial={{ width: "0%" }}
        animate={{ width: isHovered ? "100%" : "0%" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      
      <motion.div
        className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-xl"
        animate={{ 
          scale: isHovered ? 1.5 : 0.5,
          opacity: isHovered ? 0.5 : 0
        }}
        transition={{ duration: 0.4 }}
        style={{ transform: "translate(30%, -30%)" }}
      />
    </motion.div>
  );
};

export default StatCard;