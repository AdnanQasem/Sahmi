import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProjectIdentityProps } from "./AdminProjectFormTypes";

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;

const AdminProjectIdentityFields = ({
  form,
  update,
  errors,
  owners,
  categories,
}: AdminProjectIdentityProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-foreground">Project identity</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ownership, catalogue placement, location, and public copy.
      </p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="admin-project-owner">Project owner *</Label>
        <Select value={form.entrepreneur} onValueChange={(value) => update("entrepreneur", value)}>
          <SelectTrigger id="admin-project-owner"><SelectValue placeholder="Select owner" /></SelectTrigger>
          <SelectContent>
            {owners.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.full_name || owner.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.entrepreneur} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-category">Category *</Label>
        <Select value={form.category} onValueChange={(value) => update("category", value)}>
          <SelectTrigger id="admin-project-category"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.category} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-title">Title *</Label>
        <Input
          id="admin-project-title"
          maxLength={100}
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
        />
        <FieldError message={errors.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-slug">URL slug</Label>
        <Input
          id="admin-project-slug"
          maxLength={140}
          value={form.slug || ""}
          onChange={(event) => update("slug", event.target.value)}
          placeholder="Generated from title when blank"
        />
        <FieldError message={errors.slug} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-short">Short description *</Label>
        <Textarea
          id="admin-project-short"
          rows={2}
          maxLength={200}
          value={form.short_description}
          onChange={(event) => update("short_description", event.target.value)}
        />
        <div className="flex items-center justify-between">
          <FieldError message={errors.short_description} />
          <p className="ml-auto text-xs text-muted-foreground">{form.short_description.length}/200</p>
        </div>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-description">Full description *</Label>
        <Textarea
          id="admin-project-description"
          rows={8}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
        <FieldError message={errors.description} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-location">Location *</Label>
        <Input
          id="admin-project-location"
          maxLength={120}
          value={form.location}
          onChange={(event) => update("location", event.target.value)}
        />
        <FieldError message={errors.location} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-project-governorate">Governorate</Label>
        <Input
          id="admin-project-governorate"
          maxLength={120}
          value={form.location_governorate || ""}
          onChange={(event) => update("location_governorate", event.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="admin-project-video">Video URL</Label>
        <Input
          id="admin-project-video"
          type="url"
          value={form.video_url || ""}
          onChange={(event) => update("video_url", event.target.value)}
          placeholder="https://"
        />
        <FieldError message={errors.video_url} />
      </div>
    </div>
  </div>
);

export default AdminProjectIdentityFields;
