/**
 * HitboxSystem.js
 * 3D Hitbox and Hurtbox management, skeletal attachment, and wireframe debug visualizer.
 */

import * as THREE from '../../lib/three.module.js';

export class HitboxSystem {
  constructor(scene) {
    this.scene = scene;
    this.showDebug = true;
    this.debugGroup = new THREE.Group();
    this.scene.add(this.debugGroup);

    this.registeredFighters = [];
  }

  registerFighter(fighterController) {
    if (!this.registeredFighters.includes(fighterController)) {
      this.registeredFighters.push(fighterController);
    }
  }

  unregisterFighter(fighterController) {
    const idx = this.registeredFighters.indexOf(fighterController);
    if (idx !== -1) {
      this.registeredFighters.splice(idx, 1);
    }
  }

  setShowDebug(enabled) {
    this.showDebug = enabled;
    this.debugGroup.visible = enabled;
  }

  update(dt) {
    // Clear previous debug meshes
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    if (!this.showDebug) return;

    for (const fighter of this.registeredFighters) {
      if (!fighter || !fighter.isAlive) continue;

      // Render Hurtboxes (Blue for Player, Orange for Enemy)
      const hurtboxColor = fighter.isPlayer ? 0x00aaff : 0xffaa00;
      for (const hurtbox of fighter.getHurtboxes()) {
        this.renderDebugBox(hurtbox, hurtboxColor, 0.3);
      }

      // Render Active Attack Hitboxes (Red)
      for (const hitbox of fighter.getActiveHitboxes()) {
        this.renderDebugBox(hitbox, 0xff0044, 0.6);
      }
    }
  }

  renderDebugBox(boxDef, colorHex, opacity) {
    const geo = new THREE.BoxGeometry(
      boxDef.size.x,
      boxDef.size.y,
      boxDef.size.z
    );
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true,
      transparent: true,
      opacity: opacity
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(boxDef.worldPosition);
    mesh.rotation.copy(boxDef.worldRotation);
    this.debugGroup.add(mesh);
  }

  checkCollisions(attacker, defender) {
    if (!attacker || !defender || !attacker.isAlive || !defender.isAlive) return [];

    const activeHitboxes = attacker.getActiveHitboxes();
    const activeHurtboxes = defender.getHurtboxes();

    const hits = [];

    for (const hitbox of activeHitboxes) {
      for (const hurtbox of activeHurtboxes) {
        if (this.intersects3D(hitbox, hurtbox)) {
          hits.push({
            hitbox,
            hurtbox,
            attacker,
            defender
          });
        }
      }
    }

    return hits;
  }

  intersects3D(boxA, boxB) {
    const posA = boxA.worldPosition;
    const halfA = boxA.size.clone().multiplyScalar(0.5);

    const posB = boxB.worldPosition;
    const halfB = boxB.size.clone().multiplyScalar(0.5);

    return (
      Math.abs(posA.x - posB.x) <= (halfA.x + halfB.x) &&
      Math.abs(posA.y - posB.y) <= (halfA.y + halfB.y) &&
      Math.abs(posA.z - posB.z) <= (halfA.z + halfB.z)
    );
  }
}
