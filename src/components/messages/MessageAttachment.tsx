import { useEffect, useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import messagingService, { type Message } from "@/services/messagingService";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Attachment = NonNullable<Message["attachment"]>;

const readableSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const MessageAttachment = ({ messageId, attachment }: { messageId: string; attachment: Attachment }) => {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(attachment.is_image);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!attachment.is_image) return;
    let active = true;
    let objectUrl = "";
    setLoadingImage(true);
    messagingService.downloadAttachment(messageId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
    }).catch(() => {
      if (active) setImageUrl(null);
    }).finally(() => {
      if (active) setLoadingImage(false);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.is_image, messageId]);

  const download = async () => {
    setDownloading(true);
    try {
      saveBlob(await messagingService.downloadAttachment(messageId), attachment.name);
    } catch {
      toast.error(t("messages.attachmentDownloadError"));
    } finally {
      setDownloading(false);
    }
  };

  return <div className="mt-2 overflow-hidden rounded-xl border border-current/15 bg-background/90 text-foreground">
    {attachment.is_image && <div className="flex min-h-32 items-center justify-center bg-muted/30">
      {loadingImage ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      : imageUrl ? <a href={imageUrl} target="_blank" rel="noreferrer" aria-label={t("messages.openImage")}><img src={imageUrl} alt={attachment.name} className="max-h-72 w-full object-contain" /></a>
      : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
    </div>}
    <div className="flex items-center gap-3 p-3">
      {attachment.is_image ? <ImageIcon className="h-5 w-5 shrink-0" /> : <FileText className="h-5 w-5 shrink-0" />}
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" dir="auto">{attachment.name}</p><p className="text-[10px] text-muted-foreground">{readableSize(attachment.size)}</p></div>
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={downloading} onClick={download} aria-label={t("messages.downloadAttachment")}>
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    </div>
  </div>;
};

export default MessageAttachment;
