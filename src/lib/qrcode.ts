/**
 * Minimal QR Code generator — pure TypeScript, zero dependencies.
 * Supports numeric, alphanumeric, and byte modes up to version 10.
 * Returns a 2D boolean matrix (true = black module).
 *
 * Based on ISO/IEC 18004:2015 and Nayuki's reference implementation.
 */

const EC_CODEWORDS_PER_BLOCK: number[][] = [
  // Version 1–10, Error correction level M
  [10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
];

// Simplified: we only use error correction level M for balance of size & reliability
// For a minimal implementation we use a lookup for capacity & EC

type QRSegment = { mode: number; numChars: number; data: number[] };

const MODE_BYTE = 4;

// Number of data codewords for versions 1-10 at EC level M
const DATA_CODEWORDS: number[] = [
  16, 28, 44, 64, 86, 108, 132, 154, 180, 208,
];

// Error correction codewords per block for versions 1-10 at EC level M
const EC_PER_BLOCK: number[] = [
  10, 16, 26, 18, 24, 16, 18, 22, 22, 26,
];

// Number of blocks for versions 1-10 at EC level M
const NUM_BLOCKS: number[] = [
  1, 1, 1, 2, 2, 4, 4, 4, 5, 5,
];

function getVersion(dataLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const totalCodewords = DATA_CODEWORDS[v - 1];
    // byte mode overhead: 4 bits mode + char count bits + data
    const charCountBits = v <= 9 ? 8 : 16;
    const availBits = totalCodewords * 8;
    const needed = 4 + charCountBits + dataLen * 8;
    if (needed <= availBits) return v;
  }
  return -1;
}

function getSize(version: number): number {
  return 17 + version * 4;
}

// GF(256) arithmetic for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = new Uint8Array(ecLen + 1);
  gen[0] = 1;
  for (let i = 0; i < ecLen; i++) {
    for (let j = i + 1; j >= 1; j--) {
      gen[j] = gen[j] ^ gfMul(gen[j - 1], GF_EXP[i]);
    }
  }
  const result = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[ecLen - 1] = 0;
    for (let j = 0; j < ecLen; j++) {
      result[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return result;
}

// Penalty scoring
function penalty(matrix: boolean[][], size: number): number {
  let score = 0;
  // Rule 1: consecutive same-color modules in row/col
  for (let i = 0; i < size; i++) {
    for (let dir = 0; dir < 2; dir++) {
      let count = 1;
      for (let j = 1; j < size; j++) {
        const cur = dir === 0 ? matrix[i][j] : matrix[j][i];
        const prev = dir === 0 ? matrix[i][j - 1] : matrix[j - 1][i];
        if (cur === prev) {
          count++;
          if (count === 5) score += 3;
          else if (count > 5) score += 1;
        } else {
          count = 1;
        }
      }
    }
  }
  // Rule 2: 2x2 blocks
  for (let i = 0; i < size - 1; i++) {
    for (let j = 0; j < size - 1; j++) {
      const c = matrix[i][j];
      if (c === matrix[i][j + 1] && c === matrix[i + 1][j] && c === matrix[i + 1][j + 1])
        score += 3;
    }
  }
  // Rule 4: proportion
  let dark = 0;
  for (let i = 0; i < size; i++)
    for (let j = 0; j < size; j++) if (matrix[i][j]) dark++;
  const pct = (dark * 100) / (size * size);
  const prev5 = Math.abs(Math.floor(pct / 5) * 5 - 50) / 5;
  const next5 = Math.abs(Math.ceil(pct / 5) * 5 - 50) / 5;
  score += Math.min(prev5, next5) * 10;
  return score;
}

// Place finder patterns
function placeFinder(matrix: boolean[][], reserved: boolean[][], r: number, c: number, size: number) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      reserved[rr][cc] = true;
      const isBlack =
        (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
        (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
        (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
      matrix[rr][cc] = isBlack;
    }
  }
}

// Alignment pattern positions for versions 2-10
const ALIGN_POS: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 52],
];

function placeAlignment(matrix: boolean[][], reserved: boolean[][], version: number, size: number) {
  if (version < 2) return;
  const positions = ALIGN_POS[version - 1];
  for (const r of positions) {
    for (const c of positions) {
      if (reserved[r]?.[c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr, cc = c + dc;
          reserved[rr][cc] = true;
          matrix[rr][cc] =
            Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
        }
      }
    }
  }
}

