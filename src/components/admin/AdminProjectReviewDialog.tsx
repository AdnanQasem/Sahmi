import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, MapPin, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/dashboard/StatusBadge";
import type { Project } from "@/services/projectsService";

interface AdminProjectReviewDialogProps {
  project: Project | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const AdminProjectReviewDialog = ({
  project,
  notes,
  onNotesChange,
  onOpenChange,
  onApprove,
  onReject,
  isPending,
}: AdminProjectReviewDialogProps) => (
  <Dialog open={!!project} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
      {project && (
        <>
          <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 sm:h-52">
            {project.cover_image ? (
              <img
                src={project.cover_image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShieldCheck className="h-14 w-14 text-primary/35" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
              <div className="min-w-0 text-white">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/75">
                  Project review
                </p>
                <h2 className="truncate text-xl font-bold sm:text-2xl">{project.title}</h2>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="sr-only">Review {project.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Review the project information and approve or reject its publication.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Owner</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {project.entrepreneur?.full_name || project.entrepreneur?.email || "Unknown"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {project.category_detail?.name || "Uncategorized"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Goal</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(project.goal_amount)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/25 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expected ROI</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{Number(project.expected_roi)}%</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.location}
                </span>
                <span>
                  Submitted {new Date(project.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground">{project.short_description}</p>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="review-notes">Review notes</Label>
                <span className="text-[11px] text-muted-foreground">Required when rejecting</span>
              </div>
              <Textarea
                id="review-notes"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Record the decision or explain what the owner needs to change..."
                rows={4}
                maxLength={2000}
                disabled={isPending}
              />
              <p className="text-right text-[11px] text-muted-foreground">{notes.length}/2000</p>
            </div>

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button variant="ghost" asChild disabled={isPending}>
                <Link to={"/projects/" + project.slug} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View project
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onReject}
                disabled={isPending || !notes.trim()}
              >
                <XCircle className="h-4 w-4" />
                {isPending ? "Saving..." : "Reject"}
              </Button>
              <Button onClick={onApprove} disabled={isPending}>
                <CheckCircle2 className="h-4 w-4" />
                {isPending ? "Saving..." : "Approve & publish"}
              </Button>
            </DialogFooter>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default AdminProjectReviewDialog;
