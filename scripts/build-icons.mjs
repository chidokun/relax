// Rasterizes public/favicon.svg into the PNG/ICO fallbacks. Run: node scripts/build-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg', 'utf8');
// iOS rounds the home-screen icon itself, so the touch icon is a full square tile.
const squareSvg = svg.replace('rx="14"', 'rx="0"');

const png = (source, size) =>
  sharp(Buffer.from(source), { density: (72 * size * 4) / 64 })
    .resize(size, size)
    .png()
    .toBuffer();

// ICO container holding PNG images (supported by every browser that reads favicon.ico).
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((img) => img.data)]);
}

const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(svg, size) })));
writeFileSync('public/favicon.ico', ico(icoImages));
writeFileSync('public/apple-touch-icon.png', await png(squareSvg, 180));
console.log('wrote public/favicon.ico, public/apple-touch-icon.png');
