import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FundingProgressBarProps {
  raised: number;
  goal: number;
  showLabels?: boolean;
  size?: "sm" | "md";
}

const FundingProgressBar = ({
  raised,
  goal,
  showLabels = true,
  size = "md",
}: FundingProgressBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const percent = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
  const barHeight = size === "sm" ? "h-2" : "h-3";

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-2 flex items-center justify-between text-xs">
          <motion.span 
            className="font-semibold text-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            ${raised.toLocaleString()}{" "}
            <span className="font-normal text-muted-foreground">
              of ${goal.toLocaleString()}
            </span>
          </motion.span>
          <motion.span 
            className="font-bold text-primary"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
          >
            {percent}%
          </motion.span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gradient-to-r from-muted to-muted/50 ${barHeight} relative`}
      >
        <motion.div
          className={`${barHeight} rounded-full relative overflow-hidden`}
          initial={{ width: "0%" }}
          animate={{ width: isVisible ? `${percent}%` : "0%" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          style={{
            background: percent >= 100 
              ? "linear-gradient(90deg, hsl(var(--success)), hsl(var(--success) / 0.8))"
              : percent >= 75 
                ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))"
                : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))"
          }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1
            }}
          />
        </motion.div>
        
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <motion.div
            className="h-full w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FundingProgressBar;