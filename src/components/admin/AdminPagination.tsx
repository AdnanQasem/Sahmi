import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/i18n/format";

interface AdminPaginationProps {
  page: number;
  count: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const AdminPagination = ({ page, count, pageSize, onPageChange }: AdminPaginationProps) => {
  const { t } = useTranslation();
  const totalPages = Math.max(Math.ceil(count / pageSize), 1);
  const first = count ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        {t("common.paginationSummary", { first: formatNumber(first), last: formatNumber(last), count: formatNumber(count) })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 rtl-flip" />
          {t("common.previous")}
        </Button>
        <span className="min-w-20 text-center font-medium text-foreground">
          {formatNumber(page)} / {formatNumber(totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          {t("common.next")}
          <ChevronRight className="h-4 w-4 rtl-flip" />
        </Button>
      </div>
    </div>
  );
};

export default AdminPagination;
