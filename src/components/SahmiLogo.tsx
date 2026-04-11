import { motion } from "framer-motion";

interface SahmiLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

const SahmiLogo = ({ size = "md", variant = "full", className = "" }: SahmiLogoProps) => {
  const iconSizes = { sm: 30, md: 38, lg: 52 };
  const textSizes = { sm: "text-base", md: "text-xl", lg: "text-2xl" };
  const subSizes  = { sm: "text-[7px]", md: "text-[9px]", lg: "text-[11px]" };
  const iconSize  = iconSizes[size];

  return (
    <motion.div
      className={`flex items-center gap-2.5 ${className}`}
      aria-label="Sahmi Palestine Connect"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* ── SVG Icon ── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main teal→blue gradient */}
          <linearGradient id="sg-main" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#0D9D8A" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          {/* Inner shine */}
          <linearGradient id="sg-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0.22" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          {/* Glow filter for arrow */}
          <filter id="sg-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Drop shadow */}
          <filter id="sg-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0D9D8A" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* ── Background rounded square ── */}
        <rect x="1" y="1" width="46" height="46" rx="13"
          fill="url(#sg-main)" filter="url(#sg-shadow)" />
        {/* Shine overlay */}
        <rect x="1" y="1" width="46" height="22" rx="13"
          fill="url(#sg-shine)" />
        {/* Border */}
        <rect x="1.5" y="1.5" width="45" height="45" rx="12.5"
          stroke="white" strokeOpacity="0.2" strokeWidth="1" />

        {/* ── Rising arc baseline ── */}
        <path
          d="M9 37 Q18 30 24 24 Q30 18 39 11"
          stroke="white" strokeOpacity="0.2" strokeWidth="1.2"
          strokeLinecap="round" strokeDasharray="2 3" fill="none"
        />

        {/* ── Network nodes on the arc (bottom→top = investors connecting) ── */}
        {/* Node 1 — bottom left */}
        <circle cx="10" cy="36" r="2.8" fill="white" fillOpacity="0.3" />
        <circle cx="10" cy="36" r="1.8" fill="white" fillOpacity="0.7" />

        {/* Node 2 — mid */}
        <circle cx="22" cy="26" r="2.8" fill="white" fillOpacity="0.3" />
        <circle cx="22" cy="26" r="1.8" fill="white" fillOpacity="0.7" />

        {/* Node 3 — upper right */}
        <circle cx="34" cy="16" r="2.8" fill="white" fillOpacity="0.3" />
        <circle cx="34" cy="16" r="1.8" fill="white" fillOpacity="0.7" />

        {/* ── Connector lines between nodes ── */}
        <line x1="10" y1="36" x2="22" y2="26"
          stroke="white" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
        <line x1="22" y1="26" x2="34" y2="16"
          stroke="white" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />

        {/* ── Central upward arrow — the "Sahm" (سهم) ── */}
        {/* Shaft */}
        <line x1="24" y1="38" x2="24" y2="14"
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          strokeOpacity="0.95" filter="url(#sg-glow)" />
        {/* Arrowhead */}
        <path d="M18.5 20 L24 13 L29.5 20"
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          strokeLinejoin="round" fill="none" strokeOpacity="0.95" />

        {/* ── Animated pulse on middle node (highlight community hub) ── */}
        <circle cx="22" cy="26" r="2.8" fill="white" fillOpacity="0">
          <animate attributeName="r"       values="2.8;6;2.8"   dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="2.8s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* ── Wordmark ── */}
      {variant === "full" && (
        <div className="flex flex-col leading-none select-none">
          <span
            className={`font-extrabold tracking-[-0.03em] ${textSizes[size]}`}
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              background: "linear-gradient(135deg, hsl(174 78% 26%), hsl(224 76% 48%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sahmi
          </span>
          <span
            className={`${subSizes[size]} font-semibold tracking-[0.18em] uppercase mt-0.5`}
            style={{
              color: "hsl(174 78% 26%)",
              opacity: 0.65,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.18em",
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
