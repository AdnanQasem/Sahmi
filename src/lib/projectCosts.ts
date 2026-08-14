import type { ProjectCostItem } from "@/services/projectsService";
import i18n from "@/i18n";

export const emptyProjectCostItem = (index = 0): ProjectCostItem => ({
  name: String(index + 1),
  description: "",
  quantity: "1",
  unit_cost: "",
});

export const reindexProjectCostItems = (items: ProjectCostItem[]) =>
  items.map((item, index) => ({ ...item, name: String(index + 1) }));

export const calculateCostItemTotal = (item: ProjectCostItem) => {
  const quantity = Number(item.quantity);
  const unitCost = Number(item.unit_cost);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) return 0;
  return quantity * unitCost;
};

export const calculateCostTableTotal = (items: ProjectCostItem[]) =>
  items.reduce((total, item) => total + calculateCostItemTotal(item), 0);

export const calculateCostItemFunding = (
  items: ProjectCostItem[],
  fundedAmount: number,
) => {
  let remainingFunding = Number.isFinite(fundedAmount) ? Math.max(fundedAmount, 0) : 0;

  return items.map((item) => {
    const itemTotal = Math.max(calculateCostItemTotal(item), 0);
    const funded = Math.min(remainingFunding, itemTotal);
    remainingFunding = Math.max(remainingFunding - itemTotal, 0);
    return funded;
  });
};

export const validateProjectCostTable = (
  items: ProjectCostItem[],
  goalAmount: string,
): string | null => {
  if (!items.length) return i18n.t("validation.costItemRequired");
  if (items.length > 50) return i18n.t("validation.costItemLimit");
  if (
    items.some(
      (item) =>
        !item.description.trim() ||
        !Number.isFinite(Number(item.quantity)) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        !Number.isFinite(Number(item.unit_cost)) ||
        Number(item.unit_cost) <= 0,
    )
  ) {
    return i18n.t("validation.costItemInvalid");
  }

  const goal = Number(goalAmount);
  const total = calculateCostTableTotal(items);
  if (Number.isFinite(goal) && goal > 0 && Math.abs(total - goal) > 0.005) {
    return i18n.t("validation.costTotalMismatch");
  }
  return null;
};
