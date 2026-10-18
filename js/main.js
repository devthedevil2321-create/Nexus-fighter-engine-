/**
 * main.js
 * Main entry point for Nexus Fighter Engine
 */

import { Engine } from './engine/Engine.js';
import { SceneManager } from './engine/SceneManager.js';
import { AssetManager } from './engine/AssetManager.js';
import { HitboxSystem } from './engine/HitboxSystem.js';
import { CombatSystem } from './engine/CombatSystem.js';
import { FighterController } from './engine/FighterController.js';
import { EnemyAI } from './engine/EnemyAI.js';
import { InputManager } from './engine/InputManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('render-canvas');
  const engine = new Engine(canvas);

  const sceneManager = new SceneManager(canvas);
  const assetManager = new AssetManager();
  const hitboxSystem = new HitboxSystem(sceneManager.scene);
  const combatSystem = new CombatSystem(hitboxSystem, null);
  const inputManager = new InputManager(engine);

  // Default Player and Enemy Fighters
  const player = new FighterController({
    id: 'player_1',
    name: 'Red Warrior',
    isPlayer: true,
    scene: sceneManager.scene
  });
  player.setPosition(-3, 0, 0);

  const enemy = new FighterController({
    id: 'enemy_1',
    name: 'Blue Shadow',
    isPlayer: false,
    scene: sceneManager.scene
  });
  enemy.setPosition(3, 0, 0);

  player.setOpponent(enemy);
  enemy.setOpponent(player);

  const enemyAI = new EnemyAI(enemy, player);

  sceneManager.setFighterRefs(player.mesh, enemy.mesh);
  combatSystem.registerFighter(player);
  combatSystem.registerFighter(enemy);

  engine.setSubsystems({
    sceneManager,
    assetManager,
    hitboxSystem,
    combatSystem,
    inputManager,
    playerController: player,
    enemyController: enemy,
    enemyAI
  });

  // UI Event Bindings
  setupUI(engine);

  engine.start();
});

function setupUI(engine) {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.panel-tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      tabContents.forEach(content => {
        content.style.display = content.id === `tab-content-${target}` ? 'block' : 'none';
      });
    });
  });

  // Battle Mode Toggle
  const btnBattle = document.getElementById('btn-toggle-battle');
  const battleOverlay = document.getElementById('battle-overlay');
  const btnExit = document.getElementById('btn-trigger-exit');

  btnBattle.addEventListener('click', () => {
    engine.setMode('BATTLE');
    battleOverlay.classList.remove('hidden');
    document.getElementById('side-panel').style.display = 'none';
    engine.playerController.resetState(-3, 0);
    engine.enemyController.resetState(3, 0);
  });

  btnExit.addEventListener('click', () => {
    engine.setMode('EDITOR');
    battleOverlay.classList.add('hidden');
    document.getElementById('side-panel').style.display = 'flex';
  });

  // PSP Button Controls
  document.getElementById('btn-psp-cross').addEventListener('click', () => engine.playerController.executeAttack('LIGHT'));
  document.getElementById('btn-psp-circle').addEventListener('click', () => engine.playerController.executeAttack('HEAVY'));
  document.getElementById('btn-psp-triangle').addEventListener('click', () => engine.playerController.executeAttack('SPECIAL'));
  document.getElementById('btn-psp-square').addEventListener('click', () => engine.playerController.executeAttack('COMBO'));

  document.getElementById('btn-trigger-l').addEventListener('click', () => engine.playerController.block(true));
  document.getElementById('btn-trigger-r').addEventListener('click', () => engine.playerController.dodge());
  document.getElementById('btn-trigger-jump').addEventListener('click', () => engine.playerController.jump());

  // Hitbox Debug Toggle
  document.getElementById('select-hitbox-debug').addEventListener('change', (e) => {
    engine.hitboxSystem.setShowDebug(e.target.value === 'true');
  });

  // Damage Health Bar Update Sync
  engine.combatSystem.onDamage((target, damage) => {
    if (target === engine.playerController) {
      const pct = (target.currentHealth / target.maxHealth) * 100;
      document.getElementById('player-health-bar').style.width = `${pct}%`;
    } else if (target === engine.enemyController) {
      const pct = (target.currentHealth / target.maxHealth) * 100;
      document.getElementById('enemy-health-bar').style.width = `${pct}%`;
    }
  });

  // File Drag and Drop Importer
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      await engine.assetManager.parseFile(e.dataTransfer.files[0]);
      alert(`Asset ${e.dataTransfer.files[0].name} imported successfully!`);
    }
  });
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await engine.assetManager.parseFile(e.target.files[0]);
      alert(`Asset ${e.target.files[0].name} imported successfully!`);
    }
  });
}
