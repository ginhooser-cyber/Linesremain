// ─── Procedural Texture Atlas ───

import * as THREE from 'three';

const ATLAS_SIZE = 256;
const CELL_SIZE = 32;

type DrawFn = (ctx: CanvasRenderingContext2D, x: number, y: number) => void;

// ─── Utility Helpers ───

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function rgbStr(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}

/** Simple seeded pseudo-random for texture generation */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
}

function drawEdge(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha = 0.15): void {
  ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx + 0.5, cy + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
}

// ─── Texture Drawing Functions ───

const drawDirt: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#7B5B3A');
  const rng = mulberry32(101);
  // Subtle horizontal layers
  for (let ly = 0; ly < CELL_SIZE; ly += 6) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rng() * 0.04})`;
    ctx.fillRect(cx, cy + ly, CELL_SIZE, 2);
  }
  // Scattered lighter specks
  for (let i = 0; i < 30; i++) {
    const px = cx + Math.floor(rng() * CELL_SIZE);
    const py = cy + Math.floor(rng() * CELL_SIZE);
    ctx.fillStyle = `rgba(155,123,90,${0.4 + rng() * 0.4})`;
    ctx.fillRect(px, py, 1 + Math.floor(rng() * 2), 1);
  }
  drawEdge(ctx, cx, cy);
};

const drawGrassTop: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#5B7A2E');
  const rng = mulberry32(202);
  // Darker patches
  for (let i = 0; i < 20; i++) {
    const px = cx + Math.floor(rng() * CELL_SIZE);
    const py = cy + Math.floor(rng() * CELL_SIZE);
    ctx.fillStyle = `rgba(74,105,35,${0.5 + rng() * 0.3})`;
    ctx.fillRect(px, py, 2 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 2));
  }
  // Seed dots
  for (let i = 0; i < 8; i++) {
    const px = cx + Math.floor(rng() * CELL_SIZE);
    const py = cy + Math.floor(rng() * CELL_SIZE);
    ctx.fillStyle = 'rgba(80,60,30,0.3)';
    ctx.fillRect(px, py, 1, 1);
  }
  drawEdge(ctx, cx, cy);
};

const drawStone: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#6B7B8D');
  const rng = mulberry32(303);
  // Cracked pattern with darker lines
  ctx.strokeStyle = '#4A5A6B';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const sx = cx + Math.floor(rng() * CELL_SIZE);
    const sy = cy + Math.floor(rng() * CELL_SIZE);
    ctx.moveTo(sx, sy);
    for (let j = 0; j < 3; j++) {
      ctx.lineTo(
        sx + Math.floor((rng() - 0.5) * 16),
        sy + Math.floor((rng() - 0.5) * 16),
      );
    }
    ctx.stroke();
  }
  // Lighter variation
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = `rgba(130,140,155,${0.2 + rng() * 0.2})`;
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      2 + Math.floor(rng() * 3),
      2 + Math.floor(rng() * 3),
    );
  }
  drawEdge(ctx, cx, cy);
};

const drawSand: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#D4B483');
  const rng = mulberry32(404);
  // Tiny dot pattern
  for (let i = 0; i < 40; i++) {
    const px = cx + Math.floor(rng() * CELL_SIZE);
    const py = cy + Math.floor(rng() * CELL_SIZE);
    const bright = rng() > 0.5;
    ctx.fillStyle = bright ? 'rgba(220,195,160,0.4)' : 'rgba(180,150,100,0.3)';
    ctx.fillRect(px, py, 1, 1);
  }
  drawEdge(ctx, cx, cy, 0.08);
};

const drawSnow: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#E8EBF0');
  const rng = mulberry32(505);
  // Faint blue shadows
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(206,212,224,${0.3 + rng() * 0.3})`;
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      3 + Math.floor(rng() * 5),
      2 + Math.floor(rng() * 3),
    );
  }
  drawEdge(ctx, cx, cy, 0.06);
};

