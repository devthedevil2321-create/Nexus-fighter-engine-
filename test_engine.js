/**
 * test_engine.js
 * Comprehensive automated unit & integration test suite for Nexus Fighter Engine logic
 */

import { DEFAULT_ATTACKS, CombatSystem } from './js/engine/CombatSystem.js';
import { FighterController } from './js/engine/FighterController.js';
import { EnemyAI } from './js/engine/EnemyAI.js';

function runTests() {
  console.log('=== STARTING NEXUS FIGHTER ENGINE TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Attack Definitions & Frame Timings
    assert(DEFAULT_ATTACKS.LIGHT.baseDamage === 12, 'Light attack base damage is 12');
    assert(DEFAULT_ATTACKS.HEAVY.baseDamage === 25, 'Heavy attack base damage is 25');
    assert(DEFAULT_ATTACKS.SPECIAL.baseDamage === 40, 'Special attack base damage is 40');

    // TEST 2: Fighter Initialization & Health Stats
    const player = new FighterController({ id: 'p1', name: 'TestPlayer', isPlayer: true });
    const enemy = new FighterController({ id: 'e1', name: 'TestEnemy', isPlayer: false });
    player.setOpponent(enemy);
    enemy.setOpponent(player);

    assert(player.currentHealth === 100, 'Player starting health is 100');
    assert(enemy.currentHealth === 100, 'Enemy starting health is 100');
    assert(player.isAlive === true, 'Player is alive on spawn');

    // TEST 3: Combat System Damage & Hit Registration
    const mockHitboxSys = {
      registerFighter: () => {},
      unregisterFighter: () => {},
      checkCollisions: (att, def) => {
        if (att.isAttacking && att.attackPhase === 'ACTIVE') {
          return [{ hitbox: {}, hurtbox: {}, attacker: att, defender: def }];
        }
        return [];
      }
    };

    const combatSys = new CombatSystem(mockHitboxSys, null);
    combatSys.registerFighter(player);
    combatSys.registerFighter(enemy);

    player.executeAttack('LIGHT');
    player.attackPhase = 'ACTIVE'; // simulate active frame phase
    combatSys.update(0.016);

    assert(enemy.currentHealth === 88, `Enemy took 12 damage from light attack (Health: ${enemy.currentHealth})`);

    // TEST 4: Blocking Reduces Damage
    combatSys.hitStopTimer = 0; // clear hit stop
    player.isAttacking = false;
    player.hitTargets.clear(); // Clear target hit set for next attack
    enemy.isBlocking = true;
    player.executeAttack('LIGHT');
    player.attackPhase = 'ACTIVE';
    combatSys.update(0.016);

    // 12 * (1 - 0.8 guard strength) = 2.4 damage => 88 - 2.4 = 85.6
    assert(enemy.currentHealth > 85 && enemy.currentHealth < 86, `Blocking reduced light attack damage (Health: ${enemy.currentHealth})`);

    // TEST 5: Enemy AI State Machine & Difficulty
    const ai = new EnemyAI(enemy, player);
    ai.setDifficulty('HARD');
    assert(ai.difficulty === 'HARD', 'Enemy AI difficulty updated to HARD');
    assert(ai.decisionInterval === 0.2, 'HARD difficulty decision interval set to 0.2s');

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests();
