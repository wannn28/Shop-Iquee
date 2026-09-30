import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const products = [
  ["merino-crew", "Merino", "#D9D2C5", "#2A241C", "#EFEBE4"],
  ["structured-tote", "Tote", "#C9C2B4", "#1C1C1C", "#E4DDD2"],
  ["ceramic-pour-over", "Pour-over", "#E4E0DA", "#3A3330", "#F4F1EC"],
  ["studio-lamp", "Lamp", "#D5D2CC", "#222222", "#ECEAE6"],
  ["cotton-oxford", "Oxford", "#D7DCE3", "#1B2430", "#EEF1F4"],
  ["wool-beanie", "Beanie", "#E2D6CC", "#3B2A22", "#F3EBE5"],
  ["linen-throw", "Linen", "#E6E1D4", "#2E2A22", "#F6F3EC"],
  ["desk-tray", "Tray", "#D8C7AE", "#2B2418", "#F1E6D4"],
  ["canvas-sneaker", "Sneaker", "#E5E5E2", "#111111", "#F5F5F3"],
  ["glass-carafe", "Carafe", "#D5E0E2", "#1C2A2E", "#EEF4F5"],
  ["leather-card-holder", "Card", "#E0D0C0", "#2A2118", "#F6EEE6"],
  ["notebook-set", "Notes", "#DDD9D2", "#242424", "#F3F1ED"],
];

function svg(label, bg, fg, accent, variant) {
  const shift = variant === 2 ? 36 : 0;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="800" fill="${bg}"/>
  <rect x="${96 + shift}" y="${128 - shift / 2}" width="500" height="500" rx="32" fill="${accent}"/>
  <circle cx="${560 - shift}" cy="${250 + shift}" r="72" fill="${fg}" fill-opacity="0.08"/>
  <rect x="${150 + shift / 2}" y="${210}" width="280" height="14" rx="7" fill="${fg}" fill-opacity="0.18"/>
  <rect x="${150 + shift / 2}" y="${244}" width="180" height="14" rx="7" fill="${fg}" fill-opacity="0.1"/>
  <text x="72" y="720" fill="${fg}" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="600" letter-spacing="1">${label}</text>
  <text x="72" y="758" fill="${fg}" fill-opacity="0.55" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="3">IQUEE</text>
</svg>`;
}

const outDir = path.join(process.cwd(), "public", "products");
await mkdir(outDir, { recursive: true });

for (const [slug, label, bg, fg, accent] of products) {
  for (const variant of [1, 2]) {
    const file = path.join(outDir, `${slug}-${variant}.png`);
    await sharp(Buffer.from(svg(label, bg, fg, accent, variant))).png().toFile(file);
  }
}

await sharp(Buffer.from(svg("iquee", "#F7F7F5", "#111111", "#E8E8E4", 1)))
  .png()
  .toFile(path.join(outDir, "placeholder.png"));

console.log(`Wrote ${products.length * 2 + 1} images to public/products`);
