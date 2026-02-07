// ─── Minimap ───

import React, { useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import '../../styles/hud.css';

const MINIMAP_SIZE = 120;
const MINIMAP_SCALE = 2; // blocks per pixel

export const Minimap: React.FC = () => {
  const position = usePlayerStore((s) => s.position);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = position.x;
    const cz = position.z;

    // Clear
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    // Background
    ctx.fillStyle = '#1a1e24';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Terrain coloring (deterministic pseudo-noise)
    for (let px = 0; px < MINIMAP_SIZE; px += 3) {
      for (let py = 0; py < MINIMAP_SIZE; py += 3) {
        const wx = cx + (px - MINIMAP_SIZE / 2) * MINIMAP_SCALE;
        const wz = cz + (py - MINIMAP_SIZE / 2) * MINIMAP_SCALE;

        const hash = Math.sin(wx * 0.01 + wz * 0.013) * 43758.5453;
        const h = hash - Math.floor(hash);

        let r: number, g: number, b: number;
        if (h < 0.3) {
          r = 35; g = 72; b = 118;
        } else if (h < 0.45) {
          r = 160; g = 140; b = 90;
        } else if (h < 0.7) {
          r = 48 + (h * 15) | 0;
          g = 80 + (h * 25) | 0;
          b = 34;
        } else if (h < 0.85) {
          r = 90; g = 105; b = 120;
        } else {
          r = 200; g = 205; b = 210;
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, 3, 3);
      }
    }

    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player dot
    ctx.beginPath();
    ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // North marker
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('N', MINIMAP_SIZE / 2, 12);
  }, [position.x, position.z]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="minimap">
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE, borderRadius: '50%' }}
      />
      <span className="minimap__coords">
        {Math.round(position.x)}, {Math.round(position.y)}, {Math.round(position.z)}
      </span>
    </div>
  );
};