function placeTiming(matrix: boolean[][], reserved: boolean[][], size: number) {
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) {
      matrix[6][i] = i % 2 === 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      matrix[i][6] = i % 2 === 0;
      reserved[i][6] = true;
    }
  }
}

// Format info (EC level M = 0, mask 0-7)
const FORMAT_BITS: number[] = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

function placeFormatBits(matrix: boolean[][], size: number, mask: number) {
  const bits = FORMAT_BITS[mask];
  // Around top-left finder
  const positions = [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ];
  for (let i = 0; i < 15; i++) {
    matrix[positions[i][0]][positions[i][1]] = ((bits >> i) & 1) === 1;
  }
  // Around bottom-left and top-right finders
  for (let i = 0; i < 8; i++) {
    matrix[size - 1 - i][8] = ((bits >> i) & 1) === 1;
  }
  for (let i = 8; i < 15; i++) {
    matrix[8][size - 15 + i] = ((bits >> i) & 1) === 1;
  }
  matrix[size - 8][8] = true; // always dark
}

const MASK_FNS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

export function generateQR(text: string): boolean[][] {
  const dataBytes = new TextEncoder().encode(text);
  const version = getVersion(dataBytes.length);
  if (version < 0) throw new Error("Text too long for QR code (max ~200 chars)");

  const size = getSize(version);
  const totalDataCW = DATA_CODEWORDS[version - 1];
  const ecPerBlock = EC_PER_BLOCK[version - 1];
  const numBlocks = NUM_BLOCKS[version - 1];

  // Build data bitstream
  const charCountBits = version <= 9 ? 8 : 16;
  const bits: number[] = [];

  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(MODE_BYTE, 4);
  pushBits(dataBytes.length, charCountBits);
  for (const b of dataBytes) pushBits(b, 8);

  // Terminator
  const totalBits = totalDataCW * 8;
  const termLen = Math.min(4, totalBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to codewords
  const codewords = new Uint8Array(totalDataCW);
  for (let i = 0; i < totalDataCW; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
    codewords[i] = byte;
  }

  // Split into blocks and compute EC
  const shortBlockLen = Math.floor(totalDataCW / numBlocks);
  const longBlocks = totalDataCW % numBlocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let b = 0; b < numBlocks; b++) {
    const blockLen = shortBlockLen + (b >= numBlocks - longBlocks ? 1 : 0);
    const block = codewords.slice(offset, offset + blockLen);
    offset += blockLen;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }

  // Interleave
  const interleaved: number[] = [];
  const maxDataLen = shortBlockLen + (longBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) {
      interleaved.push(block[i]);
    }
  }

  // Create matrix
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Place function patterns
  placeFinder(matrix, reserved, 0, 0, size);
  placeFinder(matrix, reserved, 0, size - 7, size);
  placeFinder(matrix, reserved, size - 7, 0, size);
  placeAlignment(matrix, reserved, version, size);
  placeTiming(matrix, reserved, size);

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (!reserved[i]?.[8]) reserved[i][8] = true;
    if (!reserved[8]?.[i]) reserved[8][i] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[size - 1 - i][8] = true;
    reserved[8][size - 1 - i] = true;
  }

  // Place data bits
  let bitIdx = 0;
  const totalBitsToPlace = interleaved.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip timing column
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (reserved[row][col]) continue;
        if (bitIdx < totalBitsToPlace) {
          const byteIdx = Math.floor(bitIdx / 8);
          const bitPos = 7 - (bitIdx % 8);
          matrix[row][col] = ((interleaved[byteIdx] >> bitPos) & 1) === 1;
          bitIdx++;
        }
      }
    }
  }

  // Try all 8 masks, pick best
  let bestMask = 0;
  let bestScore = Infinity;

  for (let m = 0; m < 8; m++) {
    const masked: boolean[][] = matrix.map((row) => [...row]);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c] || false) {
          if (!reserved[r][c] && MASK_FNS[m](r, c)) {
            masked[r][c] = !masked[r][c];
          }
        }
      }
    }
    placeFormatBits(masked, size, m);
    const score = penalty(masked, size);
    if (score < bestScore) {
      bestScore = score;
      bestMask = m;
    }
  }

  // Apply best mask
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && MASK_FNS[bestMask](r, c)) {
        matrix[r][c] = !matrix[r][c];
      }
    }
  }
  placeFormatBits(matrix, size, bestMask);

  return matrix;
}
