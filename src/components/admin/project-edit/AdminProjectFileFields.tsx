import { useTranslation } from "react-i18next";
import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminProjectFilesProps } from "./AdminProjectFormTypes";

type FileField = "business_plan" | "financial_projections" | "ownership_proof" | "cover_image";
type ClearField =
  | "clear_business_plan"
  | "clear_financial_projections"
  | "clear_ownership_proof"
  | "clear_cover_image";

interface FileControlProps {
  id: string;
  label: string;
  currentUrl?: string | null;
  file?: File;
  clear: boolean;
  accept?: string;
  onFile: (file?: File) => void;
  onClear: (clear: boolean) => void;
}

const FileControl = ({
  id,
  label,
  currentUrl,
  file,
  clear,
  accept,
  onFile,
  onClear,
}: FileControlProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor={id}>{label}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {file
              ? t("adminForm.replacementSelected", { name: file.name })
              : currentUrl
                ? t("adminForm.fileAttached")
                : t("adminForm.noFileAttached")}
          </p>
        </div>
        {currentUrl && !clear ? (
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-semibold text-primary hover:underline"
          >
            {t("adminForm.openCurrent")}
          </a>
        ) : null}
      </div>
      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {currentUrl ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id + "-clear"}
            checked={clear}
            onCheckedChange={(checked) => {
              const shouldClear = checked === true;
              if (shouldClear) {
                onFile(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }
              onClear(shouldClear);
            }}
          />
          <Label htmlFor={id + "-clear"} className="text-xs font-normal text-muted-foreground">
            {t("adminForm.removeCurrent")}
          </Label>
        </div>
      ) : null}
    </div>
  );
};

const AdminProjectFileFields = ({ form, update, project }: AdminProjectFilesProps) => {
  const { t } = useTranslation();
  const setFile = (fileKey: FileField, clearKey: ClearField, file?: File) => {
    update(fileKey, file);
    if (file) update(clearKey, false);
  };

  const files: Array<{
    id: string;
    label: string;
    fileKey: FileField;
    clearKey: ClearField;
    currentUrl?: string | null;
    accept?: string;
  }> = [
    {
      id: "admin-project-cover",
      label: t("adminForm.coverImage"),
      fileKey: "cover_image",
      clearKey: "clear_cover_image",
      currentUrl: project?.cover_image,
      accept: "image/*",
    },
    {
      id: "admin-project-business-plan",
      label: t("adminForm.businessPlan"),
      fileKey: "business_plan",
      clearKey: "clear_business_plan",
      currentUrl: project?.business_plan,
    },
    {
      id: "admin-project-financial-projections",
      label: t("adminForm.financialProjections"),
      fileKey: "financial_projections",
      clearKey: "clear_financial_projections",
      currentUrl: project?.financial_projections,
    },
    {
      id: "admin-project-ownership-proof",
      label: t("adminForm.ownershipProof"),
      fileKey: "ownership_proof",
      clearKey: "clear_ownership_proof",
      currentUrl: project?.ownership_proof,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("adminForm.primaryFiles")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("adminForm.filesHelp")}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {files.map((item) => (
          <FileControl
            key={item.fileKey}
            id={item.id}
            label={item.label}
            currentUrl={item.currentUrl}
            file={form[item.fileKey] as File | undefined}
            clear={Boolean(form[item.clearKey])}
            accept={item.accept}
            onFile={(file) => setFile(item.fileKey, item.clearKey, file)}
            onClear={(clear) => update(item.clearKey, clear)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminProjectFileFields;
