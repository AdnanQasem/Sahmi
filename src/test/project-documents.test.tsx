import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectDocumentFields from "@/components/projects/ProjectDocumentFields";
import { validateProjectDocument, validateRequiredProjectDocuments } from "@/lib/projectDocuments";

describe("project supporting documents", () => {
  it("requires all three evidence documents and accepts PDF files", () => {
    const pdf = new File(["%PDF-1.7\nplan"], "plan.pdf", { type: "application/pdf" });
    expect(validateProjectDocument(pdf)).toBeNull();
    expect(validateRequiredProjectDocuments({
      business_plan: pdf,
      financial_projections: null,
      ownership_proof: null,
    })).toEqual({
      financial_projections: "This document is required.",
      ownership_proof: "This document is required.",
    });
  });

  it("rejects a file whose extension and MIME are not PDF", () => {
    const image = new File(["image"], "plan.png", { type: "image/png" });
    expect(validateProjectDocument(image)).toBe("Upload a PDF document.");
  });

  it("shows the three inputs, reports invalid selection, and preserves a current link", () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(
      <ProjectDocumentFields
        files={{}}
        current={{ business_plan: "/media/existing-plan.pdf" }}
        required
        onChange={onChange}
        onError={onError}
      />,
    );

    expect(screen.getAllByLabelText(/Business plan|Financial projections|Ownership or registration evidence/)).toHaveLength(3);
    expect(screen.getByRole("link", { name: /View current/i })).toHaveAttribute("href", "/media/existing-plan.pdf");
    const invalid = new File(["not pdf"], "forecast.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText(/Financial projections/), { target: { files: [invalid] } });
    expect(onError).toHaveBeenCalledWith("financial_projections", "Upload a PDF document.");
    expect(onChange).toHaveBeenCalledWith("financial_projections", null);
  });
});
