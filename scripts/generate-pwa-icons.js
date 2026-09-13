const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPng(width, height, drawPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowStart + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflated),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Draw modern Claros emblem
function drawClarosIcon(x, y, w, h, isMaskable = false) {
  // Normalize coords: -1 to 1
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const distCenter = Math.sqrt(nx * nx + ny * ny);

  // Background gradient: Dark obsidian #09090b with subtle radial glow
  let bgR = 10, bgG = 10, bgB = 12, bgA = 255;
  const glow = Math.max(0, 1 - distCenter * 0.9);
  bgR = Math.min(255, Math.floor(bgR + glow * 25));
  bgG = Math.min(255, Math.floor(bgG + glow * 20));
  bgB = Math.min(255, Math.floor(bgB + glow * 45));

  // If not maskable, round corners with squircle radius
  if (!isMaskable) {
    const cornerRadius = 0.68;
    const cornerP = 5.0; // superellipse exponent
    const superDist = Math.pow(Math.abs(nx), cornerP) + Math.pow(Math.abs(ny), cornerP);
    if (superDist > 1.0) {
      return [0, 0, 0, 0]; // transparent outside squircle
    }
  }

  // Scale emblem for maskable vs standard (maskable needs ~20% safe zone margin)
  const scale = isMaskable ? 1.45 : 1.15;
  const ex = nx * scale;
  const ey = ny * scale;

  // Arc of 'C'
  const edist = Math.sqrt(ex * ex + ey * ey);
  const angle = Math.atan2(ey, ex); // -PI to PI
  
  // Outer radius 0.58, inner radius 0.32
  // Open gap between -40 deg and +40 deg
  const inRing = edist >= 0.28 && edist <= 0.60;
  const inGap = (angle > -0.55 && angle < 0.55);

  if (inRing && !inGap) {
    // Indigo to Electric Violet gradient (#818cf8 to #4f46e5)
    const t = (nx + ny + 1.4) / 2.8;
    const r = Math.floor(129 * (1 - t) + 79 * t);
    const g = Math.floor(140 * (1 - t) + 70 * t);
    const b = Math.floor(248 * (1 - t) + 229 * t);
    return [r, g, b, 255];
  }

  // Accent Spark: small cyan dot at (0.44, 0)
  const dotDx = ex - 0.45;
  const dotDy = ey;
  const dotDist = Math.sqrt(dotDx * dotDx + dotDy * dotDy);
  if (dotDist <= 0.09) {
    // Sky cyan #38bdf8
    return [56, 189, 248, 255];
  }

  return [bgR, bgG, bgB, bgA];
}

const iconsDir = path.join(__dirname, "..", "public", "icons");
const publicDir = path.join(__dirname, "..", "public");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Generate icon-192x192.png
fs.writeFileSync(
  path.join(iconsDir, "icon-192x192.png"),
  createPng(192, 192, (x, y, w, h) => drawClarosIcon(x, y, w, h, false))
);

// 2. Generate icon-512x512.png
fs.writeFileSync(
  path.join(iconsDir, "icon-512x512.png"),
  createPng(512, 512, (x, y, w, h) => drawClarosIcon(x, y, w, h, false))
);

// 3. Generate maskable-icon-512x512.png (full bleed for Android Adaptive icons)
fs.writeFileSync(
  path.join(iconsDir, "maskable-icon-512x512.png"),
  createPng(512, 512, (x, y, w, h) => drawClarosIcon(x, y, w, h, true))
);

// 4. Generate apple-touch-icon.png (180x180)
fs.writeFileSync(
  path.join(publicDir, "apple-touch-icon.png"),
  createPng(180, 180, (x, y, w, h) => drawClarosIcon(x, y, w, h, true))
);

// 5. Generate favicon.png (48x48)
fs.writeFileSync(
  path.join(publicDir, "favicon.png"),
  createPng(48, 48, (x, y, w, h) => drawClarosIcon(x, y, w, h, false))
);

console.log("Successfully generated all PWA icons!");
