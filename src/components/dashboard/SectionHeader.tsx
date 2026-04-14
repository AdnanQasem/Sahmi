import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaIcon?: LucideIcon;
  onCta?: () => void;
  ctaHref?: string;
  children?: ReactNode;
}

const SectionHeader = ({
  title,
  subtitle,
  ctaLabel,
  ctaIcon: CtaIcon,
  onCta,
  children,
}: SectionHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-sm text-muted-foreground mt-0.5"
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2"
      >
        {children}
        {ctaLabel && onCta && (
          <Button
            variant="ghost"
            size="sm"
            className="group relative overflow-hidden text-primary font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300"
            onClick={onCta}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.3 }}
            />
            {CtaIcon && (
              <CtaIcon className="mr-1.5 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
            )}
            <span className="relative">{ctaLabel}</span>
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default SectionHeader;