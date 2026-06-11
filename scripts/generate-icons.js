/**
 * Run with: node scripts/generate-icons.js
 * Requires: npm install sharp
 *
 * Converts public/icons/icon.svg → icon-192x192.png and icon-512x512.png
 */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const src = path.join(__dirname, '../public/icons/icon.svg')
const dest = path.join(__dirname, '../public/icons')

async function main() {
  const svgBuffer = fs.readFileSync(src)
  for (const size of [192, 512]) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dest, `icon-${size}x${size}.png`))
    console.log(`Generated icon-${size}x${size}.png`)
  }
}

main().catch(console.error)
