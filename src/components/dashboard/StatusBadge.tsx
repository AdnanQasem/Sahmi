import { Badge } from "@/components/ui/badge";

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
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  pending_review: {
    label: "Pending Review",
    className:
      "bg-warning/10 text-warning border-warning/30",
  },
  active: {
    label: "Active",
    className:
      "bg-success/10 text-success border-success/30",
  },
  approved: {
    label: "Approved",
    className:
      "bg-primary/10 text-primary border-primary/30",
  },
  funded: {
    label: "Funded",
    className:
      "bg-success/15 text-success border-success/30",
  },
  successful: {
    label: "Funded",
    className:
      "bg-success/15 text-success border-success/30",
  },
  closed: {
    label: "Closed",
    className:
      "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  failed: {
    label: "Failed",
    className:
      "bg-destructive/10 text-destructive border-destructive/30",
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
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
