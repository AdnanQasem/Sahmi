import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminProjectGovernanceProps,
  AdminProjectSectionProps,
} from "./AdminProjectFormTypes";

export const AdminProjectGovernanceFields = ({
  form,
  update,
  owners,
}: AdminProjectGovernanceProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-foreground">Verification and lifecycle</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Override approval metadata and the soft-deletion state.
      </p>
    </div>
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div>
        <Label htmlFor="admin-project-verified" className="text-base">Verified project</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Allow the project to carry Sahmi's verified approval state.
        </p>
      </div>
      <Switch
        id="admin-project-verified"
        checked={form.is_verified || false}
        onCheckedChange={(checked) => update("is_verified", checked)}
      />
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="admin-project-verifier">Verified by</Label>
        <Select
          value={form.verified_by || "none"}
          onValueChange={(value) => update("verified_by", value === "none" ? null : value)}
        >
          <SelectTrigger id="admin-project-verifier"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No verifier</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.full_name || owner.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-verified-at">Verified at</Label>
        <Input
          id="admin-project-verified-at"
          type="datetime-local"
          value={form.verified_at || ""}
          onChange={(event) => update("verified_at", event.target.value || null)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-verification-notes">Verification notes</Label>
        <Textarea
          id="admin-project-verification-notes"
          rows={5}
          value={form.verification_notes || ""}
          onChange={(event) => update("verification_notes", event.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-deleted-at">Soft-deleted at</Label>
        <Input
          id="admin-project-deleted-at"
          type="datetime-local"
          value={form.deleted_at || ""}
          onChange={(event) => update("deleted_at", event.target.value || null)}
        />
        <p className="text-xs text-muted-foreground">
          Clear this value to restore a previously soft-deleted project.
        </p>
      </div>
    </div>
  </div>
);

export const AdminProjectIntelligenceFields = ({
  form,
  update,
}: AdminProjectSectionProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-foreground">AI classification metadata</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Inspect or override automated classification and generated copy.
      </p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="admin-project-ai-category">Classified category</Label>
        <Input
          id="admin-project-ai-category"
          maxLength={100}
          value={form.ai_classified_category || ""}
          onChange={(event) => update("ai_classified_category", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-ai-confidence">Confidence (0–1)</Label>
        <Input
          id="admin-project-ai-confidence"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={form.ai_confidence_score || ""}
          onChange={(event) => update("ai_confidence_score", event.target.value || null)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-ai-date">Classification time</Label>
        <Input
          id="admin-project-ai-date"
          type="datetime-local"
          value={form.ai_classification_at || ""}
          onChange={(event) => update("ai_classification_at", event.target.value || null)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-ai-summary">Generated summary</Label>
        <Textarea
          id="admin-project-ai-summary"
          rows={8}
          value={form.ai_generated_summary || ""}
          onChange={(event) => update("ai_generated_summary", event.target.value)}
        />
      </div>
    </div>
  </div>
);
