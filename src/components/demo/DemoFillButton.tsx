import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// Local development should expose these helpers without requiring a special
// Vite mode. Production builds still require the explicit demo flag.
export const isDemoMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true";

interface DemoFillButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const DemoFillButton = ({ onClick, disabled, className }: DemoFillButtonProps) => {
  const { t } = useTranslation();
  if (!isDemoMode) return null;

  return (
    <Button type="button" size="sm" variant="outline" className={className} disabled={disabled} onClick={onClick}>
      <Sparkles className="h-4 w-4" />
      {t("demo.fillFields")}
    </Button>
  );
};

export default DemoFillButton;
