import type { ProjectCostItem } from "@/services/projectsService";

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

export const validateProjectCostTable = (
  items: ProjectCostItem[],
  goalAmount: string,
): string | null => {
  if (!items.length) return "Add at least one project cost item.";
  if (items.length > 50) return "A project cost table may contain at most 50 items.";
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
    return "Every cost item needs a description, whole-number quantity, and positive unit cost.";
  }

  const goal = Number(goalAmount);
  const total = calculateCostTableTotal(items);
  if (Number.isFinite(goal) && goal > 0 && Math.abs(total - goal) > 0.005) {
    return "The cost table total must equal the funding goal.";
  }
  return null;
};
