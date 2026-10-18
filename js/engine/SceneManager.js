/**
 * SceneManager.js
 * 3D Scene, Lighting, Camera, Viewport, Arena Environment
 */

import * as THREE from '../../lib/three.module.js';
import { OrbitControls } from '../../lib/OrbitControls.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;

    const width = canvas.parentElement.clientWidth || 800;
    const height = canvas.parentElement.clientHeight || 600;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f15); // Dark anime background
    this.scene.fog = new THREE.FogExp2(0x0f0f15, 0.015);

    // Main Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      500
    );
    this.camera.position.set(0, 4, 10);

    // Controls for Editor
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.target.set(0, 1.5, 0);

    // Battle Camera Tracking
    this.cameraHeight = 3.5;
    this.cameraDistance = 8.0;
    this.cameraFov = 50;

    // Default Lighting
    this.setupLighting();

    // Default Arena
    this.arenaGroup = new THREE.Group();
    this.scene.add(this.arenaGroup);
    this.setupDefaultArena();

    // Window Resize handling
    window.addEventListener('resize', this.onWindowResize.bind(this));
    setTimeout(() => this.onWindowResize(), 100);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    this.dirLight.position.set(5, 12, 7);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 30;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Crimson Rim / Accent Light for Anime Aesthetic
    this.rimLight = new THREE.DirectionalLight(0xff2244, 1.2);
    this.rimLight.position.set(-8, 5, -8);
    this.scene.add(this.rimLight);
  }

  setupDefaultArena() {
    // Floor Mesh
    const floorGeo = new THREE.CylinderGeometry(15, 16, 0.5, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      roughness: 0.4,
      metalness: 0.6
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    this.arenaGroup.add(floor);

    // Glowing Arena Outer Ring
    const ringGeo = new THREE.RingGeometry(14.8, 15.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.arenaGroup.add(ring);

    // Grid Overlay
    const grid = new THREE.GridHelper(30, 30, 0xff2244, 0x333344);
    grid.position.y = 0.02;
    this.arenaGroup.add(grid);
  }

  applyQualitySettings(quality) {
    if (quality === 'LOW') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'MEDIUM') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.shadow.mapSize.set(1024, 1024);
    } else if (quality === 'HIGH') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.shadow.mapSize.set(2048, 2048);
    }
  }

  onModeChange(mode) {
    if (mode === 'BATTLE') {
      this.orbitControls.enabled = false;
    } else {
      this.orbitControls.enabled = true;
    }
  }

  update(dt, mode) {
    if (mode === 'BATTLE') {
      this.updateBattleCamera();
    } else {
      this.orbitControls.update();
    }
  }

  updateBattleCamera() {
    if (!this.playerMesh || !this.enemyMesh) return;

    const pPos = this.playerMesh.position;
    const ePos = this.enemyMesh.position;

    // Midpoint between fighters
    const midX = (pPos.x + ePos.x) / 2;
    const midY = (pPos.y + ePos.y) / 2 + 1.2;
    const midZ = (pPos.z + ePos.z) / 2;

    const dist = Math.hypot(pPos.x - ePos.x, pPos.z - ePos.z);
    const clampedDist = Math.max(5.0, Math.min(dist * 0.95 + 3.5, 14.0));

    // Smooth camera target
    const targetCamX = midX;
    const targetCamY = midY + this.cameraHeight * 0.8;
    const targetCamZ = midZ + clampedDist;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1;

    this.camera.lookAt(midX, midY, midZ);
  }

  setFighterRefs(playerMesh, enemyMesh) {
    this.playerMesh = playerMesh;
    this.enemyMesh = enemyMesh;
  }

  onWindowResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
