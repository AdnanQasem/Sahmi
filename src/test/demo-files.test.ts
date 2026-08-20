import { describe, expect, it, vi } from "vitest";
import { createRepaymentReceiptDemo, loadProjectDemoFiles } from "@/demo/demoFiles";
import { projectDemoPresets } from "@/demo/projectDemoPresets";

const readFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});

describe("demo upload files", () => {
  it("creates a repayment receipt that matches the selected repayment", async () => {
    const receipt = createRepaymentReceiptDemo({
      projectTitle: "Highland Beekeeping Cooperative",
      amount: "570.00",
      reference: "DEMO-REPAY-123",
      transferDate: "2026-08-20",
    });

    expect(receipt.name).toBe("demo-repayment-receipt.pdf");
    expect(receipt.type).toBe("application/pdf");
    const content = await readFile(receipt);
    expect(content).toContain("Highland Beekeeping Cooperative");
    expect(content).toContain("570.00 ILS");
    expect(content).toContain("DEMO / SAMPLE - NOT AN OFFICIAL DOCUMENT");
  });

  it("loads the matched project cover and creates all required project PDFs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["image"], { type: "image/jpeg" })),
    }));
    const preset = projectDemoPresets.find((item) => item.id === "beekeeping")!;

    const files = await loadProjectDemoFiles(preset);

    expect(fetch).toHaveBeenCalledWith("/demo-assets/projects/beekeeping.jpg");
    expect(files.coverImage.name).toBe("beekeeping-cover.jpg");
    expect(files.businessPlan.name).toBe("beekeeping-business-plan.pdf");
    expect(files.financialProjections.name).toBe("beekeeping-financial-projections.pdf");
    expect(files.ownershipProof.name).toBe("beekeeping-ownership-proof.pdf");
    expect(await readFile(files.financialProjections)).toContain("570.00 ILS");
    vi.unstubAllGlobals();
  });
});
