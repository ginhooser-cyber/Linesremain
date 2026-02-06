// ─── Game Canvas ───
// Wires up the full game session: Engine, ChunkManager, Player Controller,
// Particle System, Animation System, and Camera.

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Engine } from '../../engine/Engine';
import { CameraController } from '../../engine/Camera';
import { InputManager } from '../../engine/InputManager';
import { ParticleSystem } from '../../engine/ParticleSystem';
import { ChunkManager } from '../../world/ChunkManager';
import { PlayerRenderer } from '../../entities/PlayerRenderer';
import { LocalPlayerController } from '../../entities/LocalPlayerController';
import { AnimationSystem } from '../../systems/AnimationSystem';
import { generateSpriteSheet } from '../../assets/SpriteGenerator';
import { useGameStore } from '../../stores/useGameStore';
import { SEA_LEVEL } from '@shared/constants/game';

// ─── Scene Setup Helpers ───

function createLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
  sunLight.position.set(50, 80, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -60;
  scene.add(sunLight);

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.3);
  scene.add(hemisphereLight);
}

// ─── Component ───

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Initialize Engine ──
    const engine = new Engine(canvas);
    engineRef.current = engine;

    const scene = engine.getScene();
    const camera = engine.getCamera();

    // ── Camera Controller ──
    const cameraController = new CameraController(camera);
    cameraController.attach(canvas);

    // ── Input Manager ──
    const input = InputManager.getInstance();

    // ── Lighting ──
    createLighting(scene);

    // ── Chunk Manager (voxel terrain) ──
    const chunkManager = new ChunkManager(scene, 4);

    // Set up local chunk generation for offline/testing mode
    chunkManager.setChunkRequestCallback((cx, cz) => {
      // In offline mode, generate chunks locally
      const data = generateLocalChunk(cx, cz);
      chunkManager.onChunkDataReceived(cx, cz, data);
    });

    // ── Particle System ──
    const particleSystem = new ParticleSystem(scene);

    // ── Animation System ──
    const animationSystem = new AnimationSystem();

    // ── Player Sprite & Renderer ──
    const { canvas: spriteCanvas, config: spriteConfig } = generateSpriteSheet('#ffffff');
    const playerRenderer = new PlayerRenderer(spriteCanvas, spriteConfig);
    playerRenderer.addToScene(scene);
    animationSystem.register('local', playerRenderer);

    // ── Player Controller ──
    const playerController = new LocalPlayerController(
      input,
      cameraController,
      playerRenderer,
      chunkManager,
      camera,
    );

    // Spawn player above sea level
    const spawnY = SEA_LEVEL + 10;
    playerController.setPosition(16, spawnY, 16);

    // ── Generate initial terrain ──
    chunkManager.generateLocalTestChunks(16, 16, 4);

    // ── Pointer Lock on Click ──
    const handleClick = () => {
      if (!input.isPointerLocked()) {
        input.requestPointerLock(canvas);
      } else {
        // Left-click action: emit particles at crosshair target
        particleSystem.emit({
          position: playerController.getPosition().add(new THREE.Vector3(0, 1, 0)),
          count: 5,
          color: new THREE.Color(0xf0a500),
          speed: 2.0,
          spread: 0.5,
          lifetime: 0.6,
          size: 0.12,
        });
      }
    };
    canvas.addEventListener('click', handleClick);

    // ── Game Loop ──
    engine.onUpdate((dt) => {
      // Player update
      playerController.update(dt);

      // Update chunks around player
      const pos = playerController.getPosition();
      chunkManager.update(pos.x, pos.z);

      // Animation system
      animationSystem.update(dt);

      // Particles
      particleSystem.update(dt);

      // Camera
      cameraController.update(dt);

      // Reset input frame state
      input.resetFrameState();
    });

    engine.onRender((_interpolation) => {
      // Render interpolation can be used for smooth visuals between fixed updates
    });

    // ── Start ──
    engine.start();

    // ── Cleanup ──
    return () => {
      canvas.removeEventListener('click', handleClick);
      cameraController.detach();
      playerRenderer.removeFromScene(scene);
      animationSystem.dispose();
      particleSystem.dispose();
      chunkManager.dispose();
      engine.dispose();
      input.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* HUD Overlay */}
      <div style={styles.hud}>
        <p style={styles.hudText}>
          Click to lock mouse · WASD to move · Space to jump · Shift to sprint · Right-click drag to orbit
        </p>
      </div>

      {/* Crosshair */}
      <div style={styles.crosshair}>
        <div style={styles.crosshairDot} />
      </div>

      {/* Death overlay */}
      {screen === 'dead' && (
        <div style={styles.deathOverlay}>
          <h2 style={styles.deathText}>YOU DIED</h2>
          <p style={styles.deathSubtext}>Press R to respawn</p>
        </div>
      )}
    </div>
  );
};

// ─── Local Chunk Generation Helper ───

function generateLocalChunk(cx: number, cz: number): Uint8Array {
  const SX = 32;
  const SY = 64;
  const SZ = 32;
  const data = new Uint8Array(SX * SY * SZ);
  const seaLevel = 32;

  for (let x = 0; x < SX; x++) {
    for (let z = 0; z < SZ; z++) {
      const worldX = cx * SX + x;
      const worldZ = cz * SZ + z;

      const height = Math.floor(
        seaLevel +
        Math.sin(worldX * 0.05) * 4 +
        Math.cos(worldZ * 0.07) * 3 +
        Math.sin((worldX + worldZ) * 0.03) * 2,
      );

      for (let y = 0; y < SY; y++) {
        const idx = x + z * SX + y * SX * SZ;
        if (y === 0) {
          data[idx] = 13; // Bedrock
        } else if (y < height - 4) {
          data[idx] = 3; // Stone
        } else if (y < height) {
          data[idx] = 1; // Dirt
        } else if (y === height) {
          data[idx] = 2; // Grass
        } else if (y <= seaLevel) {
          data[idx] = 14; // Water
        }
        // else Air (0, default)
      }
    }
  }

  return data;
}

// ─── Styles ───

const styles: Record<string, React.CSSProperties> = {
  hud: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  hudText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    fontFamily: 'Inter, system-ui, sans-serif',
    letterSpacing: '1px',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    margin: 0,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  crosshairDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.7)',
    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
  },
  deathOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(139, 0, 0, 0.4)',
    pointerEvents: 'none',
  },
  deathText: {
    color: '#FF4444',
    fontSize: '48px',
    fontWeight: 900,
    fontFamily: 'Inter, system-ui, sans-serif',
    letterSpacing: '8px',
    margin: 0,
  },
  deathSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '16px',
    fontFamily: 'Inter, system-ui, sans-serif',
    letterSpacing: '2px',
    marginTop: '16px',
  },
};