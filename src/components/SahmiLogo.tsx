import { useId } from "react";
import { motion } from "framer-motion";

interface SahmiLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

const SahmiLogo = ({ size = "md", variant = "full", className = "" }: SahmiLogoProps) => {
  const iconSizes = { sm: 30, md: 38, lg: 52 };
  const textSizes = { sm: "text-[1.05rem]", md: "text-[1.45rem]", lg: "text-[2rem]" };
  const subSizes = { sm: "text-[7px]", md: "text-[9px]", lg: "text-[11px]" };
  const iconSize = iconSizes[size];
  const reactId = useId().replace(/:/g, "");
  const mainGradientId = `sahmi-main-${reactId}`;
  const glowId = `sahmi-glow-${reactId}`;
  const amberGradientId = `sahmi-amber-${reactId}`;

  return (
    <motion.div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label="Sahmi Palestine Connect"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={mainGradientId} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id={amberGradientId} x1="10" y1="36" x2="38" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path
          d="M13 35C17.8 31.8 21.1 28.3 25.5 24C29.9 19.6 33.8 15.7 40 12"
          stroke={`url(#${mainGradientId})`}
          strokeOpacity="0.2"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="2.5 3.5"
          fill="none"
        />

        <path
          d="M14.5 33.4C19.7 38 29.1 36.4 31.1 29.8C32.8 24.1 27.1 21.7 22.8 19.9C18.5 18.1 16.2 15.4 18.6 11.8C21.8 7 30.3 8 36.6 14.2"
          stroke={`url(#${mainGradientId})`}
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${glowId})`}
        />
        <path
          d="M34.9 8.8L39.2 16.2L30.8 16.9"
          stroke={`url(#${mainGradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        <circle cx="13" cy="35" r="2.4" fill={`url(#${amberGradientId})`} />
        <circle cx="13" cy="35" r="5.4" fill="#F59E0B" fillOpacity="0.12" />
        <circle cx="25" cy="24" r="2.2" fill="#0F766E" fillOpacity="0.8" />
        <circle cx="39" cy="13" r="2.4" fill={`url(#${amberGradientId})`} />
        <circle cx="39" cy="13" r="5.4" fill="#F59E0B" fillOpacity="0.12" />
      </svg>

      {variant === "full" && (
        <div className="-ml-2.5 flex flex-col leading-none select-none">
          <span
            className={`font-extrabold ${textSizes[size]}`}
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              color: "hsl(224 76% 48%)",
            }}
          >
            ahmi
          </span>
          <span
            className={`${subSizes[size]} font-semibold uppercase mt-0.5`}
            style={{
              color: "hsl(174 78% 26%)",
              opacity: 0.65,
              fontFamily: "'Inter', sans-serif",
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
