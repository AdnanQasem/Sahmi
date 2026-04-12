import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-8 py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Button size="sm" asChild className="cursor-pointer">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
      {ctaLabel && onCta && (
        <Button size="sm" onClick={onCta} className="cursor-pointer">
          {ctaLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