const drawLogBark: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#4A3520');
  const rng = mulberry32(606);
  // Vertical stripe pattern
  for (let vx = 0; vx < CELL_SIZE; vx += 3 + Math.floor(rng() * 3)) {
    ctx.fillStyle = `rgba(60,40,25,${0.3 + rng() * 0.4})`;
    ctx.fillRect(cx + vx, cy, 1 + Math.floor(rng() * 2), CELL_SIZE);
  }
  // Rough texture spots
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(80,60,35,${0.3 + rng() * 0.3})`;
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      1 + Math.floor(rng() * 2),
      1 + Math.floor(rng() * 2),
    );
  }
  drawEdge(ctx, cx, cy);
};

const drawLeaves: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#3A6B28');
  const rng = mulberry32(707);
  // Scattered dark holes/gaps
  for (let i = 0; i < 25; i++) {
    const px = cx + Math.floor(rng() * CELL_SIZE);
    const py = cy + Math.floor(rng() * CELL_SIZE);
    const dark = rng() > 0.5;
    ctx.fillStyle = dark ? 'rgba(25,50,15,0.6)' : 'rgba(70,120,50,0.4)';
    ctx.fillRect(px, py, 1 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
  }
  drawEdge(ctx, cx, cy);
};

const drawPlanks: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#A0784A');
  const rng = mulberry32(808);
  // Horizontal plank lines every 8px
  ctx.strokeStyle = 'rgba(70,50,25,0.4)';
  ctx.lineWidth = 1;
  for (let py = 8; py < CELL_SIZE; py += 8) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + py + 0.5);
    ctx.lineTo(cx + CELL_SIZE, cy + py + 0.5);
    ctx.stroke();
  }
  // Wood grain dots
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(130,95,55,${0.3 + rng() * 0.3})`;
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      1 + Math.floor(rng() * 3),
      1,
    );
  }
  drawEdge(ctx, cx, cy);
};

const drawCobblestone: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#808080');
  const rng = mulberry32(909);
  // Irregular stone shapes
  ctx.strokeStyle = 'rgba(50,50,50,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const sx = cx + 2 + Math.floor(rng() * (CELL_SIZE - 8));
    const sy = cy + 2 + Math.floor(rng() * (CELL_SIZE - 8));
    const sw = 4 + Math.floor(rng() * 8);
    const sh = 3 + Math.floor(rng() * 6);
    const shade = 70 + Math.floor(rng() * 40);
    ctx.fillStyle = rgbStr(shade, shade, shade + 5);
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
  }
  drawEdge(ctx, cx, cy);
};

function drawOre(baseColor: string, oreColor: string, seed: number, count: number): DrawFn {
  return (ctx, cx, cy) => {
    // Stone base
    drawStone(ctx, cx, cy);
    const rng = mulberry32(seed);
    const [or, og, ob] = hexToRgb(oreColor);
    // Ore splotches
    for (let i = 0; i < count; i++) {
      const px = cx + 3 + Math.floor(rng() * (CELL_SIZE - 6));
      const py = cy + 3 + Math.floor(rng() * (CELL_SIZE - 6));
      const s = 2 + Math.floor(rng() * 3);
      ctx.fillStyle = `rgba(${or},${og},${ob},${0.7 + rng() * 0.3})`;
      ctx.fillRect(px, py, s, s - 1 + Math.floor(rng() * 2));
    }
  };
}

const drawMetalOre = drawOre('#6B7B8D', '#D4763A', 1010, 6);
const drawSulfurOre = drawOre('#6B7B8D', '#C4A832', 1111, 5);
const drawHQMOre = drawOre('#6B7B8D', '#4ABBA0', 1212, 3);

const drawBedrock: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#2A2A2A');
  const rng = mulberry32(1313);
  // Dense crack pattern
  ctx.strokeStyle = 'rgba(15,15,15,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const sx = cx + Math.floor(rng() * CELL_SIZE);
    const sy = cy + Math.floor(rng() * CELL_SIZE);
    ctx.moveTo(sx, sy);
    for (let j = 0; j < 4; j++) {
      ctx.lineTo(
        sx + Math.floor((rng() - 0.5) * 14),
        sy + Math.floor((rng() - 0.5) * 14),
      );
    }
    ctx.stroke();
  }
  drawEdge(ctx, cx, cy, 0.05);
};

const drawWater: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#3A7CBD');
  const rng = mulberry32(1414);
  // Wave-like horizontal bands
  for (let wy = 0; wy < CELL_SIZE; wy += 4) {
    ctx.fillStyle = `rgba(50,100,170,${0.15 + rng() * 0.15})`;
    ctx.fillRect(cx, cy + wy, CELL_SIZE, 2);
  }
  // Highlight sparkles
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = 'rgba(180,220,255,0.25)';
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      1,
      1,
    );
  }
};

const drawGravel: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#6B6352');
  const rng = mulberry32(1515);
  // Many small round stone shapes
  for (let i = 0; i < 16; i++) {
    const px = cx + Math.floor(rng() * (CELL_SIZE - 4));
    const py = cy + Math.floor(rng() * (CELL_SIZE - 4));
    const s = 2 + Math.floor(rng() * 3);
    const shade = 80 + Math.floor(rng() * 50);
    ctx.fillStyle = rgbStr(shade, shade - 5, shade - 10);
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2, s / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  drawEdge(ctx, cx, cy);
};

