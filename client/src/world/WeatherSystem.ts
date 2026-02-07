// ─── Weather System ───
// Manages rain particles, cloud billboards, and lighting/fog adjustments
// based on current weather state.

import * as THREE from 'three';

// ─── Types ───

export type WeatherType = 'clear' | 'cloudy' | 'rain';

interface RainDrop {
  mesh: THREE.Line;
  velocity: THREE.Vector3;
  life: number;
}

interface Cloud {
  mesh: THREE.Sprite;
  driftSpeed: number;
  driftDir: THREE.Vector3;
}

// ─── Constants ───

const RAIN_COUNT = 200;
const RAIN_AREA = 60; // spread around player
const RAIN_HEIGHT = 30;
const RAIN_SPEED = 25;
const RAIN_LENGTH = 1.2;
const RAIN_ANGLE = 0.15; // slight wind angle

const CLOUD_COUNT = 8;
const CLOUD_Y_MIN = 55;
const CLOUD_Y_MAX = 60;
const CLOUD_SPREAD = 80;
const CLOUD_DRIFT_SPEED_MIN = 0.5;
const CLOUD_DRIFT_SPEED_MAX = 1.5;

// ─── Weather System ───

export class WeatherSystem {
  private scene: THREE.Scene;
  private weather: WeatherType = 'clear';

  // Rain
  private rainDrops: RainDrop[] = [];
  private rainGroup: THREE.Group;
  private rainMaterial: THREE.LineBasicMaterial;

  // Clouds
  private clouds: Cloud[] = [];
  private cloudGroup: THREE.Group;
  private cloudMaterial: THREE.SpriteMaterial;
  private cloudTexture: THREE.CanvasTexture;

  // Lighting overrides
  private ambientLight: THREE.AmbientLight | null = null;
  private originalAmbientIntensity = 0.4;

  // Fog overrides
  private fog: THREE.Fog | null = null;
  private originalFogNear = 80;
  private originalFogFar = 300;

  // Player tracking
  private playerPos = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // ── Rain setup ──
    this.rainGroup = new THREE.Group();
    this.rainGroup.visible = false;
    scene.add(this.rainGroup);

    this.rainMaterial = new THREE.LineBasicMaterial({
      color: 0x8899bb,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    // Pre-create rain drops
    for (let i = 0; i < RAIN_COUNT; i++) {
      this.rainDrops.push(this.createRainDrop());
    }

    // ── Cloud setup ──
    this.cloudGroup = new THREE.Group();
    this.cloudGroup.visible = false;
    scene.add(this.cloudGroup);

    this.cloudTexture = this.generateCloudTexture();
    this.cloudMaterial = new THREE.SpriteMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      fog: true,
    });

