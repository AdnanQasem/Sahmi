import { ReactNode } from "react";
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
    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {ctaLabel && onCta && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-medium hover:bg-primary/5 cursor-pointer"
            onClick={onCta}
          >
            {CtaIcon && <CtaIcon className="mr-1.5 h-4 w-4" />}
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
