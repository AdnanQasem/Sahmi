import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [altText, setAltText] = useState(image.alt_text || "");

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-video bg-muted">
        <img src={image.image} alt={image.alt_text || ""} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor={"image-alt-" + image.id}>{t("adminForm.altText")}</Label>
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
            <Save className="h-3.5 w-3.5" /> {t("adminForm.save")}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 text-destructive"
            disabled={pending}
            onClick={() => onDelete(image)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t("adminForm.deleteImage")}</span>
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
  const { t } = useTranslation();
  const [title, setTitle] = useState(document.title);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={"document-title-" + document.id}>{t("adminForm.documentTitle")}</Label>
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
            {t("adminForm.openCurrentFile")}
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
          <Save className="h-3.5 w-3.5" /> {t("adminForm.save")}
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 text-destructive"
          disabled={pending}
          onClick={() => onDelete(document)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{t("adminForm.deleteDocument")}</span>
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
  const { t } = useTranslation();
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
      toast.success(t("adminForm.uploadImageSuccess"));
      setImageFile(null);
      setImageAlt("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("adminForm.uploadImageFailed"))),
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ image, alt }: { image: AdminProjectImage; alt: string }) =>
      adminProjectsService.updateImage(image.id, alt),
    onSuccess: () => {
      toast.success(t("adminForm.updateImageSuccess"));
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("adminForm.updateImageFailed"))),
  });

  const createDocumentMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      adminProjectsService.createDocument(projectId, file, title),
    onSuccess: () => {
      toast.success(t("adminForm.uploadDocumentSuccess"));
      setDocumentFile(null);
      setDocumentTitle("");
      if (documentInputRef.current) documentInputRef.current.value = "";
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("adminForm.uploadDocumentFailed"))),
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ document, title }: { document: AdminProjectDocument; title: string }) =>
      adminProjectsService.updateDocument(document.id, title),
    onSuccess: () => {
      toast.success(t("adminForm.updateDocumentSuccess"));
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("adminForm.updateDocumentFailed"))),
  });

  const deleteMutation = useMutation({
    mutationFn: (target: AssetTarget) =>
      target.kind === "image"
        ? adminProjectsService.deleteImage(target.id)
        : adminProjectsService.deleteDocument(target.id),
    onSuccess: (_, target) => {
      toast.success(t(target.kind === "image" ? "adminForm.deleteImageSuccess" : "adminForm.deleteDocumentSuccess"));
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("adminForm.deleteFileFailed"))),
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
          <h3 className="text-lg font-semibold text-foreground">{t("adminForm.galleryImages")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adminForm.galleryHelp")}
          </p>
        </div>
        <form
          onSubmit={submitImage}
          className="grid gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="new-gallery-image">{t("adminForm.imageFile")}</Label>
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
            <Label htmlFor="new-gallery-alt">{t("adminForm.altText")}</Label>
            <Input
              id="new-gallery-alt"
              maxLength={160}
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder={t("adminForm.describeImage")}
            />
          </div>
          <Button type="submit" disabled={!imageFile || createImageMutation.isPending}>
            <ImagePlus className="h-4 w-4" />
            {createImageMutation.isPending ? t("adminForm.uploading") : t("adminForm.upload")}
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
                  setDeleting({ id: target.id, kind: "image", label: target.alt_text || t("adminForm.galleryImage") })
                }
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            {t("adminForm.noGallery")}
          </p>
        )}
      </section>

      <section className="space-y-5 border-t border-border pt-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("adminForm.supportingDocuments")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adminForm.documentsHelp")}
          </p>
        </div>
        <form
          onSubmit={submitDocument}
          className="grid gap-3 rounded-2xl border border-dashed border-secondary/30 bg-secondary/5 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="new-supporting-document">{t("adminForm.documentFile")}</Label>
            <Input
              ref={documentInputRef}
              id="new-supporting-document"
              type="file"
              onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-document-title">{t("adminForm.title")}</Label>
            <Input
              id="new-document-title"
              maxLength={120}
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder={t("adminForm.documentTitle")}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!documentFile || !documentTitle.trim() || createDocumentMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            {createDocumentMutation.isPending ? t("adminForm.uploading") : t("adminForm.upload")}
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
            {t("adminForm.noDocuments")}
          </p>
        )}
      </section>

      <AdminDeleteDialog
        open={!!deleting}
        title={t("adminForm.deleteFileTitle", { name: deleting?.label || t("adminForm.thisFile") })}
        description={t("adminForm.deleteFileText")}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
};

export default AdminProjectAssetsPanel;
