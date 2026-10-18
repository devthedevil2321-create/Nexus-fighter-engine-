/**
 * Engine.js
 * Central engine orchestrator for Nexus Fighter Engine
 */

export class Engine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.isRunning = false;
    this.mode = 'EDITOR'; // 'EDITOR' | 'BATTLE'
    this.quality = 'MEDIUM'; // 'LOW' | 'MEDIUM' | 'HIGH'

    this.lastTime = 0;
    this.fixedTimeStep = 1 / 60;
    this.accumulator = 0;

    // Subsystems
    this.sceneManager = null;
    this.assetManager = null;
    this.combatSystem = null;
    this.hitboxSystem = null;
    this.inputManager = null;
    this.playerController = null;
    this.enemyController = null;
    this.enemyAI = null;
    this.audioManager = null;
    this.projectManager = null;

    this.onStateChangeCallbacks = [];
  }

  setSubsystems(subsystems) {
    Object.assign(this, subsystems);
  }

  setQuality(level) {
    this.quality = level;
    if (this.sceneManager) {
      this.sceneManager.applyQualitySettings(level);
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (this.sceneManager) {
      this.sceneManager.onModeChange(mode);
    }
    if (this.inputManager) {
      this.inputManager.onModeChange(mode);
    }
    this.notifyStateChange();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.accumulator += delta;
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    this.render(delta);

    requestAnimationFrame(this.loop.bind(this));
  }

  fixedUpdate(dt) {
    if (this.inputManager) {
      this.inputManager.update(dt);
    }

    if (this.mode === 'BATTLE') {
      if (this.enemyAI) {
        this.enemyAI.update(dt);
      }
      if (this.playerController) {
        this.playerController.update(dt);
      }
      if (this.enemyController) {
        this.enemyController.update(dt);
      }
      if (this.combatSystem) {
        this.combatSystem.update(dt);
      }
      if (this.hitboxSystem) {
        this.hitboxSystem.update(dt);
      }
    } else {
      // Editor update logic
      if (this.playerController) {
        this.playerController.updateEditor(dt);
      }
      if (this.enemyController) {
        this.enemyController.updateEditor(dt);
      }
    }

    if (this.sceneManager) {
      this.sceneManager.update(dt, this.mode);
    }
  }

  render(delta) {
    if (this.sceneManager) {
      this.sceneManager.render();
    }
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  notifyStateChange() {
    this.onStateChangeCallbacks.forEach(cb => cb(this.mode));
  }
}
