import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import ProjectCostTable from "@/components/projects/ProjectCostTable";
import ProjectCostTableEditor from "@/components/projects/ProjectCostTableEditor";
import {
  calculateCostTableTotal,
  emptyProjectCostItem,
  validateProjectCostTable,
} from "@/lib/projectCosts";
import type { ProjectCostItem } from "@/services/projectsService";

const validItems: ProjectCostItem[] = [
  { name: "Equipment", description: "Machinery", quantity: "2", unit_cost: "4000" },
  { name: "Materials", description: "Inventory", quantity: "1", unit_cost: "2000" },
];

describe("project cost table rules", () => {
  it("calculates the complete project cost and accepts a matching goal", () => {
    expect(calculateCostTableTotal(validItems)).toBe(10000);
    expect(validateProjectCostTable(validItems, "10000")).toBeNull();
  });

  it("rejects empty, zero-value, mismatched, and oversized tables", () => {
    expect(validateProjectCostTable([], "10000")).toMatch(/at least one/i);
    expect(
      validateProjectCostTable(
        [{ name: "Equipment", description: "", quantity: "0", unit_cost: "10000" }],
        "10000",
      ),
    ).toMatch(/whole-number quantity/i);
    expect(
      validateProjectCostTable(
        [{ name: "1", description: "Equipment", quantity: "1.5", unit_cost: "10000" }],
        "15000",
      ),
    ).toMatch(/whole-number quantity/i);
    expect(validateProjectCostTable(validItems, "9999")).toMatch(/must equal/i);
    expect(
      validateProjectCostTable(
        Array.from({ length: 51 }, (_, index) => ({
          name: `Item ${index}`,
          description: "",
          quantity: "1",
          unit_cost: "1",
        })),
        "51",
      ),
    ).toMatch(/at most 50/i);
  });

  it("renders the published rows and calculated total", () => {
    render(<ProjectCostTable items={validItems} />);

    expect(screen.getByText("Machinery")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
  });

  it("lets the owner add and edit rows without removing the final row", () => {
    const Harness = () => {
      const [items, setItems] = useState<ProjectCostItem[]>([emptyProjectCostItem()]);
      return (
        <ProjectCostTableEditor
          items={items}
          goalAmount="100"
          onChange={setItems}
        />
      );
    };
    render(<Harness />);

    const firstRemove = screen.getByRole("button", { name: /remove cost item 1/i });
    expect(firstRemove).toBeDisabled();
    expect(screen.getByRole("cell", { name: /cost item 1/i })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /cost description 1/i }), {
      target: { value: "Licensing" },
    });
    expect(screen.getByRole("spinbutton", { name: /quantity 1/i })).toHaveAttribute("step", "1");
    fireEvent.change(screen.getByRole("spinbutton", { name: /unit cost 1/i }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add cost item/i }));

    expect(screen.getByRole("textbox", { name: /cost description 2/i })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /cost item 2/i })).toBeInTheDocument();
    expect(firstRemove).not.toBeDisabled();
  });
});
