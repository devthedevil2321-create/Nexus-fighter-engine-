/**
 * AnimationController.js
 * Controls Three.js AnimationMixer, detects embedded clips, handles smooth transitions,
 * and provides procedural fallback animations (procedural attacks, idle breathing, hit reactions)
 * when imported GLBs lack specific clips.
 */

import * as THREE from '../../lib/three.module.js';

export class AnimationController {
  constructor(mesh, embeddedClips = []) {
    this.mesh = mesh;
    this.mixer = new THREE.AnimationMixer(mesh);
    this.clips = new Map();
    this.currentAction = null;
    this.currentActionName = '';

    // Register embedded clips
    for (const clip of embeddedClips) {
      this.clips.set(clip.name, clip);
    }

    // Mapping from gameplay action names to clip names
    this.actionMappings = {
      idle: '',
      walk: '',
      run: '',
      jump: '',
      lightAttack: '',
      heavyAttack: '',
      specialAttack: '',
      comboAttack: '',
      block: '',
      dodge: '',
      hitReaction: '',
      defeat: ''
    };

    // Auto-detect matching clips by name keywords
    this.autoDetectMappings();
  }

  autoDetectMappings() {
    for (const [clipName] of this.clips) {
      const lower = clipName.toLowerCase();
      if (!this.actionMappings.idle && lower.includes('idle')) this.actionMappings.idle = clipName;
      if (!this.actionMappings.walk && (lower.includes('walk') || lower.includes('run'))) this.actionMappings.walk = clipName;
      if (!this.actionMappings.run && lower.includes('run')) this.actionMappings.run = clipName;
      if (!this.actionMappings.jump && lower.includes('jump')) this.actionMappings.jump = clipName;
      if (!this.actionMappings.lightAttack && (lower.includes('attack') || lower.includes('punch') || lower.includes('slash'))) this.actionMappings.lightAttack = clipName;
      if (!this.actionMappings.heavyAttack && lower.includes('heavy')) this.actionMappings.heavyAttack = clipName;
      if (!this.actionMappings.block && (lower.includes('block') || lower.includes('guard'))) this.actionMappings.block = clipName;
      if (!this.actionMappings.hitReaction && (lower.includes('hit') || lower.includes('damage') || lower.includes('react'))) this.actionMappings.hitReaction = clipName;
      if (!this.actionMappings.defeat && (lower.includes('death') || lower.includes('die') || lower.includes('defeat'))) this.actionMappings.defeat = clipName;
    }
  }

  playAction(actionKey, duration = 0.2) {
    const clipName = this.actionMappings[actionKey];
    if (clipName && this.clips.has(clipName)) {
      const clip = this.clips.get(clipName);
      const newAction = this.mixer.clipAction(clip);

      if (this.currentAction && this.currentAction !== newAction) {
        this.currentAction.fadeOut(duration);
      }

      newAction.reset().fadeIn(duration).play();
      this.currentAction = newAction;
      this.currentActionName = actionKey;
      return true;
    }

    // Fallback if clip is missing
    this.playProceduralFallback(actionKey);
    return false;
  }

  playProceduralFallback(actionKey) {
    this.proceduralState = actionKey;
    this.proceduralTimer = 0;
  }

  update(dt) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Procedural Fallback Animation Logic (Transforms mesh/limbs directly if clip absent)
    if (this.proceduralState) {
      this.proceduralTimer += dt;
      const t = this.proceduralTimer;

      if (this.proceduralState === 'lightAttack') {
        this.mesh.rotation.y += Math.sin(t * 30) * 0.2;
        this.mesh.position.z += Math.sin(t * 20) * 0.1;
        if (t > 0.3) this.proceduralState = null;
      } else if (this.proceduralState === 'heavyAttack') {
        this.mesh.rotation.x = Math.sin(t * 15) * 0.3;
        if (t > 0.5) {
          this.mesh.rotation.x = 0;
          this.proceduralState = null;
        }
      } else if (this.proceduralState === 'hitReaction') {
        this.mesh.rotation.x = -Math.sin(t * 25) * 0.25;
        if (t > 0.35) {
          this.mesh.rotation.x = 0;
          this.proceduralState = null;
        }
      } else if (this.proceduralState === 'idle') {
        this.mesh.position.y = Math.sin(t * 3) * 0.05;
      }
    }
  }
}
