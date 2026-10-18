/**
 * FighterController.js
 * Controls a 3D Fighter (Player or Enemy), state machine, combat execution, movement, and health/hurtboxes.
 */

import * as THREE from '../../lib/three.module.js';
import { DEFAULT_ATTACKS } from './CombatSystem.js';
import { AnimationController } from './AnimationController.js';

export class FighterController {
  constructor({
    id,
    name = 'Fighter',
    isPlayer = true,
    mesh = null,
    animations = [],
    scene = null
  }) {
    this.id = id;
    this.name = name;
    this.isPlayer = isPlayer;
    this.scene = scene;

    // Build mesh fallback if missing
    this.mesh = mesh || this.createFallbackMesh(isPlayer);
    if (this.scene) {
      this.scene.add(this.mesh);
    }

    // Animation Controller
    this.animController = new AnimationController(this.mesh, animations);

    // Fighter Parameters
    this.maxHealth = 100;
    this.currentHealth = 100;
    this.moveSpeed = 6.0;
    this.runSpeed = 9.0;
    this.jumpStrength = 8.0;
    this.damageMultiplier = 1.0;
    this.defenseMultiplier = 1.0;
    this.guardStrength = 0.8;

    // Movement & Physics state
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.facingDirection = new THREE.Vector3(0, 0, 1);

    // Combat & Action State
    this.isAlive = true;
    this.isAttacking = false;
    this.isBlocking = false;
    this.isInvulnerable = false; // Dodge
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackPhase = 'IDLE'; // 'STARTUP' | 'ACTIVE' | 'RECOVERY'
    this.attackTimer = 0;
    this.currentAttackDef = null;

    this.hitTargets = new Set();
    this.comboCount = 0;
    this.opponent = null;

    // Hurtbox Dimensions
    this.hurtboxSize = new THREE.Vector3(0.8, 1.8, 0.8);
    this.hurtboxOffset = new THREE.Vector3(0, 0.9, 0);

    // Play default idle
    this.animController.playAction('idle');
  }

