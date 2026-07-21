import { FormEvent, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminDeleteDialog from "./AdminDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/services/api";
import adminProjectsService, {
  type AdminProjectDocument,
  type AdminProjectImage,
} from "@/services/adminProjectsService";

interface AdminProjectAssetsPanelProps {
  projectId: string;
  images: AdminProjectImage[];
  documents: AdminProjectDocument[];
}

interface AssetTarget {
  id: string;
  kind: "image" | "document";
  label: string;
}

const ImageCard = ({
  image,
  pending,
  onSave,
  onDelete,
}: {
  image: AdminProjectImage;
  pending: boolean;
  onSave: (image: AdminProjectImage, altText: string) => void;
  onDelete: (image: AdminProjectImage) => void;
}) => {
  const [altText, setAltText] = useState(image.alt_text || "");

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-video bg-muted">
        <img src={image.image} alt={image.alt_text || ""} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor={"image-alt-" + image.id}>Alt text</Label>
          <Input
            id={"image-alt-" + image.id}
            value={altText}
            maxLength={160}
            onChange={(event) => setAltText(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending || altText === image.alt_text}
            onClick={() => onSave(image, altText)}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 text-destructive"
            disabled={pending}
            onClick={() => onDelete(image)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete image</span>
          </Button>
        </div>
      </div>
    </article>
  );
};

const DocumentRow = ({
  document,
  pending,
  onSave,
  onDelete,
}: {
  document: AdminProjectDocument;
  pending: boolean;
  onSave: (document: AdminProjectDocument, title: string) => void;
  onDelete: (document: AdminProjectDocument) => void;
}) => {
  const [title, setTitle] = useState(document.title);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={"document-title-" + document.id}>Document title</Label>
          <Input
            id={"document-title-" + document.id}
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
          />
          <a
            href={document.file}
            target="_blank"
            rel="noreferrer"
            className="inline-block max-w-full truncate text-xs font-medium text-primary hover:underline"
          >
            Open current file
          </a>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !title.trim() || title === document.title}
          onClick={() => onSave(document, title.trim())}
        >
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 text-destructive"
          disabled={pending}
          onClick={() => onDelete(document)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete document</span>
        </Button>
      </div>
    </article>
  );
};

const AdminProjectAssetsPanel = ({
  projectId,
  images,
  documents,
}: AdminProjectAssetsPanelProps) => {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [deleting, setDeleting] = useState<AssetTarget | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "project", projectId] });

  const createImageMutation = useMutation({
    mutationFn: ({ file, alt }: { file: File; alt: string }) =>
      adminProjectsService.createImage(projectId, file, alt),
    onSuccess: () => {
      toast.success("Gallery image uploaded.");
      setImageFile(null);
      setImageAlt("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not upload this image.")),
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ image, alt }: { image: AdminProjectImage; alt: string }) =>
      adminProjectsService.updateImage(image.id, alt),
    onSuccess: () => {
      toast.success("Image details updated.");
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update this image.")),
  });

  const createDocumentMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      adminProjectsService.createDocument(projectId, file, title),
    onSuccess: () => {
      toast.success("Supporting document uploaded.");
      setDocumentFile(null);
      setDocumentTitle("");
      if (documentInputRef.current) documentInputRef.current.value = "";
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not upload this document.")),
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ document, title }: { document: AdminProjectDocument; title: string }) =>
      adminProjectsService.updateDocument(document.id, title),
    onSuccess: () => {
      toast.success("Document title updated.");
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update this document.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: AssetTarget) =>
      target.kind === "image"
        ? adminProjectsService.deleteImage(target.id)
        : adminProjectsService.deleteDocument(target.id),
    onSuccess: (_, target) => {
      toast.success(target.kind === "image" ? "Gallery image deleted." : "Document deleted.");
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete this file.")),
  });

  const submitImage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (imageFile) createImageMutation.mutate({ file: imageFile, alt: imageAlt.trim() });
  };

  const submitDocument = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (documentFile && documentTitle.trim()) {
      createDocumentMutation.mutate({ file: documentFile, title: documentTitle.trim() });
    }
  };

  const assetBusy =
    updateImageMutation.isPending ||
    updateDocumentMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gallery images</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, describe, and remove the additional imagery shown on the project.
          </p>
        </div>
        <form
          onSubmit={submitImage}
          className="grid gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="new-gallery-image">Image file</Label>
            <Input
              ref={imageInputRef}
              id="new-gallery-image"
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-gallery-alt">Alt text</Label>
            <Input
              id="new-gallery-alt"
              maxLength={160}
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Describe the image"
            />
          </div>
          <Button type="submit" disabled={!imageFile || createImageMutation.isPending}>
            <ImagePlus className="h-4 w-4" />
            {createImageMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </form>
        {images.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                pending={assetBusy}
                onSave={(target, alt) => updateImageMutation.mutate({ image: target, alt })}
                onDelete={(target) =>
                  setDeleting({ id: target.id, kind: "image", label: target.alt_text || "gallery image" })
                }
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            This project has no gallery images.
          </p>
        )}
      </section>

      <section className="space-y-5 border-t border-border pt-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Supporting documents</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage additional files beyond the primary business and ownership documents.
          </p>
        </div>
        <form
          onSubmit={submitDocument}
          className="grid gap-3 rounded-2xl border border-dashed border-secondary/30 bg-secondary/5 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="new-supporting-document">Document file</Label>
            <Input
              ref={documentInputRef}
              id="new-supporting-document"
              type="file"
              onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-document-title">Title</Label>
            <Input
              id="new-document-title"
              maxLength={120}
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder="Document title"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!documentFile || !documentTitle.trim() || createDocumentMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            {createDocumentMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </form>
        {documents.length ? (
          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                pending={assetBusy}
                onSave={(target, title) => updateDocumentMutation.mutate({ document: target, title })}
                onDelete={(target) =>
                  setDeleting({ id: target.id, kind: "document", label: target.title })
                }
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            This project has no supporting documents.
          </p>
        )}
      </section>

      <AdminDeleteDialog
        open={!!deleting}
        title={"Delete " + (deleting?.label || "this file") + "?"}
        description="The file will be permanently removed from this project. This cannot be undone."
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
};

export default AdminProjectAssetsPanel;
