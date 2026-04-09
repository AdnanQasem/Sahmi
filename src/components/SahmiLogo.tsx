import { motion } from "framer-motion";

interface SahmiLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

const SahmiLogo = ({ size = "md", variant = "full", className = "" }: SahmiLogoProps) => {
  const iconSizes = { sm: 28, md: 36, lg: 48 };
  const textSizes = { sm: "text-base", md: "text-xl", lg: "text-2xl" };
  const subSizes = { sm: "text-[8px]", md: "text-[10px]", lg: "text-xs" };
  const iconSize = iconSizes[size];

  return (
    <motion.div 
      className={`flex items-center gap-3 ${className}`} 
      aria-label="Sahmi Palestine Connect"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* SVG Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="sahmi-grad-premium" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="sahmi-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background rounded square with glass effect */}
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#sahmi-grad-premium)" />
        <rect x="2.5" y="2.5" width="43" height="43" rx="13.5" stroke="white" strokeOpacity="0.2" strokeWidth="1" />

        {/* Network dots — top-left cluster (minimalist) */}
        <circle cx="10" cy="10" r="2" fill="white" fillOpacity="0.4" />
        <circle cx="18" cy="8" r="1.5" fill="white" fillOpacity="0.2" />
        <line x1="10" y1="10" x2="18" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />

        {/* Olive branch stylized — more minimalist and elegant */}
        <path
          d="M14 34 Q20 28 26 22 Q30 18 34 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.95"
        />
        {/* Leaf petals simplified */}
        <path d="M20 28 Q16 22 22 20 Q24 23 20 28Z" fill="white" fillOpacity="0.9" />
        <path d="M26 22 Q22 16 28 14 Q30 18 26 22Z" fill="white" fillOpacity="0.9" />

        {/* The 'Sahm' (Arrow) — sharper fintech look */}
        <path
          d="M34 14 L28 14 M34 14 L34 20 M34 14 L40 8"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="1"
          fill="none"
        />

        {/* Bottom-right network dots */}
        <circle cx="38" cy="38" r="2" fill="white" fillOpacity="0.4" />
        <circle cx="30" cy="40" r="1.5" fill="white" fillOpacity="0.2" />
        <line x1="38" y1="38" x2="30" y2="40" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />

        {/* Pulse center dot */}
        <circle cx="24" cy="24" r="1.5" fill="white" fillOpacity="0.6">
          <animate attributeName="r" values="1.5;2.5;1.5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Text */}
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-extrabold tracking-[-0.03em] ${textSizes[size]}`}
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sahmi
          </span>
          <span className={`${subSizes[size]} font-bold text-muted-foreground tracking-[0.2em] uppercase opacity-70 mt-0.5`}>
            Palestine Connect
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default SahmiLogo;
