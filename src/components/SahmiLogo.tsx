import { motion } from "framer-motion";

interface SahmiLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

const SahmiLogo = ({ size = "md", variant = "full", className = "" }: SahmiLogoProps) => {
  const sizes = {
    sm: { icon: 28, gap: "gap-1.5" },
    md: { icon: 36, gap: "gap-2" },
    lg: { icon: 48, gap: "gap-2.5" },
  };
  
  const textSizes = {
    sm: { main: "text-xl", sub: "text-[8px]" },
    md: { main: "text-2xl", sub: "text-[10px]" },
    lg: { main: "text-3xl", sub: "text-xs" },
  };

  const { icon, gap } = sizes[size];
  const { main, sub } = textSizes[size];

  return (
    <motion.div
      className={`flex items-center ${gap} ${className}`}
      aria-label="Sahmi Palestine Connect"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Modern Icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Background rounded square */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="10"
          fill="url(#sahmi-bg-gradient)"
        />
        
        {/* Main "S" letterform */}
        <path
          d="M15 16C15 13.7909 16.7909 12 19 12H25C30.5228 12 35 16.4772 35 22V22C35 27.5228 30.5228 32 25 32H19C16.7909 32 15 33.7909 15 36V36"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Connection dots */}
        <circle cx="15" cy="16" r="3" fill="url(#sahmi-accent-gradient)" />
        <circle cx="35" cy="32" r="3" fill="url(#sahmi-accent-gradient)" />
        
        {/* Small accent dot */}
        <circle cx="24" cy="22" r="2" fill="white" fillOpacity="0.4" />
        
        <defs>
          <linearGradient id="sahmi-bg-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="50%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="sahmi-accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>

      {variant === "full" && (
        <div className="flex flex-col leading-tight select-none">
          {/* Main wordmark */}
          <span
            className={`${main} font-extrabold tracking-tight`}
            style={{
              fontFamily: "'Inter', 'Outfit', sans-serif",
              background: "linear-gradient(135deg, #14B8A6 0%, #0F766E 50%, #2563EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sahmi
          </span>
          {/* Tagline */}
          <span
            className={`${sub} font-medium tracking-wide uppercase mt-0.5`}
            style={{
              color: "#0F766E",
              opacity: 0.75,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.15em",
            }}
          >
            Palestine Connect
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default SahmiLogo;