import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to calculate CRC32
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crc32Table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ ~0) >>> 0;
}

const crc32Table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[n] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT - Raw pixel data
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  const cx = width / 2;
  const cy = height / 2;
  const radius = size * 0.44;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rose background color #C96068 -> RGB(201, 96, 104)
      let r = 201;
      let g = 96;
      let b = 104;
      let a = 255;

      // Rounded corner icon container
      const rx = Math.abs(dx);
      const ry = Math.abs(dy);
      const cornerR = size * 0.22;
      const boundX = width / 2 - cornerR;
      const boundY = height / 2 - cornerR;

      if (rx > boundX && ry > boundY) {
        const cdx = rx - boundX;
        const cdy = ry - boundY;
        if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerR) {
          a = 0; // transparent outside rounded square
        }
      }

      // Draw a clean white wallet rectangle in the center
      if (a > 0) {
        const walletW = size * 0.44;
        const walletH = size * 0.32;
        const wx = Math.abs(dx);
        const wy = Math.abs(dy);
        
        // Wallet body
        if (wx < walletW / 2 && wy < walletH / 2) {
          r = 255; g = 255; b = 255; // White
        }

        // Wallet clasp/pocket
        const claspW = size * 0.12;
        const claspH = size * 0.12;
        if (dx > walletW * 0.1 && dx < walletW * 0.1 + claspW && Math.abs(dy) < claspH / 2) {
          r = 201; g = 96; b = 104; // Rose accent clasp
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64));

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="112" fill="#C96068" />
  <path d="M128 160C128 142.327 142.327 128 160 128H352C369.673 128 384 142.327 384 160V352C384 369.673 369.673 384 352 384H160C142.327 384 128 369.673 128 352V160Z" fill="white" />
  <rect x="300" y="220" width="70" height="70" rx="16" fill="#C96068" />
  <circle cx="335" cy="255" r="10" fill="white" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('Icons generated successfully in public/');