    for (let i = 0; i < CLOUD_COUNT; i++) {
      this.clouds.push(this.createCloud());
    }
  }

  // ─── Cloud Texture Generation ───

  private generateCloudTexture(): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Soft radial gradient cloud
    const cx = size / 2;
    const cy = size / 2;

    // Draw several overlapping circles for cloud shape
    const blobs = [
      { x: cx, y: cy, r: 40 },
      { x: cx - 25, y: cy + 5, r: 30 },
      { x: cx + 25, y: cy + 5, r: 30 },
      { x: cx - 10, y: cy - 10, r: 35 },
      { x: cx + 10, y: cy - 10, r: 35 },
    ];

    for (const blob of blobs) {
      const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
      grad.addColorStop(0, 'rgba(220, 220, 230, 0.8)');
      grad.addColorStop(0.5, 'rgba(200, 200, 210, 0.4)');
      grad.addColorStop(1, 'rgba(180, 180, 190, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // ─── Rain Drop Creation ───

  private createRainDrop(): RainDrop {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 points × 3 components
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mesh = new THREE.Line(geometry, this.rainMaterial);
    this.rainGroup.add(mesh);

    const drop: RainDrop = {
      mesh,
      velocity: new THREE.Vector3(RAIN_ANGLE * RAIN_SPEED, -RAIN_SPEED, 0),
      life: 0,
    };

    this.resetRainDrop(drop);
    return drop;
  }

  private resetRainDrop(drop: RainDrop): void {
    const x = this.playerPos.x + (Math.random() - 0.5) * RAIN_AREA;
    const y = this.playerPos.y + RAIN_HEIGHT * (0.5 + Math.random() * 0.5);
    const z = this.playerPos.z + (Math.random() - 0.5) * RAIN_AREA;

    const positions = (drop.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    // Start point
    positions[0] = x;
    positions[1] = y;
    positions[2] = z;
    // End point (streak direction)
    positions[3] = x + drop.velocity.x * (RAIN_LENGTH / RAIN_SPEED);
    positions[4] = y + drop.velocity.y * (RAIN_LENGTH / RAIN_SPEED);
    positions[5] = z + drop.velocity.z * (RAIN_LENGTH / RAIN_SPEED);

    (drop.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

    drop.life = Math.random() * 2; // stagger start times
  }

  // ─── Cloud Creation ───

  private createCloud(): Cloud {
    const sprite = new THREE.Sprite(this.cloudMaterial.clone());
    const scale = 15 + Math.random() * 20;
    sprite.scale.set(scale, scale * 0.4, 1);

    const x = this.playerPos.x + (Math.random() - 0.5) * CLOUD_SPREAD * 2;
    const y = CLOUD_Y_MIN + Math.random() * (CLOUD_Y_MAX - CLOUD_Y_MIN);
    const z = this.playerPos.z + (Math.random() - 0.5) * CLOUD_SPREAD * 2;
    sprite.position.set(x, y, z);

    // Vary opacity per cloud
    (sprite.material as THREE.SpriteMaterial).opacity = 0.3 + Math.random() * 0.4;

    this.cloudGroup.add(sprite);

    const driftSpeed = CLOUD_DRIFT_SPEED_MIN + Math.random() * (CLOUD_DRIFT_SPEED_MAX - CLOUD_DRIFT_SPEED_MIN);
    const windAngle = Math.random() * Math.PI * 0.3; // slight variation in wind direction

    return {
      mesh: sprite,
      driftSpeed,
      driftDir: new THREE.Vector3(Math.cos(windAngle), 0, Math.sin(windAngle)).normalize(),
    };
  }

  // ─── Weather Control ───

  setWeather(weather: WeatherType): void {
    if (this.weather === weather) return;
    this.weather = weather;

    const showRain = weather === 'rain';
    const showClouds = weather === 'rain' || weather === 'cloudy';

    this.rainGroup.visible = showRain;
    this.cloudGroup.visible = showClouds;

    // Adjust lighting
    if (this.ambientLight) {
      if (weather === 'rain') {
        this.ambientLight.intensity = this.originalAmbientIntensity * 0.7;
      } else {
        this.ambientLight.intensity = this.originalAmbientIntensity;
      }
    }

    // Adjust fog
    if (this.fog) {
      if (weather === 'rain') {
        this.fog.near = 30;
        this.fog.far = 100;
        this.fog.color.set(0x6688aa);
      } else {
        this.fog.near = this.originalFogNear;
        this.fog.far = this.originalFogFar;
        this.fog.color.set(0x87ceeb);
      }
    }
  }

  getWeather(): WeatherType {
    return this.weather;
  }

  /** Register the scene's ambient light so weather can adjust it */
  setAmbientLight(light: THREE.AmbientLight): void {
    this.ambientLight = light;
    this.originalAmbientIntensity = light.intensity;
  }

  /** Register the scene's fog so weather can adjust it */
  setFog(fog: THREE.Fog): void {
    this.fog = fog;
    this.originalFogNear = fog.near;
    this.originalFogFar = fog.far;
  }

  // ─── Update ───

  update(dt: number, playerPosition: THREE.Vector3): void {
    this.playerPos.copy(playerPosition);

    if (this.weather === 'rain') {
      this.updateRain(dt);
    }

    if (this.weather === 'rain' || this.weather === 'cloudy') {
      this.updateClouds(dt);
    }
  }

  private updateRain(dt: number): void {
    for (const drop of this.rainDrops) {
      drop.life -= dt;

      const positions = (drop.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;

      // Move drop
      const dx = drop.velocity.x * dt;
      const dy = drop.velocity.y * dt;
      const dz = drop.velocity.z * dt;

      positions[0]! += dx;
      positions[1]! += dy;
      positions[2]! += dz;
      positions[3]! += dx;
      positions[4]! += dy;
      positions[5]! += dz;

      (drop.mesh.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

      // Reset if below ground or too far from player
      const dropY = positions[1]!;
      const distX = Math.abs(positions[0]! - this.playerPos.x);
      const distZ = Math.abs(positions[2]! - this.playerPos.z);

      if (dropY < this.playerPos.y - 5 || distX > RAIN_AREA || distZ > RAIN_AREA || drop.life <= 0) {
        this.resetRainDrop(drop);
      }
    }
  }

  private updateClouds(dt: number): void {
    for (const cloud of this.clouds) {
      cloud.mesh.position.addScaledVector(cloud.driftDir, cloud.driftSpeed * dt);

      // Wrap clouds around player
      const dx = cloud.mesh.position.x - this.playerPos.x;
      const dz = cloud.mesh.position.z - this.playerPos.z;

      if (Math.abs(dx) > CLOUD_SPREAD) {
        cloud.mesh.position.x = this.playerPos.x - Math.sign(dx) * CLOUD_SPREAD;
      }
      if (Math.abs(dz) > CLOUD_SPREAD) {
        cloud.mesh.position.z = this.playerPos.z - Math.sign(dz) * CLOUD_SPREAD;
      }
    }
  }

  // ─── Cleanup ───

  dispose(): void {
    // Rain cleanup
    for (const drop of this.rainDrops) {
      drop.mesh.geometry.dispose();
      this.rainGroup.remove(drop.mesh);
    }
    this.rainDrops.length = 0;
    this.rainMaterial.dispose();
    this.scene.remove(this.rainGroup);

    // Cloud cleanup
    for (const cloud of this.clouds) {
      (cloud.mesh.material as THREE.SpriteMaterial).dispose();
      this.cloudGroup.remove(cloud.mesh);
    }
    this.clouds.length = 0;
    this.cloudMaterial.dispose();
    this.cloudTexture.dispose();
    this.scene.remove(this.cloudGroup);
  }
}