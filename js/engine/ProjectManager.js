/**
 * ProjectManager.js
 * Handles saving, loading, exporting as ZIP, and importing ZIP project files.
 */

import { zipSync, unzipSync, strToU8, strFromU8 } from '../../lib/fflate.module.js';

export class ProjectManager {
  constructor(engine) {
    this.engine = engine;
  }

  exportProjectJSON() {
    const projectData = {
      version: '1.0.0',
      timestamp: Date.now(),
      player: {
        name: this.engine.playerController.name,
        health: this.engine.playerController.maxHealth,
        moveSpeed: this.engine.playerController.moveSpeed
      },
      enemy: {
        name: this.engine.enemyController.name,
        health: this.engine.enemyController.maxHealth,
        difficulty: this.engine.enemyAI.difficulty
      },
      settings: {
        quality: this.engine.quality,
        showHitboxes: this.engine.hitboxSystem.showDebug
      }
    };

    return JSON.stringify(projectData, null, 2);
  }

  async exportProjectZIP() {
    const jsonStr = this.exportProjectJSON();
    const zipData = {
      'project.json': strToU8(jsonStr),
      'README.txt': strToU8('Nexus Fighter Engine 02 - Exported Project Package\nCreated by Dev Aradhya Swain')
    };

    const zipped = zipSync(zipData);
    const blob = new Blob([zipped], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_project_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importProjectZIP(file) {
    const arrayBuffer = await file.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(arrayBuffer));

    if (unzipped['project.json']) {
      const jsonStr = strFromU8(unzipped['project.json']);
      const projectData = JSON.parse(jsonStr);

      if (projectData.player) {
        this.engine.playerController.name = projectData.player.name || 'Red Warrior';
        this.engine.playerController.maxHealth = projectData.player.health || 100;
      }
      if (projectData.enemy) {
        this.engine.enemyController.name = projectData.enemy.name || 'Blue Shadow';
        if (projectData.enemy.difficulty) {
          this.engine.enemyAI.setDifficulty(projectData.enemy.difficulty);
        }
      }
      if (projectData.settings) {
        if (projectData.settings.quality) this.engine.setQuality(projectData.settings.quality);
      }
      return true;
    }
    throw new Error('Invalid project ZIP: project.json missing');
  }
}
