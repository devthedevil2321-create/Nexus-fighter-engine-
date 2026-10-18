/**
 * EnemyAI.js
 * Finite State Machine for Enemy Fighter AI.
 * Supports EASY, NORMAL, and HARD difficulty levels.
 */

export class EnemyAI {
  constructor(enemyFighter, playerFighter) {
    this.enemy = enemyFighter;
    this.player = playerFighter;
    this.difficulty = 'NORMAL'; // 'EASY' | 'NORMAL' | 'HARD'

    this.state = 'IDLE'; // 'IDLE' | 'APPROACH' | 'ATTACK' | 'BLOCK' | 'RECOVER'
    this.decisionTimer = 0;
    this.decisionInterval = 0.5; // seconds between decisions
  }

  setDifficulty(level) {
    this.difficulty = level;
    if (level === 'EASY') {
      this.decisionInterval = 0.8;
    } else if (level === 'NORMAL') {
      this.decisionInterval = 0.4;
    } else if (level === 'HARD') {
      this.decisionInterval = 0.2;
    }
  }

  update(dt) {
    if (!this.enemy || !this.player || !this.enemy.isAlive || !this.player.isAlive) return;

    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.makeDecision();
      this.decisionTimer = this.decisionInterval;
    }

    this.executeState(dt);
  }

  makeDecision() {
    const dist = Math.hypot(
      this.enemy.mesh.position.x - this.player.mesh.position.x,
      this.enemy.mesh.position.z - this.player.mesh.position.z
    );

    const rand = Math.random();

    if (dist > 2.5) {
      this.state = 'APPROACH';
    } else {
      // In close range
      if (this.player.isAttacking && (this.difficulty === 'HARD' || rand < 0.4)) {
        this.state = 'BLOCK';
      } else if (rand < 0.7) {
        this.state = 'ATTACK';
      } else if (this.difficulty === 'HARD' && rand < 0.85) {
        this.state = 'DODGE';
      } else {
        this.state = 'IDLE';
      }
    }
  }

  executeState(dt) {
    const ePos = this.enemy.mesh.position;
    const pPos = this.player.mesh.position;

    if (this.state === 'APPROACH') {
      const dx = pPos.x - ePos.x;
      const dz = pPos.z - ePos.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.01) {
        this.enemy.move(dx / len, dz / len, dt);
      }
    } else if (this.state === 'ATTACK') {
      const attackTypes = ['LIGHT', 'HEAVY', 'SPECIAL', 'COMBO'];
      const chosen = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      this.enemy.executeAttack(chosen);
      this.state = 'RECOVER';
    } else if (this.state === 'BLOCK') {
      this.enemy.block(true);
      setTimeout(() => this.enemy.block(false), 500);
      this.state = 'RECOVER';
    } else if (this.state === 'DODGE') {
      this.enemy.dodge();
      this.state = 'RECOVER';
    }
  }
}
