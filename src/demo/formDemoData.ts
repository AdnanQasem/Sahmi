export const formDemoData = {
  release: {
    evidence: "Supplier quotation, approved milestone budget, and delivery timeline are attached for administrative review.",
    expenses: "Purchase the approved milestone materials, pay installation labor, and cover documented local delivery costs.",
  },
  withdrawalReview: "The submitted evidence and requested amount match the approved milestone scope and available allocation.",
  completionSummary: "All approved milestone deliverables were completed, inspected, and documented in the attached evidence.",
  completionRevision: "Please add dated completion photographs and a clearer supplier receipt before resubmitting this milestone.",
  handover: "Final deliverables, released funds, supporting evidence, and the project handover checklist were reviewed and accepted.",
  category: {
    name: "Community Services",
    description: "Projects that provide practical services and measurable benefits to local communities.",
  },
  milestone: {
    title: "Equipment installation and launch",
    description: "Purchase, install, test, and commission the approved equipment required to begin operations.",
    deliverables: "Installed equipment, supplier invoices, testing report, staff handover, and launch photographs.",
  },
  investment: {
    amount: "500.00",
    transactionId: "DEMO-INVESTMENT-REFERENCE",
    notes: "Demonstration investment record for reviewing the administrative workflow.",
  },
  repayment: {
    amount: "100.00",
    notes: "Scheduled internal repayment record created for workflow demonstration.",
    paidNotes: "External payment evidence reviewed; this entry records the settlement internally only.",
  },
  review: "The submitted information was reviewed against the project requirements and supporting documents.",
  contact: {
    name: "Demo User",
    email: "demo.user@example.com",
    subject: "Question about the Sahmi project workflow",
    message: "I would like more information about project review, milestone releases, and repayment record visibility.",
  },
  message: "Hello, I am following up about the current project milestone and the supporting information required for the next step.",
  profile: {
    fullName: "Demo User",
    phone: "+970599123456",
    city: "Ramallah",
    country: "Palestine",
    website: "https://example.com",
    bio: "Community-focused project participant using Sahmi to coordinate transparent funding and implementation workflows.",
    businessName: "Demo Community Enterprise",
    registrationNumber: "DEMO-REG-2026",
    businessAddress: "Main Street, Ramallah, Palestine",
  },
  imageAlt: "Project team reviewing completed work at the implementation site",
  documentTitle: "Project implementation evidence",
} as const;

export const createDemoRepaymentReference = () => {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 17);
  const random = globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 8)
    ?? Math.random().toString(36).slice(2, 10);
  return `DEMO-REPAY-${timestamp}-${random.toUpperCase()}`;
};
