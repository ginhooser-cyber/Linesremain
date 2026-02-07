// ─── Game Canvas ───
// Wires up the full game session: Engine, ChunkManager, Player Controller,
// Particle System, Animation System, and Camera.

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Engine } from '../../engine/Engine';
import { CameraController } from '../../engine/Camera';
import { InputManager } from '../../engine/InputManager';
import { ParticleSystem } from '../../engine/ParticleSystem';
import { AudioManager } from '../../engine/AudioManager';
import { ChunkManager } from '../../world/ChunkManager';
import { PlayerRenderer } from '../../entities/PlayerRenderer';
import { LocalPlayerController } from '../../entities/LocalPlayerController';
import { AnimationSystem } from '../../systems/AnimationSystem';
import { BlockInteraction } from '../../systems/BlockInteraction';
import { BuildingPreview } from '../../entities/BuildingPreview';
import { generateSpriteSheet } from '../../assets/SpriteGenerator';
import { useUIStore } from '../../stores/useUIStore';
import { useChatStore } from '../../stores/useChatStore';
import { socketClient } from '../../network/SocketClient';
import { SEA_LEVEL, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from '@shared/constants/game';
import { BuildingPieceType, BuildingTier } from '@shared/types/buildings';
import { ClientMessage } from '@shared/types/network';
import { setOnBlockChanged } from '../../network/MessageHandler';
import { HUD } from '../hud/HUD';
import { InventoryPanel } from '../panels/InventoryPanel';
import { CraftingPanel } from '../panels/CraftingPanel';
import { BuildingPanel } from '../panels/BuildingPanel';
import { MapPanel } from '../panels/MapPanel';
import { SettingsPanel } from '../panels/SettingsPanel';

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
  const buildingPreviewRef = useRef<BuildingPreview | null>(null);
  const chunkManagerRef = useRef<ChunkManager | null>(null);
  const playerControllerRef = useRef<LocalPlayerController | null>(null);
  const setCursorLocked = useUIStore((s) => s.setCursorLocked);
  const toggleInventory = useUIStore((s) => s.toggleInventory);
  const toggleCrafting = useUIStore((s) => s.toggleCrafting);
  const toggleMap = useUIStore((s) => s.toggleMap);
  const toggleBuildingMode = useUIStore((s) => s.toggleBuildingMode);
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const closeAll = useUIStore((s) => s.closeAll);

  // Building panel callbacks
  const handleSelectPiece = useCallback((pieceType: BuildingPieceType, tier: BuildingTier) => {
    buildingPreviewRef.current?.activate(pieceType, tier);
  }, []);

  const handleCancelPreview = useCallback(() => {
    buildingPreviewRef.current?.deactivate();
  }, []);

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

    // Wire server block updates to the chunk manager
    setOnBlockChanged((wx, wy, wz, bt) => chunkManager.onBlockChanged(wx, wy, wz, bt));

    // ── Particle System ──
    const particleSystem = new ParticleSystem(scene);

    // ── Animation System ──
    const animationSystem = new AnimationSystem();

    // ── Block Interaction System ──
    const blockInteraction = new BlockInteraction(scene, camera, chunkManager, particleSystem);

    // ── Building Preview ──
    const buildingPreview = new BuildingPreview(scene, camera);
    buildingPreviewRef.current = buildingPreview;
    chunkManagerRef.current = chunkManager;

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
    playerControllerRef.current = playerController;

    // ── Generate initial terrain ──
    chunkManager.generateLocalTestChunks(16, 16, 4);

    // Spawn player ON TOP of the terrain surface
    const spawnX = 16;
    const spawnZ = 16;
    const spawnCX = Math.floor(spawnX / CHUNK_SIZE_X);
    const spawnCZ = Math.floor(spawnZ / CHUNK_SIZE_Z);
    const localX = ((spawnX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const localZ = ((spawnZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    const spawnChunkData = chunkManager.getChunkData(spawnCX, spawnCZ);

    let spawnY = SEA_LEVEL + 10; // fallback
    if (spawnChunkData) {
      for (let y = CHUNK_SIZE_Y - 1; y >= 0; y--) {
        const idx = localX + localZ * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
        if (spawnChunkData[idx] !== 0) {
          spawnY = y + 1;
          break;
        }
      }
    }
    playerController.setPosition(spawnX, spawnY + 0.1, spawnZ);

    // ── Pointer Lock tracking ──
    const handleLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      setCursorLocked(locked);
    };
    document.addEventListener('pointerlockchange', handleLockChange);

    // ── UI keybinds ──
    const handleUIKeys = (e: KeyboardEvent) => {
      // Don't process game keybinds when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      // Don't process letter keys when chat is open
      const chatOpen = useChatStore.getState().isOpen;

      if (e.key === 'Tab') {
        e.preventDefault();
        toggleInventory();
      } else if (e.key === 'Escape') {
        closeAll();
      } else if (e.key === 'F1') {
        e.preventDefault();
        toggleSettings();
      } else if (!chatOpen) {
        // Only process letter keybinds when chat is closed
        if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
          toggleCrafting();
        } else if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
          toggleMap();
        } else if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey) {
          toggleBuildingMode();
        } else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
          buildingPreview.rotate();
        }
      }
    };
    window.addEventListener('keydown', handleUIKeys);

    // ── Pointer Lock on Click ──
    const audio = AudioManager.getInstance();
    const handleClick = () => {
      if (!input.isPointerLocked()) {
        input.requestPointerLock(canvas);
      } else if (buildingPreview.active && buildingPreview.isValid) {
        // Place building piece
        const data = buildingPreview.getPlacementData();
        if (data) {
          socketClient.emit(ClientMessage.BuildPlace, {
            pieceType: data.pieceType,
            tier: data.tier,
            position: data.position,
            rotation: data.rotation,
          });
          AudioManager.getInstance().play('blockPlace');
        }
      }
      // Initialize audio on first user gesture
      audio.init();
    };
    canvas.addEventListener('click', handleClick);

    // Prevent context menu so right-click can place blocks
    const handleContextMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', handleContextMenu);

    // ── Game Loop ──
    engine.onUpdate((dt) => {
      // Player update
      playerController.update(dt);

      // Update chunks around player
      const pos = playerController.getPosition();
      chunkManager.update(pos.x, pos.z);

      // Animation system
      animationSystem.update(dt);

      // Block interaction (raycast, breaking, placing)
      blockInteraction.update(dt);

      // Building preview (ghost mesh follows camera)
      const playerVec = new THREE.Vector3(pos.x, pos.y, pos.z);
      buildingPreview.update(chunkManager.getChunkMeshes(), playerVec);

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
      document.removeEventListener('pointerlockchange', handleLockChange);
      window.removeEventListener('keydown', handleUIKeys);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      cameraController.detach();
      playerRenderer.removeFromScene(scene);
      buildingPreview.dispose();
      blockInteraction.dispose();
      animationSystem.dispose();
      particleSystem.dispose();
      chunkManager.dispose();
      audio.dispose();
      engine.dispose();
      input.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Full game HUD */}
      <HUD />

      {/* Panels */}
      <InventoryPanel />
      <CraftingPanel />
      <BuildingPanel onSelectPiece={handleSelectPiece} onCancelPreview={handleCancelPreview} />
      <MapPanel />
      <SettingsPanel />

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