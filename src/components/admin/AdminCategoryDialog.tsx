import { FormEvent, useEffect, useState } from "react";
import { FolderPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectCategory, ProjectCategoryPayload } from "@/services/projectsService";

interface AdminCategoryDialogProps {
  open: boolean;
  category: ProjectCategory | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ProjectCategoryPayload) => void;
  isPending: boolean;
}

const AdminCategoryDialog = ({
  open,
  category,
  onOpenChange,
  onSubmit,
  isPending,
}: AdminCategoryDialogProps) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name || "");
    setSlug(category?.slug || "");
    setDescription(category?.description || "");
  }, [category, open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onSubmit({
      name: cleanName,
      slug: slug.trim() || undefined,
      description: description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderPlus className="h-5 w-5" />
          </div>
          <DialogTitle>{category ? "Edit category" : "Add a category"}</DialogTitle>
          <DialogDescription>
            Categories keep project discovery organized and make the admin filters more useful.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sustainable Agriculture"
              maxLength={80}
              autoFocus
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short explanation shown wherever this category is used."
              rows={4}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-slug">URL slug</Label>
            <Input
              id="category-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Generated from the name when blank"
              maxLength={100}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : category ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCategoryDialog;
