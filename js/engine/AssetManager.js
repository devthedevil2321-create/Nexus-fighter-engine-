/**
 * AssetManager.js
 * Parses GLB/GLTF, textures, and audio; manages IndexedDB local storage.
 */

import * as THREE from '../../lib/three.module.js';
import { GLTFLoader } from '../../lib/GLTFLoader.js';

export class AssetManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.assets = {
      models: new Map(),
      animations: new Map(),
      audio: new Map(),
      textures: new Map()
    };
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NexusFighterDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('binaryAssets')) {
          db.createObjectStore('binaryAssets', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.warn('IndexedDB failed to open, falling back to in-memory', e);
        resolve(null);
      };
    });
  }

  async parseFile(file) {
    const filename = file.name;
    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'glb' || ext === 'gltf') {
      return this.loadGLTF(file);
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return this.loadAudio(file);
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      return this.loadTexture(file);
    } else {
      throw new Error(`Unsupported file type: .${ext}`);
    }
  }

  async loadGLTF(file) {
    const arrayBuffer = await file.arrayBuffer();
    return new Promise((resolve, reject) => {
      this.loader.parse(
        arrayBuffer,
        '',
        (gltf) => {
          const modelData = {
            id: 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            size: file.size,
            gltf: gltf,
            scene: gltf.scene,
            animations: gltf.animations || [],
            arrayBuffer: arrayBuffer
          };

          this.assets.models.set(modelData.id, modelData);
          resolve(modelData);
        },
        (err) => reject(err)
      );
    });
  }

  async loadAudio(file) {
    const arrayBuffer = await file.arrayBuffer();
    const blobUrl = URL.createObjectURL(file);
    const audioData = {
      id: 'audio_' + Date.now(),
      name: file.name,
      blobUrl,
      arrayBuffer
    };
    this.assets.audio.set(audioData.id, audioData);
    return audioData;
  }

  async loadTexture(file) {
    const blobUrl = URL.createObjectURL(file);
    const texture = new THREE.TextureLoader().load(blobUrl);
    const texData = {
      id: 'tex_' + Date.now(),
      name: file.name,
      texture,
      blobUrl
    };
    this.assets.textures.set(texData.id, texData);
    return texData;
  }

  async saveBinaryAsset(id, arrayBuffer) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('binaryAssets', 'readwrite');
      const store = tx.objectStore('binaryAssets');
      store.put({ id, arrayBuffer });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
  }

  async getBinaryAsset(id) {
    if (!this.db) return null;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('binaryAssets', 'readonly');
      const store = tx.objectStore('binaryAssets');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.arrayBuffer : null);
      req.onerror = (e) => reject(e);
    });
  }
}
