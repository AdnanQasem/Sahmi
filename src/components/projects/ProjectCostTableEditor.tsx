import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/i18n/format";
import {
  calculateCostItemTotal,
  calculateCostTableTotal,
  emptyProjectCostItem,
  reindexProjectCostItems,
} from "@/lib/projectCosts";
import type { ProjectCostItem } from "@/services/projectsService";

interface ProjectCostTableEditorProps {
  items: ProjectCostItem[];
  goalAmount: string;
  onChange: (items: ProjectCostItem[]) => void;
  error?: string;
}

const ProjectCostTableEditor = ({
  items,
  goalAmount,
  onChange,
  error,
}: ProjectCostTableEditorProps) => {
  const { t } = useTranslation();
  const total = calculateCostTableTotal(items);
  const goal = Number(goalAmount);
  const totalsMatch = Number.isFinite(goal) && goal > 0 && Math.abs(total - goal) <= 0.005;

  const updateItem = (
    index: number,
    field: keyof ProjectCostItem,
    value: string,
  ) => {
    onChange(
      reindexProjectCostItems(items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      )),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("projects.costTable")}</h3>
          <p className="text-xs text-muted-foreground">{t("projects.costTableHelp")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={items.length >= 50}
          onClick={() => onChange([...items, emptyProjectCostItem(items.length)])}
        >
          <Plus className="h-4 w-4" />
          {t("projects.addCostItem")}
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t("projects.costItemNumber")}</TableHead>
              <TableHead>{t("projects.costDescription")}</TableHead>
              <TableHead className="w-24">{t("projects.quantity")}</TableHead>
              <TableHead className="w-36">{t("projects.unitCost")}</TableHead>
              <TableHead className="w-36 text-end">{t("projects.lineTotal")}</TableHead>
              <TableHead className="w-14"><span className="sr-only">{t("common.actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell
                  className="font-medium"
                  aria-label={`${t("projects.costItem")} ${index + 1}`}
                >
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`${t("projects.costDescription")} ${index + 1}`}
                    maxLength={500}
                    value={item.description}
                    onChange={(event) => updateItem(index, "description", event.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`${t("projects.quantity")} ${index + 1}`}
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, "quantity", event.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`${t("projects.unitCost")} ${index + 1}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(event) => updateItem(index, "unit_cost", event.target.value)}
                  />
                </TableCell>
                <TableCell className="text-end font-medium">
                  {formatCurrency(calculateCostItemTotal(item))}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("projects.removeCostItem")} ${index + 1}`}
                    disabled={items.length === 1}
                    onClick={() => onChange(reindexProjectCostItems(items.filter((_, itemIndex) => itemIndex !== index)))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-end">{t("projects.costTotal")}</TableCell>
              <TableCell className="text-end">{formatCurrency(total)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {goalAmount ? (
        <p className={`text-xs ${totalsMatch ? "text-success" : "text-destructive"}`}>
          {totalsMatch
            ? t("projects.costTotalMatches")
            : t("projects.costTotalMismatch", {
                total: formatCurrency(total),
                goal: formatCurrency(goalAmount),
              })}
        </p>
      ) : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
};

export default ProjectCostTableEditor;
