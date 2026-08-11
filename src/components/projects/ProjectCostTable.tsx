import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/i18n/format";
import { calculateCostItemTotal, calculateCostTableTotal } from "@/lib/projectCosts";
import type { ProjectCostItem } from "@/services/projectsService";

const ProjectCostTable = ({ items }: { items: ProjectCostItem[] }) => {
  const { t } = useTranslation();
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{t("projects.noCostItems")}</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t("projects.costItemNumber")}</TableHead>
            <TableHead>{t("projects.costDescription")}</TableHead>
            <TableHead className="text-end">{t("projects.quantity")}</TableHead>
            <TableHead className="text-end">{t("projects.unitCost")}</TableHead>
            <TableHead className="text-end">{t("projects.lineTotal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.name}-${index}`}>
              <TableCell
                className="font-medium"
                aria-label={`${t("projects.costItem")} ${index + 1}`}
              >
                {index + 1}
              </TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-end">{formatNumber(item.quantity)}</TableCell>
              <TableCell className="text-end">{formatCurrency(item.unit_cost)}</TableCell>
              <TableCell className="text-end font-medium">{formatCurrency(calculateCostItemTotal(item))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-end">{t("projects.costTotal")}</TableCell>
            <TableCell className="text-end">{formatCurrency(calculateCostTableTotal(items))}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ProjectCostTable;
