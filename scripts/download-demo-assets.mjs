import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const projects = {
  "olive-press": "olive oil press machinery",
  "rooftop-solar": "rooftop solar panels cooperative",
  "farm-irrigation": "drip irrigation farm",
  "women-kitchen": "women community kitchen food production",
  "mobile-clinic": "mobile medical clinic vehicle",
  "coding-academy": "students computer coding classroom",
  "recycling-workshop": "plastic recycling workshop",
  "artisan-market": "Palestinian handicrafts artisan market",
  "cold-storage": "agricultural cold storage facility",
  bakery: "artisan whole grain bakery",
  beekeeping: "Beekeeper Inspecting the Hive",
  telehealth: "telemedicine video consultation",
  "school-labs": "students school science laboratory",
  "soap-studio": "Nabulsi soap production",
  "eco-guesthouse": "Battir Palestine guesthouse terraces",
  dairy: "Fonterra Dairy Processing Plant Maungaturoto",
  delivery: "Gavin Electric Van Computer Services",
  "seed-bank": "community seed bank nursery",
  furniture: "wood furniture workshop",
  "learning-center": "inclusive children learning classroom",
  hydroponics: "hydroponic greenhouse leafy vegetables",
  embroidery: "Palestinian embroidery women",
  "repair-lab": "Electronics Repair Workbench",
};

const root = process.cwd();
const outputDir = path.join(root, "public", "demo-assets", "projects");
await mkdir(outputDir, { recursive: true });

const fetchWithRetry = async (url) => {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    response = await fetch(url, {
      headers: { "User-Agent": "SahmiDemoAssetDownloader/1.0 (local development assets)" },
    });
    if (response.ok || response.status !== 429) return response;
  }
  return response;
};

const cleanHtml = (value = "") => value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
const attribution = [
  "# Demo photo attribution",
  "",
  "These photographs are bundled only as development/demo data. Each source is hosted by Wikimedia Commons under the license shown below.",
  "",
];

for (const [id, query] of Object.entries(projects)) {
  const destination = path.join(outputDir, `${id}.jpg`);
  if (existsSync(destination)) {
    const searchUrl = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(query)}&title=Special:MediaSearch&type=image`;
    attribution.push(`- **${id}** — Wikimedia Commons image selected for “${query}”; source search: ${searchUrl}`);
    continue;
  }
  let selected;
  const words = query.split(" ");
  const searchQueries = [query, words.slice(0, Math.min(3, words.length)).join(" "), words.slice(0, 2).join(" ")];
  for (const searchQuery of [...new Set(searchQueries)]) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrnamespace: "6",
      gsrsearch: searchQuery,
      gsrlimit: "30",
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: "1280",
      format: "json",
      formatversion: "2",
      origin: "*",
    });
    const response = await fetchWithRetry(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error(`${id}: Commons search failed (${response.status})`);
    const payload = await response.json();
    selected = (payload.query?.pages ?? [])
      .map((page) => ({ page, info: page.imageinfo?.[0] }))
      .filter(({ info }) => info?.mime === "image/jpeg" && info.width >= 700 && info.height >= 400)
      .sort((a, b) => (a.page.index ?? 999) - (b.page.index ?? 999))[0];
    if (selected) break;
  }
  if (!selected) throw new Error(`${id}: no suitable JPEG found for ${query}`);

  await new Promise((resolve) => setTimeout(resolve, 1200));
  const imageUrl = selected.info.thumburl || selected.info.url;
  const imageResponse = await fetchWithRetry(imageUrl);
  if (!imageResponse.ok) throw new Error(`${id}: image download failed (${imageResponse.status})`);
  await writeFile(destination, Buffer.from(await imageResponse.arrayBuffer()));

  const metadata = selected.info.extmetadata ?? {};
  const creator = cleanHtml(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor");
  const license = cleanHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "See source page");
  attribution.push(`- **${id}** — “${selected.page.title.replace(/^File:/, "")}” by ${creator}; ${license}; ${selected.info.descriptionurl}`);
  await new Promise((resolve) => setTimeout(resolve, 1100));
}

await writeFile(path.join(root, "public", "demo-assets", "ATTRIBUTION.md"), `${attribution.join("\n")}\n`, "utf8");
console.log(`Downloaded ${Object.keys(projects).length} matched demo photos to ${outputDir}`);