const drawClay: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#A07B5F');
  const rng = mulberry32(1616);
  // Smooth with subtle swirls
  ctx.strokeStyle = 'rgba(130,100,75,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const sx = cx + Math.floor(rng() * CELL_SIZE);
    const sy = cy + Math.floor(rng() * CELL_SIZE);
    ctx.arc(sx, sy, 4 + rng() * 6, rng() * Math.PI, rng() * Math.PI * 2);
    ctx.stroke();
  }
  drawEdge(ctx, cx, cy, 0.1);
};

const drawCactus: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#4AA030');
  const rng = mulberry32(1717);
  // Vertical ridges
  for (let vx = 4; vx < CELL_SIZE; vx += 6) {
    ctx.fillStyle = 'rgba(35,80,20,0.35)';
    ctx.fillRect(cx + vx, cy, 1, CELL_SIZE);
  }
  // Small dots for spines
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = 'rgba(200,200,150,0.6)';
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      1,
      1,
    );
  }
  drawEdge(ctx, cx, cy);
};

const drawDeadBush: DrawFn = (ctx, cx, cy) => {
  // Transparent background
  ctx.clearRect(cx, cy, CELL_SIZE, CELL_SIZE);
  const rng = mulberry32(1818);
  ctx.strokeStyle = '#6B5030';
  ctx.lineWidth = 1;
  // Branch shapes
  const midX = cx + 16;
  const botY = cy + 28;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(midX + (rng() - 0.5) * 4, botY);
    ctx.lineTo(midX + (rng() - 0.5) * 24, cy + 4 + rng() * 12);
    ctx.stroke();
  }
};

const drawTallGrass: DrawFn = (ctx, cx, cy) => {
  // Transparent background
  ctx.clearRect(cx, cy, CELL_SIZE, CELL_SIZE);
  const rng = mulberry32(1919);
  // Green blade shapes
  for (let i = 0; i < 7; i++) {
    const bx = cx + 3 + Math.floor(rng() * (CELL_SIZE - 6));
    ctx.strokeStyle = `rgba(70,${100 + Math.floor(rng() * 40)},35,0.8)`;
    ctx.lineWidth = 1 + Math.floor(rng() * 2);
    ctx.beginPath();
    ctx.moveTo(bx, cy + CELL_SIZE);
    ctx.quadraticCurveTo(
      bx + (rng() - 0.5) * 10,
      cy + CELL_SIZE * 0.4,
      bx + (rng() - 0.5) * 8,
      cy + 2 + rng() * 8,
    );
    ctx.stroke();
  }
};

const drawMushroom: DrawFn = (ctx, cx, cy) => {
  ctx.clearRect(cx, cy, CELL_SIZE, CELL_SIZE);
  // Stem
  ctx.fillStyle = '#D4C8A0';
  ctx.fillRect(cx + 13, cy + 16, 6, 14);
  // Cap
  ctx.fillStyle = '#A03020';
  ctx.beginPath();
  ctx.arc(cx + 16, cy + 16, 8, Math.PI, 0);
  ctx.fill();
  // White dots on cap
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(cx + 12, cy + 12, 2, 2);
  ctx.fillRect(cx + 17, cy + 10, 2, 2);
};

const drawIce: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#B0E0F0');
  const rng = mulberry32(2121);
  // Diagonal crack lines
  ctx.strokeStyle = 'rgba(200,230,250,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.floor(rng() * CELL_SIZE), cy);
    ctx.lineTo(cx + Math.floor(rng() * CELL_SIZE), cy + CELL_SIZE);
    ctx.stroke();
  }
  // Semi-reflective highlights
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(220,240,255,0.3)';
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      3 + Math.floor(rng() * 4),
      1,
    );
  }
  drawEdge(ctx, cx, cy, 0.06);
};

