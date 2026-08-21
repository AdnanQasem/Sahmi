import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminDeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  pending?: boolean;
  actionLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const AdminDeleteDialog = ({
  open,
  title,
  description,
  pending = false,
  actionLabel,
  onOpenChange,
  onConfirm,
}: AdminDeleteDialogProps) => {
  const { t } = useTranslation();
  const resolvedActionLabel = actionLabel ?? t("common.delete");
  return (
  <AlertDialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
    <AlertDialogContent className="rounded-2xl">
      <AlertDialogHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Trash2 className="h-5 w-5" />
        </div>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? t("common.deleting") : resolvedActionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  );
};

export default AdminDeleteDialog;
