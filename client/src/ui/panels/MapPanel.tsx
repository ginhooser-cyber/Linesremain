// ─── Map Panel ───

import React, { useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import '../../styles/panels.css';

// ─── Constants ───

const MAP_SIZE = 400; // Canvas pixel size
const MAP_SCALE = 4; // World blocks per pixel
const BIOME_COLORS: Record<string, string> = {
  default: '#3a5a27',
  sand: '#d4b483',
  snow: '#e8ebf0',
  stone: '#6b7b8d',
  water: '#2d5c8a',
};

export const MapPanel: React.FC = () => {
  const mapOpen = useUIStore((s) => s.mapOpen);
  const toggleMap = useUIStore((s) => s.toggleMap);
  const position = usePlayerStore((s) => s.position);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = position.x;
    const cz = position.z;

    // Dark background
    ctx.fillStyle = '#1a1e24';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 32; // One chunk = 32 blocks
    const offsetX = ((cx / MAP_SCALE) % (gridSpacing / MAP_SCALE));
    const offsetZ = ((cz / MAP_SCALE) % (gridSpacing / MAP_SCALE));

    for (let i = -1; i <= MAP_SIZE / (gridSpacing / MAP_SCALE) + 1; i++) {
      const gx = i * (gridSpacing / MAP_SCALE) - offsetX + MAP_SIZE / 2;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, MAP_SIZE);
      ctx.stroke();
    }
    for (let i = -1; i <= MAP_SIZE / (gridSpacing / MAP_SCALE) + 1; i++) {
      const gz = i * (gridSpacing / MAP_SCALE) - offsetZ + MAP_SIZE / 2;
      ctx.beginPath();
      ctx.moveTo(0, gz);
      ctx.lineTo(MAP_SIZE, gz);
      ctx.stroke();
    }

    // Simple terrain visualization from height approximation
    const halfWorld = MAP_SIZE * MAP_SCALE / 2;
    for (let px = 0; px < MAP_SIZE; px += 4) {
      for (let py = 0; py < MAP_SIZE; py += 4) {
        const wx = cx + (px - MAP_SIZE / 2) * MAP_SCALE;
        const wz = cz + (py - MAP_SIZE / 2) * MAP_SCALE;

        // Simple noise-based coloring using deterministic hash
        const hash = Math.sin(wx * 0.01 + wz * 0.013) * 43758.5453;
        const h = hash - Math.floor(hash);

        // Color based on pseudo-height
        let r: number, g: number, b: number;
        if (h < 0.3) {
          // Low/water areas
          r = 45; g = 92; b = 138;
        } else if (h < 0.45) {
          // Beach/sand
          r = 180; g = 160; b = 110;
        } else if (h < 0.7) {
          // Grass/forest
          r = 58 + (h * 20) | 0;
          g = 90 + (h * 30) | 0;
          b = 39;
        } else if (h < 0.85) {
          // Mountain/stone
          r = 107; g = 123; b = 141;
        } else {
          // Snow peaks
          r = 220; g = 225; b = 230;
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, 4, 4);
      }
    }

    // Compass lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(MAP_SIZE / 2, 0);
    ctx.lineTo(MAP_SIZE / 2, MAP_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, MAP_SIZE / 2);
    ctx.lineTo(MAP_SIZE, MAP_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cardinal direction labels
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('N', MAP_SIZE / 2, 14);
    ctx.fillText('S', MAP_SIZE / 2, MAP_SIZE - 6);
    ctx.fillText('W', 10, MAP_SIZE / 2 + 4);
    ctx.fillText('E', MAP_SIZE - 10, MAP_SIZE / 2 + 4);

    // Player dot (center)
    ctx.beginPath();
    ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player glow
    ctx.beginPath();
    ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(231,76,60,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [position.x, position.z]);

  useEffect(() => {
    if (mapOpen) {
      drawMap();
    }
  }, [mapOpen, drawMap]);

  if (!mapOpen) return null;

  return (
    <div className="panel-backdrop" onClick={toggleMap}>
      <div className="panel map-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel__header">
          <span className="panel__title">Map</span>
          <button className="panel__close" onClick={toggleMap}>✕</button>
        </div>

        <div className="map-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={MAP_SIZE}
            height={MAP_SIZE}
            style={{ width: MAP_SIZE, height: MAP_SIZE, imageRendering: 'pixelated' }}
          />

          <div className="map-coords">
            {Math.round(position.x)}, {Math.round(position.y)}, {Math.round(position.z)}
          </div>
        </div>
      </div>
    </div>
  );
};
