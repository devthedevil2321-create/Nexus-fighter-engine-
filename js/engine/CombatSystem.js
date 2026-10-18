/**
 * CombatSystem.js
 * Manages attack definitions, frame timing, damage calculations, hit registration, combos, hit-stop, and camera shake.
 */

import * as THREE from '../../lib/three.module.js';

export class CombatSystem {
  constructor(hitboxSystem, audioManager) {
    this.hitboxSystem = hitboxSystem;
    this.audioManager = audioManager;

    this.fighters = [];
    this.hitStopTimer = 0;
    this.cameraShakeTimer = 0;
    this.cameraShakeIntensity = 0;

    this.onDamageCallbacks = [];
    this.onComboCallbacks = [];
  }

  registerFighter(fighter) {
    if (!this.fighters.includes(fighter)) {
      this.fighters.push(fighter);
      this.hitboxSystem.registerFighter(fighter);
    }
  }

  unregisterFighter(fighter) {
    const idx = this.fighters.indexOf(fighter);
    if (idx !== -1) {
      this.fighters.splice(idx, 1);
      this.hitboxSystem.unregisterFighter(fighter);
    }
  }

  update(dt) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Freeze time during hit-stop effect
    }

    // Check collision pairs between fighters
    for (let i = 0; i < this.fighters.length; i++) {
      for (let j = 0; j < this.fighters.length; j++) {
        if (i === j) continue;
        const attacker = this.fighters[i];
        const defender = this.fighters[j];

        if (attacker.isAttacking && defender.canBeHit()) {
          const hits = this.hitboxSystem.checkCollisions(attacker, defender);
          if (hits.length > 0) {
            this.processHit(attacker, defender, hits[0].hitbox);
          }
        }
      }
    }
  }

  processHit(attacker, defender, hitbox) {
    const attackDef = attacker.currentAttackDef;
    if (!attackDef) return;

    // Prevent multi-hits within same attack phase unless configured
    if (attacker.hasHitTarget(defender)) return;
    attacker.markTargetHit(defender);

    let damage = attackDef.baseDamage * (attacker.damageMultiplier || 1.0);
    let isBlocked = defender.isBlocking;
    let isDodged = defender.isInvulnerable;

    if (isDodged) {
      // Dodge / Evade successful
      return;
    }

    if (isBlocked) {
      damage *= (1.0 - (defender.guardStrength || 0.8));
      if (this.audioManager) this.audioManager.playSound('block');
    } else {
      if (this.audioManager) this.audioManager.playSound('hit');
    }

    // Apply damage to defender
    defender.takeDamage(damage, attackDef.knockbackStrength, attackDef.stunDuration, attacker.mesh.position);

    // Apply Combo Increment
    if (!isBlocked) {
      attacker.incrementCombo();
      this.notifyCombo(attacker, attacker.comboCount);
    }

    // Hit stop freeze effect (e.g., 0.08s)
    this.hitStopTimer = 0.08;

    // Trigger hit callbacks for floating damage numbers / UI
    this.notifyDamage(defender, damage, isBlocked, defender.mesh.position.clone());
  }

  onDamage(cb) {
    this.onDamageCallbacks.push(cb);
  }

  onCombo(cb) {
    this.onComboCallbacks.push(cb);
  }

  notifyDamage(target, damage, isBlocked, position) {
    this.onDamageCallbacks.forEach(cb => cb(target, damage, isBlocked, position));
  }

  notifyCombo(fighter, comboCount) {
    this.onComboCallbacks.forEach(cb => cb(fighter, comboCount));
  }
}

/**
 * Default Attack Preset definitions
 */
export const DEFAULT_ATTACKS = {
  LIGHT: {
    id: 'light_attack',
    name: 'Light Attack',
    baseDamage: 12,
    startupTime: 0.1,
    activeTime: 0.2,
    recoveryTime: 0.2,
    stunDuration: 0.35,
    knockbackStrength: 2.0,
    hitboxOffset: { x: 0, y: 1.2, z: 0.8 },
    hitboxSize: { x: 0.8, y: 0.8, z: 1.0 }
  },
  HEAVY: {
    id: 'heavy_attack',
    name: 'Heavy Attack',
    baseDamage: 25,
    startupTime: 0.25,
    activeTime: 0.25,
    recoveryTime: 0.4,
    stunDuration: 0.6,
    knockbackStrength: 5.5,
    hitboxOffset: { x: 0, y: 1.2, z: 1.0 },
    hitboxSize: { x: 1.2, y: 1.0, z: 1.2 }
  },
  SPECIAL: {
    id: 'special_attack',
    name: 'Special Attack',
    baseDamage: 40,
    startupTime: 0.35,
    activeTime: 0.3,
    recoveryTime: 0.5,
    stunDuration: 0.8,
    knockbackStrength: 8.0,
    hitboxOffset: { x: 0, y: 1.2, z: 1.2 },
    hitboxSize: { x: 1.6, y: 1.4, z: 1.6 }
  },
  COMBO: {
    id: 'combo_attack',
    name: 'Combo Sequence',
    baseDamage: 18,
    startupTime: 0.12,
    activeTime: 0.22,
    recoveryTime: 0.25,
    stunDuration: 0.45,
    knockbackStrength: 3.5,
    hitboxOffset: { x: 0, y: 1.2, z: 0.9 },
    hitboxSize: { x: 1.0, y: 0.9, z: 1.1 }
  }
};
