#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICON_DIR = path.join(__dirname, 'icons');
const sizes = [16, 32, 48, 128];

async function convertSvgToPng(size) {
  const svgPath = path.join(ICON_DIR, `icon${size}.svg`);
  const pngPath = path.join(ICON_DIR, `icon${size}.png`);

  if (!fs.existsSync(svgPath)) {
    throw new Error(`Missing SVG source: ${svgPath}`);
  }

  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);
  console.log(`Generated ${pngPath}`);
}

async function run() {
  try {
    for (const size of sizes) {
      await convertSvgToPng(size);
    }
    console.log('All icons generated successfully');
  } catch (err) {
    console.error('Failed to generate icons:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}