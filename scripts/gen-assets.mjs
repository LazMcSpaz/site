// Generate favicon sizes + social (OG) image from the logo.
// Run with: node scripts/gen-assets.mjs   (sharp ships with Astro)
// Re-run whenever the logo changes.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public");
const logo = join(pub, "morys_logo.png");
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

// 1. favicon-32.png
await sharp(logo)
  .resize(32, 32, { fit: "contain", background: transparent })
  .png()
  .toFile(join(pub, "favicon-32.png"));

// 2. apple-touch-icon (180) — logo centered on navy (iOS adds rounded corners)
const appleLogo = await sharp(logo)
  .resize(148, 148, { fit: "contain", background: transparent })
  .png()
  .toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: "#0f1f3d" } })
  .composite([{ input: appleLogo, gravity: "centre" }])
  .png()
  .toFile(join(pub, "apple-touch-icon.png"));

// 3. og-image.jpg (1200x630) — navy card with logo + wordmark + phone
const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0f1f3d"/>
  <rect width="16" height="630" fill="#da861c"/>
  <text x="500" y="262" font-family="Arial Black, Arial, sans-serif" font-size="104" font-weight="900" fill="#ffffff" letter-spacing="2">MORY'S</text>
  <text x="504" y="330" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#da861c" letter-spacing="4">AUTO PARTS &amp; GLASS</text>
  <rect x="504" y="360" width="120" height="6" fill="#da861c"/>
  <text x="504" y="424" font-family="Arial, sans-serif" font-size="31" fill="#cbd5e1">New · Used · Aftermarket · Auto Glass</text>
  <text x="504" y="470" font-family="Arial, sans-serif" font-size="31" fill="#cbd5e1">Hialeah, FL  ·  305-835-2777</text>
</svg>`;
const ogLogo = await sharp(logo)
  .resize(340, 340, { fit: "contain", background: transparent })
  .png()
  .toBuffer();
await sharp(Buffer.from(ogSvg))
  .composite([{ input: ogLogo, top: 145, left: 110 }])
  .jpeg({ quality: 88 })
  .toFile(join(pub, "og-image.jpg"));

console.log("Generated: favicon-32.png, apple-touch-icon.png, og-image.jpg");