  createFallbackMesh(isPlayer) {
    const group = new THREE.Group();

    // Body Capsule/Box
    const color = isPlayer ? 0xcc2233 : 0x2266cc;
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffddcc });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);

    // Eyes / Facing indicator
    const eyeGeo = new THREE.BoxGeometry(0.3, 0.08, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 1.75, 0.28);
    group.add(eye);

    return group;
  }

  setOpponent(opponent) {
    this.opponent = opponent;
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  faceOpponent() {
    if (!this.opponent) return;
    const dx = this.opponent.mesh.position.x - this.mesh.position.x;
    const dz = this.opponent.mesh.position.z - this.mesh.position.z;
    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
      const angle = Math.atan2(dx, dz);
      this.mesh.rotation.y = angle;
      this.facingDirection.set(Math.sin(angle), 0, Math.cos(angle));
    }
  }

  move(dx, dz, dt) {
    if (!this.isAlive || this.isStunned || this.isAttacking) return;

    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
      this.mesh.position.x += dx * this.moveSpeed * dt;
      this.mesh.position.z += dz * this.moveSpeed * dt;

      // Keep inside boundary ring (radius 14)
      const dist = Math.hypot(this.mesh.position.x, this.mesh.position.z);
      if (dist > 14.0) {
        this.mesh.position.x *= 14.0 / dist;
        this.mesh.position.z *= 14.0 / dist;
      }

      this.animController.playAction('walk');
    } else if (!this.isAttacking && !this.isBlocking) {
      this.animController.playAction('idle');
    }
  }

  jump() {
    if (this.isGrounded && this.isAlive && !this.isStunned) {
      this.velocity.y = this.jumpStrength;
      this.isGrounded = false;
      this.animController.playAction('jump');
    }
  }

  block(enabled) {
    if (!this.isAlive || this.isStunned || this.isAttacking) return;
    this.isBlocking = enabled;
    if (enabled) {
      this.animController.playAction('block');
    }
  }

  dodge() {
    if (!this.isAlive || this.isStunned || this.isAttacking || this.isInvulnerable) return;
    this.isInvulnerable = true;
    this.animController.playAction('dodge');
    setTimeout(() => {
      this.isInvulnerable = false;
    }, 400); // 400ms invulnerability window
  }

  executeAttack(attackType = 'LIGHT') {
    if (!this.isAlive || this.isStunned || this.isAttacking) return;

    const attackDef = DEFAULT_ATTACKS[attackType] || DEFAULT_ATTACKS.LIGHT;
    this.currentAttackDef = attackDef;
    this.isAttacking = true;
    this.attackPhase = 'STARTUP';
    this.attackTimer = attackDef.startupTime;
    this.hitTargets.clear();

    const animKey = attackType === 'LIGHT' ? 'lightAttack' :
                    attackType === 'HEAVY' ? 'heavyAttack' :
                    attackType === 'SPECIAL' ? 'specialAttack' : 'comboAttack';
    this.animController.playAction(animKey);
  }

  update(dt) {
    if (!this.isAlive) return;

    // Apply Gravity & Ground Collision
    if (!this.isGrounded) {
      this.velocity.y -= 25.0 * dt;
      this.mesh.position.y += this.velocity.y * dt;
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    // Handle Stun
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    }

    // Handle Attack Frame Phases
    if (this.isAttacking && this.currentAttackDef) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        if (this.attackPhase === 'STARTUP') {
          this.attackPhase = 'ACTIVE';
          this.attackTimer = this.currentAttackDef.activeTime;
        } else if (this.attackPhase === 'ACTIVE') {
          this.attackPhase = 'RECOVERY';
          this.attackTimer = this.currentAttackDef.recoveryTime;
        } else if (this.attackPhase === 'RECOVERY') {
          this.isAttacking = false;
          this.attackPhase = 'IDLE';
          this.currentAttackDef = null;
        }
      }
    }

    // Update Face Towards Opponent
    if (!this.isAttacking) {
      this.faceOpponent();
    }

    // Update Animations
    this.animController.update(dt);
  }

  updateEditor(dt) {
    this.animController.update(dt);
  }

  canBeHit() {
    return this.isAlive && !this.isInvulnerable;
  }

  hasHitTarget(target) {
    return this.hitTargets.has(target);
  }

  markTargetHit(target) {
    this.hitTargets.add(target);
  }

  takeDamage(amount, knockback, stun, attackerPos) {
    if (!this.isAlive) return;

    this.currentHealth = Math.max(0, this.currentHealth - amount);

    if (stun > 0) {
      this.isStunned = true;
      this.stunTimer = stun;
      this.isAttacking = false;
    }

    // Apply Knockback Vector
    if (knockback > 0 && attackerPos) {
      const kbDir = this.mesh.position.clone().sub(attackerPos).setY(0).normalize();
      this.mesh.position.addScaledVector(kbDir, knockback * 0.2);
    }

    if (this.currentHealth <= 0) {
      this.isAlive = false;
      this.animController.playAction('defeat');
    } else {
      this.animController.playAction('hitReaction');
    }
  }

  incrementCombo() {
    this.comboCount++;
  }

  resetCombo() {
    this.comboCount = 0;
  }

  resetState(spawnX = 0, spawnZ = 0) {
    this.currentHealth = this.maxHealth;
    this.isAlive = true;
    this.isAttacking = false;
    this.isBlocking = false;
    this.isStunned = false;
    this.comboCount = 0;
    this.mesh.position.set(spawnX, 0, spawnZ);
    this.animController.playAction('idle');
  }

  getHurtboxes() {
    const pos = this.mesh.position.clone().add(this.hurtboxOffset);
    return [{
      worldPosition: pos,
      worldRotation: this.mesh.rotation,
      size: this.hurtboxSize
    }];
  }

  getActiveHitboxes() {
    if (!this.isAttacking || this.attackPhase !== 'ACTIVE' || !this.currentAttackDef) return [];

    const attack = this.currentAttackDef;
    const localOffset = new THREE.Vector3(
      attack.hitboxOffset.x,
      attack.hitboxOffset.y,
      attack.hitboxOffset.z
    );

    localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    const pos = this.mesh.position.clone().add(localOffset);

    return [{
      worldPosition: pos,
      worldRotation: this.mesh.rotation,
      size: new THREE.Vector3(attack.hitboxSize.x, attack.hitboxSize.y, attack.hitboxSize.z)
    }];
  }
}
