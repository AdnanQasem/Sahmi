import type { ProjectDemoPreset } from "./projectDemoPresets";

const projectImageMatches: Array<[string, string[]]> = [
  ["olive-press", ["olive press", "olive cooperative"]],
  ["rooftop-solar", ["solar"]],
  ["farm-irrigation", ["irrigation"]],
  ["women-kitchen", ["production kitchen", "community kitchen"]],
  ["mobile-clinic", ["mobile primary care", "mobile clinic"]],
  ["coding-academy", ["coding", "digital skills academy"]],
  ["recycling-workshop", ["recycling"]],
  ["artisan-market", ["artisan"]],
  ["cold-storage", ["cold storage"]],
  ["bakery", ["bakery"]],
  ["beekeeping", ["beekeeping", "apiary"]],
  ["telehealth", ["telehealth"]],
  ["school-labs", ["science lab"]],
  ["soap-studio", ["soap"]],
  ["eco-guesthouse", ["guesthouse", "cultural tours"]],
  ["dairy", ["dairy"]],
  ["delivery", ["delivery fleet", "electric delivery"]],
  ["seed-bank", ["seed bank", "nursery"]],
  ["furniture", ["furniture"]],
  ["learning-center", ["learning center", "learning and support"]],
  ["hydroponics", ["hydroponic"]],
  ["embroidery", ["embroidery"]],
  ["repair-lab", ["repair", "refurbishment"]],
];

const ascii = (value: unknown) => String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
const pdfEscape = (value: string) => ascii(value).replace(/([\\()])/g, "\\$1");

const wrap = (value: string, width = 82) => {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });
  if (line) lines.push(line);
  return lines;
};

export const createDemoPdf = (filename: string, title: string, sections: Array<[string, string | string[]]>) => {
  const textLines = [title.toUpperCase(), "DEMO / SAMPLE - NOT AN OFFICIAL DOCUMENT", ""];
  sections.forEach(([heading, content]) => {
    textLines.push(heading.toUpperCase());
    const values = Array.isArray(content) ? content : [content];
    values.forEach((value) => textLines.push(...wrap(value)));
    textLines.push("");
  });
  const visibleLines = textLines.slice(0, 47);
  const commands = visibleLines.map((line, index) => {
    const size = index === 0 ? 16 : index === 1 ? 11 : 10;
    const y = 752 - index * 15;
    return `BT /F1 ${size} Tf 58 ${y} Td (${pdfEscape(line)}) Tj ET`;
  }).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([pdf], filename, { type: "application/pdf", lastModified: Date.now() });
};

const publicFile = async (path: string, filename: string) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load demo file: ${path}`);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg", lastModified: Date.now() });
};

const assetIdForProjectTitle = (title?: string | null) => {
  const normalized = (title || "").toLowerCase();
  return projectImageMatches.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0]
    ?? "beekeeping";
};

export const presetForProjectTitle = (title: string | null | undefined, presets: ProjectDemoPreset[]) => {
  const normalized = (title || "").toLowerCase();
  const match = normalized ? presets.find((preset) =>
    normalized.includes(preset.title.toLowerCase()) ||
    preset.title.toLowerCase().includes(normalized) ||
    normalized.includes(preset.id.replace(/-/g, " ")),
  ) : undefined;
  return match ?? presets.find((preset) => preset.id === assetIdForProjectTitle(title)) ?? presets[0]!;
};

export const loadDemoProjectImage = (projectTitle?: string | null, suffix = "evidence") => {
  const assetId = assetIdForProjectTitle(projectTitle);
  return publicFile(`/demo-assets/projects/${assetId}.jpg`, `${assetId}-${suffix}.jpg`);
};

export const createProjectDemoDocuments = (preset: ProjectDemoPreset) => {
  const fee = (preset.goal * 0.03).toFixed(2);
  const businessPlan = createDemoPdf(`${preset.id}-business-plan.pdf`, `${preset.title} Business Plan`, [
    ["Project", [`Location: ${preset.location}, ${preset.governorate}`, `Sector: ${preset.sector}`, `Funding goal: ${preset.goal.toFixed(2)} ILS`, preset.summary]],
    ["Implementation", ["Phase 1: procurement and preparation.", "Phase 2: installation and team training.", "Phase 3: launch and performance review."]],
    ["Governance", "Spending follows the approved cost table, dated milestones, supporting evidence, and administrator review."],
  ]);
  const financialProjections = createDemoPdf(`${preset.id}-financial-projections.pdf`, `${preset.title} Financial Projections`, [
    ["Funding", [`Project investment goal: ${preset.goal.toFixed(2)} ILS`, `Sahmi repayment fee (3%): ${fee} ILS`, `Minimum investment: 100.00 ILS`, "Expected investor return: 8%"]],
    ["Use of funds", [
      `Equipment and installation: ${(preset.goal * 0.45).toFixed(2)} ILS`,
      `Materials and operating setup: ${(preset.goal * 0.35).toFixed(2)} ILS`,
      `Training, launch, and contingency: ${(preset.goal * 0.20).toFixed(2)} ILS`,
    ]],
    ["Projection assumptions", "The demo assumes phased purchasing, a 45-day funding period, controlled operating costs, and monthly performance reviews."],
  ]);
  const ownershipProof = createDemoPdf(`${preset.id}-ownership-proof.pdf`, `${preset.title} Ownership Evidence`, [
    ["Entity", [`Demo cooperative or enterprise for ${preset.title}`, `Operating location: ${preset.location}, ${preset.governorate}`]],
    ["Declaration", "This fictional sample is supplied only to exercise the Sahmi document-upload and review workflow. It does not prove registration or ownership."],
  ]);
  return { businessPlan, financialProjections, ownershipProof };
};

export const loadProjectDemoFiles = async (preset: ProjectDemoPreset) => {
  const documents = createProjectDemoDocuments(preset);
  const coverImage = await publicFile(`/demo-assets/projects/${preset.id}.jpg`, `${preset.id}-cover.jpg`);
  return { coverImage, ...documents };
};

export const createRepaymentReceiptDemo = ({
  projectTitle,
  amount,
  reference,
  transferDate,
}: {
  projectTitle: string;
  amount: string | number;
  reference: string;
  transferDate: string;
}) => createDemoPdf("demo-repayment-receipt.pdf", "Repayment Transfer Receipt", [
  ["Transfer", [`Project: ${projectTitle}`, `Amount: ${Number(amount).toFixed(2)} ILS`, `Reference: ${reference}`, `Transfer date: ${transferDate}`]],
  ["Notice", "This receipt is fictional demo data for testing Sahmi's inbound repayment reconciliation. It is not proof of a real bank transfer."],
]);

export const createSupportingDocumentDemo = (projectTitle = "Sahmi Demo Project") => createDemoPdf(
  "demo-project-evidence.pdf",
  `${projectTitle} Supporting Evidence`,
  [
    ["Evidence", "Supplier quotation, approved milestone budget, equipment list, delivery timeline, and implementation photographs are included for demo review."],
    ["Notice", "This is fictional demo data and must not be treated as a real supplier invoice, contract, or payment record."],
  ],
);
