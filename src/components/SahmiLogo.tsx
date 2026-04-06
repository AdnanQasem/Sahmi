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
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="Sahmi Palestine Connect">
      {/* ===== SVG LOGO ICON ===== */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main gradient: emerald → royal blue */}
          <linearGradient id="sahmi-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0d7377" />
            <stop offset="100%" stopColor="#2855c8" />
          </linearGradient>
        </defs>

        {/* Rounded background square */}
        <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#sahmi-bg)" />

        {/* ══════════════════════════════
            OPEN HAND — outstretched palm
            offering upward (giving / hope)
        ══════════════════════════════ */}

        {/* Four fingers — pointing up, slightly fanned */}
        {/* Index finger */}
        <rect x="11" y="23" width="4.5" height="12" rx="2.2" fill="white" fillOpacity="0.93" />
        {/* Middle finger (tallest) */}
        <rect x="16.5" y="20" width="4.5" height="15" rx="2.2" fill="white" fillOpacity="0.93" />
        {/* Ring finger */}
        <rect x="22" y="22" width="4.5" height="13" rx="2.2" fill="white" fillOpacity="0.93" />
        {/* Pinky */}
        <rect x="27.5" y="25" width="4" height="10" rx="2" fill="white" fillOpacity="0.85" />

        {/* Palm base (connects all fingers) */}
        <rect x="11" y="33" width="20.5" height="7" rx="3" fill="white" fillOpacity="0.93" />

        {/* Thumb (angled left) */}
        <path
          d="M11 36 Q9 34 8.5 31 Q8.5 28 10 28 Q11.5 28 12 30 L12 36Z"
          fill="white"
          fillOpacity="0.85"
        />

        {/* Subtle finger separation shading */}
        <line x1="15.5" y1="25" x2="15.5" y2="34" stroke="url(#sahmi-bg)" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="21" y1="24" x2="21" y2="34" stroke="url(#sahmi-bg)" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="26.5" y1="26" x2="26.5" y2="34" stroke="url(#sahmi-bg)" strokeWidth="0.5" strokeOpacity="0.3" />

        {/* ══════════════════════════════
            OLIVE BRANCH — held above hand
            symbol of peace + Palestine
        ══════════════════════════════ */}

        {/* Branch stem — rises from middle fingertip */}
        <path
          d="M18.5 20 Q19 14 20 9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.95"
        />

        {/* Leaf left-lower */}
        <path d="M19 17 Q14 16 14 12 Q19 12 19 17Z" fill="white" fillOpacity="0.88" />
        {/* Leaf right-lower */}
        <path d="M19.5 15 Q24 13 25 9 Q21 9 19.5 15Z" fill="white" fillOpacity="0.88" />
        {/* Leaf left-upper (small) */}
        <path d="M19.5 12 Q15.5 10.5 16 7 Q20 8 19.5 12Z" fill="white" fillOpacity="0.68" />
        {/* Bud at tip */}
        <circle cx="20" cy="8.5" r="1.8" fill="white" fillOpacity="0.92" />

        {/* ══════════════════════════════
            NETWORK DOTS — community nodes
            connected by dashed lines
        ══════════════════════════════ */}

        {/* Node A — top right (primary node, "active") */}
        <circle cx="38" cy="10" r="3.2" fill="white" fillOpacity="0.88" />
        {/* Pulse ring around node A */}
        <circle cx="38" cy="10" r="5.8" stroke="white" strokeWidth="0.7" strokeOpacity="0.25" fill="none" />

        {/* Node B — right-middle */}
        <circle cx="41" cy="22" r="2.4" fill="white" fillOpacity="0.72" />

        {/* Node C — right-lower */}
        <circle cx="37" cy="33" r="2" fill="white" fillOpacity="0.56" />

        {/* Dashed connection: A → B */}
        <line x1="38" y1="13" x2="41" y2="20" stroke="white" strokeWidth="1.1" strokeOpacity="0.42" strokeDasharray="2 1.8" />
        {/* Dashed connection: B → C */}
        <line x1="41" y1="24" x2="37" y2="31" stroke="white" strokeWidth="1.1" strokeOpacity="0.38" strokeDasharray="2 1.8" />

        {/* Branch bud → Node A (branch feeds the community network) */}
        <line x1="22" y1="9" x2="34.8" y2="10" stroke="white" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="1.5 2" />
        {/* Palm → Node C (hand giving to community) */}
        <line x1="31.5" y1="33" x2="35" y2="33" stroke="white" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="1.5 2" />
      </svg>

      {/* ===== LOGO TEXT ===== */}
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-tight ${textSizes[size]}`}
            style={{
              background: "linear-gradient(135deg, hsl(174 78% 26%), hsl(224 76% 48%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sahmi
          </span>
          <span
            className={`${subSizes[size]} font-medium tracking-widest uppercase`}
            style={{ color: "hsl(215 16% 47%)" }}
          >
            Palestine Connect
          </span>
        </div>
      )}
    </div>
  );
};

export default SahmiLogo;
