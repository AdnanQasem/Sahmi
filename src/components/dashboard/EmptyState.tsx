import { motion, AnimatePresence } from "framer-motion";
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
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-gradient-to-b from-muted/30 to-muted/10 px-8 py-16 text-center overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.1,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 shadow-lg">
          <motion.div
            animate={{ 
              y: [0, -4, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon className="h-9 w-9 text-primary" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-2 text-lg font-semibold text-foreground"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed"
      >
        {description}
      </motion.p>

      <AnimatePresence>
        {ctaLabel && (ctaHref || onCta) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
          >
            {ctaHref ? (
              <Button 
                size="lg"
                asChild 
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-secondary shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
              >
                <Link to={ctaHref}>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative">{ctaLabel}</span>
                </Link>
              </Button>
            ) : (
              <Button 
                size="lg"
                onClick={onCta}
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-secondary shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <span className="relative">{ctaLabel}</span>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-secondary/5"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
    </motion.div>
  );
};

export default EmptyState;