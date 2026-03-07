import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const iconsDir = path.join(publicDir, "icons");
const logoPath = path.join(iconsDir, "logo.png");

const BG_COLOR = "#0A0A0A"; // matches app background

async function generateIcon(size, outputName, padding = 0.15) {
  const logoSize = Math.round(size * (1 - padding * 2));
  const offset = Math.round((size - logoSize) / 2);

  const resizedLogo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: resizedLogo, left: offset, top: offset }])
    .png()
    .toFile(path.join(iconsDir, outputName));

  console.log(`✓ Generated icons/${outputName} (${size}x${size})`);
}

async function main() {
  // Standard PWA icons
  await generateIcon(72, "icon-72.png");
  await generateIcon(96, "icon-96.png");
  await generateIcon(128, "icon-128.png");
  await generateIcon(144, "icon-144.png");
  await generateIcon(192, "icon-192.png");
  await generateIcon(384, "icon-384.png");
  await generateIcon(512, "icon-512.png");

  // Maskable icon (needs more padding — safe zone is inner 80%)
  await generateIcon(512, "icon-maskable-512.png", 0.2);

  // Apple touch icon (180x180)
  await generateIcon(180, "apple-touch-icon.png", 0.1);

  console.log("\nAll PWA icons generated successfully!");
}

main().catch(console.error);
