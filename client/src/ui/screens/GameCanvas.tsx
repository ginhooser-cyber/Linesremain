// ─── Game Canvas ───
// Wires up the full game session: Engine, ChunkManager, Player Controller,
// Particle System, Animation System, Camera, Sky, Water, and FPS Counter.

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Engine } from '../../engine/Engine';
import { CameraController } from '../../engine/Camera';
import { InputManager } from '../../engine/InputManager';
import { ParticleSystem } from '../../engine/ParticleSystem';
import { AudioManager } from '../../engine/AudioManager';
import { ChunkManager } from '../../world/ChunkManager';
import { SkyRenderer } from '../../world/SkyRenderer';
import { WaterRenderer } from '../../world/WaterRenderer';
import { ClientTerrainGenerator } from '../../world/ClientTerrainGenerator';
import { PlayerRenderer } from '../../entities/PlayerRenderer';
import { LocalPlayerController } from '../../entities/LocalPlayerController';
import { AnimationSystem } from '../../systems/AnimationSystem';
import { BlockInteraction } from '../../systems/BlockInteraction';
import { BuildingPreview } from '../../entities/BuildingPreview';
import { generateSpriteSheet } from '../../assets/SpriteGenerator';
import { useUIStore } from '../../stores/useUIStore';
import { useChatStore } from '../../stores/useChatStore';
import { socketClient } from '../../network/SocketClient';
import { SEA_LEVEL, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, DAY_LENGTH_SECONDS } from '@shared/constants/game';
import { BuildingPieceType, BuildingTier } from '@shared/types/buildings';
import { ClientMessage } from '@shared/types/network';
import { setOnBlockChanged } from '../../network/MessageHandler';
import { HUD } from '../hud/HUD';
import { FPSCounter } from '../hud/FPSCounter';
import { InventoryPanel } from '../panels/InventoryPanel';
import { CraftingPanel } from '../panels/CraftingPanel';
import { BuildingPanel } from '../panels/BuildingPanel';
import { MapPanel } from '../panels/MapPanel';
import { SettingsPanel } from '../panels/SettingsPanel';

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

  // Stable callback for FPS counter
  const getRenderer = useCallback(() => engineRef.current?.getRenderer() ?? null, []);

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

    // ── Sky Renderer (replaces manual lighting — handles sky dome, sun/moon, ambient, fog) ──
    const skyRenderer = new SkyRenderer(scene);
    skyRenderer.update(0.35); // Start at morning

    // ── Terrain Generator (full biome variety) ──
    const terrainGenerator = new ClientTerrainGenerator(42);

    // ── Chunk Manager (voxel terrain) ──
    const chunkManager = new ChunkManager(scene, 4);

    // Set up local chunk generation with the full terrain generator
    chunkManager.setChunkRequestCallback((cx, cz) => {
      const data = terrainGenerator.generateChunk(cx, cz);
      chunkManager.onChunkDataReceived(cx, cz, data);
    });

    // Wire server block updates to the chunk manager
    setOnBlockChanged((wx, wy, wz, bt) => chunkManager.onBlockChanged(wx, wy, wz, bt));

    // ── Water Renderer (animated shader water planes) ──
    const waterRenderer = new WaterRenderer(scene);

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

    // ── Generate spawn chunk so we can find surface height ──
    const spawnX = 16;
    const spawnZ = 16;
    const spawnCX = Math.floor(spawnX / CHUNK_SIZE_X);
    const spawnCZ = Math.floor(spawnZ / CHUNK_SIZE_Z);
    const spawnChunkData = terrainGenerator.generateChunk(spawnCX, spawnCZ);
    chunkManager.onChunkDataReceived(spawnCX, spawnCZ, spawnChunkData);
    const localX = ((spawnX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const localZ = ((spawnZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    let spawnY = SEA_LEVEL + 10; // fallback
    if (spawnChunkData) {
      for (let y = CHUNK_SIZE_Y - 1; y >= 0; y--) {
        const idx = localX + localZ * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
        const block = spawnChunkData[idx]!;
        // Skip air and water — find actual solid ground
        if (block !== 0 && block !== 14) {
          spawnY = y + 1;
          break;
        }
      }
    }
    playerController.setPosition(spawnX, spawnY + 0.1, spawnZ);

    // Sync water planes with initially loaded chunks
    waterRenderer.syncWithChunks(chunkManager.getLoadedChunkKeys());

    // ── Day/night cycle state ──
    let worldTime = 0.35; // Start at morning

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

      // Sync water planes with loaded chunks
      waterRenderer.syncWithChunks(chunkManager.getLoadedChunkKeys());
      waterRenderer.update(dt);

      // Day/night cycle (accelerated: 1 game day = DAY_LENGTH_SECONDS real seconds)
      worldTime = (worldTime + dt / DAY_LENGTH_SECONDS) % 1;
      skyRenderer.update(worldTime);
      skyRenderer.followCamera(camera);

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
      waterRenderer.dispose();
      skyRenderer.dispose();
      chunkManager.dispose();
      audio.dispose();
      engine.dispose();
      input.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Debug overlay */}
      <FPSCounter getRenderer={getRenderer} />

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