const drawMossyStone: DrawFn = (ctx, cx, cy) => {
  // Stone base first
  drawStone(ctx, cx, cy);
  const rng = mulberry32(2222);
  // Moss patches
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(60,100,40,${0.4 + rng() * 0.3})`;
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + Math.floor(rng() * CELL_SIZE),
      2 + Math.floor(rng() * 4),
      2 + Math.floor(rng() * 3),
    );
  }
};

const drawGrassSide: DrawFn = (ctx, cx, cy) => {
  // Top 8px olive green blending into dirt brown bottom
  fillCell(ctx, cx, cy, '#7B5B3A');
  // Green top section
  ctx.fillStyle = '#5B7A2E';
  ctx.fillRect(cx, cy, CELL_SIZE, 8);
  // Blend zone
  const rng = mulberry32(2323);
  for (let px = 0; px < CELL_SIZE; px++) {
    const depth = 8 + Math.floor(rng() * 5);
    for (let py = 8; py < depth && py < CELL_SIZE; py++) {
      const alpha = 1 - (py - 8) / 6;
      ctx.fillStyle = `rgba(91,122,46,${alpha * 0.7})`;
      ctx.fillRect(cx + px, cy + py, 1, 1);
    }
  }
  // Dirt texture below
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = `rgba(155,123,90,${0.3 + rng() * 0.3})`;
    ctx.fillRect(
      cx + Math.floor(rng() * CELL_SIZE),
      cy + 10 + Math.floor(rng() * (CELL_SIZE - 10)),
      1 + Math.floor(rng() * 2),
      1,
    );
  }
  drawEdge(ctx, cx, cy);
};

const drawLogRing: DrawFn = (ctx, cx, cy) => {
  fillCell(ctx, cx, cy, '#B89B6A');
  const midX = cx + CELL_SIZE / 2;
  const midY = cy + CELL_SIZE / 2;
  // Concentric rings
  ctx.strokeStyle = 'rgba(100,75,45,0.4)';
  ctx.lineWidth = 1;
  for (let r = 3; r < 15; r += 3) {
    ctx.beginPath();
    ctx.arc(midX, midY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Center dot
  ctx.fillStyle = '#6B5030';
  ctx.beginPath();
  ctx.arc(midX, midY, 2, 0, Math.PI * 2);
  ctx.fill();
  drawEdge(ctx, cx, cy);
};

// ─── Atlas Layout Map ───
// Maps (gridX, gridY) → draw function
// Row 0: Air(0,0) Dirt(1,0) GrassTop(2,0) Stone(3,0) Sand(4,0) Snow(5,0) LogBark(6,0) Leaves(7,0)
// Row 1: Planks(0,1) Cobble(1,1) MetalOre(2,1) SulfurOre(3,1) HQMOre(4,1) Bedrock(5,1) Water(6,1) Gravel(7,1)
// Row 2: Clay(0,2) Cactus(1,2) DeadBush(2,2) TallGrass(3,2) Mushroom(4,2) Ice(5,2) MossyStone(6,2) GrassSide(7,2)
// Row 3: LogRing(0,3)

const ATLAS_MAP: Array<[number, number, DrawFn]> = [
  // Row 0
  // Air (0,0) is left blank/transparent
  [1, 0, drawDirt],
  [2, 0, drawGrassTop],
  [3, 0, drawStone],
  [4, 0, drawSand],
  [5, 0, drawSnow],
  [6, 0, drawLogBark],
  [7, 0, drawLeaves],
  // Row 1
  [0, 1, drawPlanks],
  [1, 1, drawCobblestone],
  [2, 1, drawMetalOre],
  [3, 1, drawSulfurOre],
  [4, 1, drawHQMOre],
  [5, 1, drawBedrock],
  [6, 1, drawWater],
  [7, 1, drawGravel],
  // Row 2
  [0, 2, drawClay],
  [1, 2, drawCactus],
  [2, 2, drawDeadBush],
  [3, 2, drawTallGrass],
  [4, 2, drawMushroom],
  [5, 2, drawIce],
  [6, 2, drawMossyStone],
  [7, 2, drawGrassSide],
  // Row 3
  [0, 3, drawLogRing],
];

// ─── Public API ───

let cachedTexture: THREE.Texture | null = null;
let cachedCanvas: HTMLCanvasElement | null = null;

export function createTextureAtlas(): THREE.Texture {
  if (cachedTexture) return cachedTexture;

  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Clear to fully transparent
  ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

  // Draw each texture cell
  for (const [gx, gy, drawFn] of ATLAS_MAP) {
    const px = gx * CELL_SIZE;
    const py = gy * CELL_SIZE;
    drawFn(ctx, px, py);
  }

  cachedCanvas = canvas;

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = false;
  texture.flipY = false; // Canvas Y-axis matches our UV layout (v=0 → top row)

  cachedTexture = texture;
  return texture;
}

export function getAtlasCanvas(): HTMLCanvasElement | null {
  return cachedCanvas;
}

export function disposeTextureAtlas(): void {
  if (cachedTexture) {
    cachedTexture.dispose();
    cachedTexture = null;
  }
  cachedCanvas = null;
}