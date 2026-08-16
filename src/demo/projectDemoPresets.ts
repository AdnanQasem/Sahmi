import type { ProjectCategory, ProjectCreatePayload } from "@/services/projectsService";

interface ProjectDemoSeed {
  id: string;
  label: string;
  title: string;
  sector: string;
  categoryHints: string[];
  location: string;
  governorate: string;
  goal: number;
  summary: string;
}

export interface ProjectDemoPreset extends ProjectDemoSeed {}

export const projectDemoPresets: ProjectDemoPreset[] = [
  { id: "olive-press", label: "Community Olive Press", title: "Modern Community Olive Press", sector: "agriculture", categoryHints: ["agri", "food"], location: "Salfit", governorate: "Salfit", goal: 48000, summary: "A shared modern olive press helping local growers improve oil quality and reduce processing costs." },
  { id: "rooftop-solar", label: "Rooftop Solar Cooperative", title: "Rooftop Solar Cooperative", sector: "renewable energy", categoryHints: ["energy", "environment"], location: "Ramallah", governorate: "Ramallah and Al-Bireh", goal: 62000, summary: "A cooperative solar installation providing reliable, lower-cost electricity to neighborhood workshops." },
  { id: "farm-irrigation", label: "Smart Farm Irrigation", title: "Water-Saving Smart Irrigation Network", sector: "agriculture", categoryHints: ["agri", "environment"], location: "Jenin", governorate: "Jenin", goal: 36000, summary: "Sensor-guided irrigation that helps small farms conserve water while increasing crop consistency." },
  { id: "women-kitchen", label: "Women-Led Production Kitchen", title: "Women-Led Community Production Kitchen", sector: "food production", categoryHints: ["food", "women", "social"], location: "Nablus", governorate: "Nablus", goal: 27000, summary: "A certified shared kitchen producing traditional foods and creating sustainable work for local women." },
  { id: "mobile-clinic", label: "Mobile Primary Care Clinic", title: "Mobile Primary Care Clinic", sector: "healthcare", categoryHints: ["health"], location: "Hebron", governorate: "Hebron", goal: 55000, summary: "A mobile clinic delivering scheduled screenings and primary care to underserved rural communities." },
  { id: "coding-academy", label: "Youth Coding Academy", title: "Youth Coding and Digital Skills Academy", sector: "education technology", categoryHints: ["education", "tech"], location: "Gaza City", governorate: "Gaza", goal: 32000, summary: "Practical software and digital-work training connecting young people with remote employment pathways." },
  { id: "recycling-workshop", label: "Plastic Recycling Workshop", title: "Neighborhood Plastic Recycling Workshop", sector: "recycling", categoryHints: ["environment", "manufactur"], location: "Tulkarm", governorate: "Tulkarm", goal: 41000, summary: "A small processing workshop turning collected plastic into durable products for local businesses." },
  { id: "artisan-market", label: "Artisan Digital Marketplace", title: "Digital Marketplace for Palestinian Artisans", sector: "technology and crafts", categoryHints: ["tech", "craft", "retail"], location: "Bethlehem", governorate: "Bethlehem", goal: 24000, summary: "An online sales and fulfillment platform helping independent artisans reach regional customers." },
  { id: "cold-storage", label: "Farm Cold Storage Hub", title: "Cooperative Farm Cold Storage Hub", sector: "agriculture logistics", categoryHints: ["agri", "logistics"], location: "Qalqilya", governorate: "Qalqilya", goal: 68000, summary: "Shared cold storage that reduces produce losses and gives farmers more control over selling times." },
  { id: "bakery", label: "Whole-Grain Neighborhood Bakery", title: "Whole-Grain Neighborhood Bakery", sector: "food production", categoryHints: ["food"], location: "Al-Bireh", governorate: "Ramallah and Al-Bireh", goal: 21000, summary: "A local bakery producing affordable whole-grain bread with ingredients sourced from nearby growers." },
  { id: "beekeeping", label: "Beekeeping Cooperative", title: "Highland Beekeeping Cooperative", sector: "agriculture", categoryHints: ["agri", "food"], location: "Tubas", governorate: "Tubas", goal: 19000, summary: "A cooperative apiary expanding honey production, pollination services, and beekeeper training." },
  { id: "telehealth", label: "Telehealth Access Platform", title: "Community Telehealth Access Platform", sector: "health technology", categoryHints: ["health", "tech"], location: "Jericho", governorate: "Jericho and Al Aghwar", goal: 44000, summary: "Secure appointment and consultation access connecting patients with qualified remote clinicians." },
  { id: "school-labs", label: "School Science Labs", title: "Hands-On Science Labs for Local Schools", sector: "education", categoryHints: ["education"], location: "Jenin", governorate: "Jenin", goal: 29000, summary: "Mobile laboratory kits and teacher training that make practical science accessible to more students." },
  { id: "soap-studio", label: "Natural Soap Studio", title: "Natural Nabulsi Soap Production Studio", sector: "manufacturing and crafts", categoryHints: ["manufactur", "craft"], location: "Nablus", governorate: "Nablus", goal: 26000, summary: "A quality-controlled studio preserving traditional soapmaking while developing modern retail products." },
  { id: "eco-guesthouse", label: "Village Eco Guesthouse", title: "Village Eco Guesthouse and Cultural Tours", sector: "tourism", categoryHints: ["tour", "hospitality"], location: "Battir", governorate: "Bethlehem", goal: 52000, summary: "A community guesthouse offering responsible stays, local meals, and guided cultural experiences." },
  { id: "dairy", label: "Small Dairy Processing Unit", title: "Small Dairy Processing and Packaging Unit", sector: "food production", categoryHints: ["food", "agri"], location: "Hebron", governorate: "Hebron", goal: 47000, summary: "A hygienic processing unit helping family farms produce consistent cheese and yogurt for local markets." },
  { id: "delivery", label: "Local Electric Delivery Fleet", title: "Local Electric Delivery Fleet", sector: "transport and logistics", categoryHints: ["transport", "logistics", "environment"], location: "Ramallah", governorate: "Ramallah and Al-Bireh", goal: 58000, summary: "A small electric fleet providing dependable last-mile delivery for neighborhood merchants." },
  { id: "seed-bank", label: "Community Seed Bank", title: "Community Seed Bank and Nursery", sector: "agriculture", categoryHints: ["agri", "environment"], location: "Salfit", governorate: "Salfit", goal: 23000, summary: "A seed-saving and nursery program protecting local varieties and supplying resilient seedlings." },
  { id: "furniture", label: "Sustainable Furniture Workshop", title: "Sustainable Custom Furniture Workshop", sector: "manufacturing", categoryHints: ["manufactur", "craft"], location: "Gaza City", governorate: "Gaza", goal: 39000, summary: "A modern workshop producing durable custom furniture while training entry-level craftspeople." },
  { id: "learning-center", label: "Inclusive Learning Center", title: "Inclusive Learning and Support Center", sector: "education and social impact", categoryHints: ["education", "social"], location: "Tulkarm", governorate: "Tulkarm", goal: 34000, summary: "Accessible tutoring, learning assessments, and family support for children with diverse needs." },
  { id: "hydroponics", label: "Urban Hydroponic Greenhouse", title: "Urban Hydroponic Greenhouse", sector: "agriculture technology", categoryHints: ["agri", "tech"], location: "Khan Younis", governorate: "Khan Younis", goal: 49000, summary: "A water-efficient greenhouse supplying fresh leafy vegetables through year-round production." },
  { id: "embroidery", label: "Embroidery Design Collective", title: "Palestinian Embroidery Design Collective", sector: "crafts and fashion", categoryHints: ["craft", "fashion", "women"], location: "Beit Jala", governorate: "Bethlehem", goal: 22000, summary: "A women-led collective combining traditional embroidery with contemporary product design and sales." },
  { id: "repair-lab", label: "Electronics Repair Lab", title: "Electronics Repair and Refurbishment Lab", sector: "technology", categoryHints: ["tech", "environment"], location: "Al-Bireh", governorate: "Ramallah and Al-Bireh", goal: 31000, summary: "A repair lab extending device life, reducing electronic waste, and training young technicians." },
];

const futureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const categoryFor = (preset: ProjectDemoPreset, categories: ProjectCategory[], currentCategory: string) => {
  const match = categories.find((category) => {
    const searchable = `${category.name} ${category.slug}`.toLowerCase();
    return preset.categoryHints.some((hint) => searchable.includes(hint));
  });
  return match?.id ?? categories[0]?.id ?? currentCategory;
};

export const applyProjectDemoPreset = (
  current: ProjectCreatePayload,
  preset: ProjectDemoPreset,
  categories: ProjectCategory[],
) => {
  const firstCost = Math.round(preset.goal * 0.45);
  const secondCost = Math.round(preset.goal * 0.35);
  const thirdCost = preset.goal - firstCost - secondCost;
  const form: ProjectCreatePayload = {
    ...current,
    title: preset.title,
    category: categoryFor(preset, categories, current.category),
    short_description: preset.summary,
    description: `${preset.title} will establish a locally operated ${preset.sector} venture in ${preset.location}. The project responds to a documented community need, creates practical economic opportunities, and uses a phased implementation plan with measurable deliverables and transparent progress updates.`,
    location: preset.location,
    location_governorate: preset.governorate,
    goal_amount: String(preset.goal),
    minimum_investment: "100",
    expected_roi: "8",
    funding_period_days: "45",
    video_url: "",
    cost_items: [
      { name: "1", description: "Equipment and installation", quantity: "1", unit_cost: String(firstCost) },
      { name: "2", description: "Initial materials and operating setup", quantity: "1", unit_cost: String(secondCost) },
      { name: "3", description: "Training, launch, and contingency", quantity: "1", unit_cost: String(thirdCost) },
    ],
    milestones: [
      { title: "Procurement and preparation", description: "Confirm suppliers, prepare the site, and procure the approved equipment.", deliverables: "Supplier agreements, prepared site, and procurement records", target_date: futureDate(30), percentage_of_project: "30", order: 1 },
      { title: "Installation and training", description: "Install the equipment and train the operating team using documented procedures.", deliverables: "Installed equipment, training attendance, and operating procedures", target_date: futureDate(60), percentage_of_project: "40", order: 2 },
      { title: "Launch and performance review", description: "Launch operations, serve initial customers, and review early performance indicators.", deliverables: "Launch report, initial service records, and performance summary", target_date: futureDate(90), percentage_of_project: "30", order: 3 },
    ],
    faqs: [
      { question: "How will the funds be monitored?", answer: "Spending will follow the published cost table, milestone evidence requirements, and platform review workflow." },
      { question: "Who benefits from this project?", answer: `Residents, workers, and small businesses in and around ${preset.location} will benefit from the project.` },
    ],
  };
  return {
    form,
    fundingBreakdown: `Equipment and installation: ${firstCost} ILS\nMaterials and setup: ${secondCost} ILS\nTraining, launch, and contingency: ${thirdCost} ILS`,
    risks: "Key risks include supplier delays, price changes, and slower-than-expected customer adoption. The project will use multiple supplier quotes, a contingency allocation, phased purchasing, and monthly performance reviews.",
  };
};
