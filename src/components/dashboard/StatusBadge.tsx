import { motion } from "framer-motion";

type ProjectStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "approved"
  | "funded"
  | "closed"
  | "failed"
  | "paused"
  | "successful";

interface StatusBadgeProps {
  status: ProjectStatus | string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; pulse?: boolean }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-muted/80 text-muted-foreground border-muted-foreground/20",
  },
  pending_review: {
    label: "Pending",
    className:
      "bg-warning/15 text-warning border-warning/30",
    pulse: true,
  },
  active: {
    label: "Active",
    className:
      "bg-success/15 text-success border-success/30",
    pulse: true,
  },
  approved: {
    label: "Approved",
    className:
      "bg-primary/15 text-primary border-primary/30",
  },
  funded: {
    label: "Funded",
    className:
      "bg-success/20 text-success border-success/40",
  },
  successful: {
    label: "Funded",
    className:
      "bg-success/20 text-success border-success/40",
  },
  closed: {
    label: "Closed",
    className:
      "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  failed: {
    label: "Failed",
    className:
      "bg-destructive/15 text-destructive border-destructive/30",
  },
  paused: {
    label: "Paused",
    className:
      "bg-warning/10 text-warning border-warning/30",
  },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-muted text-muted-foreground",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
      className={`relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${config.className}`}
    >
      {config.pulse && (
        <motion.span
          className="absolute inset-0 rounded-full bg-current"
          animate={{ opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: "blur(4px)" }}
        />
      )}
      {config.pulse && (
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span className="relative">{config.label}</span>
    </motion.span>
  );
};

export default StatusBadge;