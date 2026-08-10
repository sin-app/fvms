import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const publicDir = resolve(import.meta.dirname, "..", "public");

async function render(svgName, outName, size) {
  const svg = readFileSync(resolve(publicDir, svgName));
  await sharp(svg, { density: 96 })
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, outName));
  console.log(`ok: ${outName} (${size}x${size})`);
}

await render("icon-512.svg", "icon-192.png", 192);
await render("icon-512.svg", "icon-512.png", 512);
await render("icon-maskable.svg", "icon-maskable-512.png", 512);
await render("icon-512.svg", "apple-touch-icon.png", 180);