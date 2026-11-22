/**
 * Generates minimal valid PNG files using only Node.js built-in Buffer & zlib.
 * No external dependencies (canvas, sharp, imagemagick) required.
 */

const fs = require('fs');
const zlib = require('zlib');

const COLOR_EMERALD = { r: 52, g: 209, b: 88 };   // #30D158

// PNG signature (8 bytes)
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// Build an IHDR chunk
function buildIHDR(width, height) {
  const length = 13;
  const type = Buffer.from('IHDR', 'ascii');
  const widthBuf = Buffer.alloc(4);
  widthBuf.writeUInt32BE(width, 0);
  const heightBuf = Buffer.alloc(4);
  heightBuf.writeUInt32BE(height, 0);
  const params = Buffer.alloc(5);
  params.writeUInt8(8, 0); // bit depth
  params.writeUInt8(2, 1); // color type RGB
  params.writeUInt8(0, 2); // compression
  params.writeUInt8(0, 3); // filter
  params.writeUInt8(0, 4); // interlace
  const crcData = Buffer.concat([type, widthBuf, heightBuf, params]);
  const crc = zlib.crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([Buffer.alloc(4, length), type, widthBuf, heightBuf, params, crcBuf]);
}

// Build IDAT chunk with filter byte 0 and RGB pixel data
function buildIDAT(width, height, r, g, b) {
  const rowSize = 1 + width * 3; // filter byte + RGB per pixel
  const totalRaw = height * rowSize;
  const rawBuffer = Buffer.alloc(totalRaw);
  let offset = 0;
  for (let row = 0; row < height; row++) {
    rawBuffer[offset++] = 0; // filter type = none
    for (let col = 0; col < width; col++) {
      rawBuffer[offset++] = r;
      rawBuffer[offset++] = g;
      rawBuffer[offset++] = b;
    }
  }
  const compressed = zlib.deflateSync(rawBuffer);
  const length = compressed.length;
  const type = Buffer.from('IDAT', 'ascii');
  return Buffer.concat([Buffer.alloc(4, length), type, compressed]);
}

// Build IEND chunk
function buildIEND() {
  const type = Buffer.from('IEND', 'ascii');
  const crcBuf = Buffer.from([0, 0, 0, 0]);
  return Buffer.concat([Buffer.alloc(0), type, crcBuf]);
}

// Generate a complete PNG file
function generatePNG(width, height, r, g, b) {
  return Buffer.concat([
    PNG_SIGNATURE,
    buildIHDR(width, height),
    buildIDAT(width, height, r, g, b),
    buildIEND()
  ]);
}

// Generate the core PWA icons (the ones required by vite-plugin-pwa manifest)
const coreIcons = [
  { name: 'icon-192x192', width: 192, height: 192, color: COLOR_EMERALD },
  { name: 'icon-512x512', width: 512, height: 512, color: COLOR_EMERALD },
  { name: 'maskable-icon-512x512', width: 512, height: 512, color: COLOR_EMERALD },
];

for (const { name, width, height, color } of coreIcons) {
  const png = generatePNG(width, height, color.r, color.g, color.b);
  fs.writeFileSync(`public/${name}.png`, png);
  console.log(`Generated public/${name}.png (${width}x${height})`);
}

// Also create a 16x16 and 32x32 white favicon backup (we already have favicon.svg)
for (const [w, fname] of [[16, 'favicon-16x16.png'], [32, 'favicon-32x32.png']]) {
  const png = generatePNG(w, w, 255, 255, 255); // white
  fs.writeFileSync(`public/${fname}`, png);
  console.log(`Generated public/${fname} (${w}x${w})`);
}

console.log('All core PNG icons generated successfully!');