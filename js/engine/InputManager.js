/**
 * InputManager.js
 * Handles dual input (Touch virtual controller & Keyboard) for desktop and tablet users.
 */

export class InputManager {
  constructor(engine) {
    this.engine = engine;
    this.keysPressed = {};

    // Input States
    this.moveVector = { x: 0, z: 0 };
    this.actions = {
      lightAttack: false,
      heavyAttack: false,
      specialAttack: false,
      comboAttack: false,
      block: false,
      dodge: false,
      jump: false,
      lockTarget: false
    };

    // Keyboard Bindings
    this.keyMap = {
      KeyW: 'up',
      KeyS: 'down',
      KeyA: 'left',
      KeyD: 'right',
      KeyX: 'lightAttack',
      KeyO: 'heavyAttack',
      KeyQ: 'specialAttack',
      KeyZ: 'comboAttack',
      KeyF: 'block',
      ShiftLeft: 'dodge',
      Space: 'jump'
    };

    this.setupKeyboardListeners();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
      const action = this.keyMap[e.code];
      if (action && this.engine.mode === 'BATTLE') {
        this.triggerAction(action);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
      if (e.code === 'KeyF' && this.engine.playerController) {
        this.engine.playerController.block(false);
      }
    });
  }

  triggerAction(action) {
    const player = this.engine.playerController;
    if (!player) return;

    if (action === 'lightAttack') player.executeAttack('LIGHT');
    else if (action === 'heavyAttack') player.executeAttack('HEAVY');
    else if (action === 'specialAttack') player.executeAttack('SPECIAL');
    else if (action === 'comboAttack') player.executeAttack('COMBO');
    else if (action === 'block') player.block(true);
    else if (action === 'dodge') player.dodge();
    else if (action === 'jump') player.jump();
  }

  onModeChange(mode) {
    // Reset inputs on mode change
    this.moveVector = { x: 0, z: 0 };
  }

  update(dt) {
    if (this.engine.mode !== 'BATTLE' || !this.engine.playerController) return;

    // Synthesize movement from Keyboard WASD if active
    let dx = 0;
    let dz = 0;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) dz -= 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) dz += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) dx -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) dx += 1;

    // Combine with virtual joystick input
    dx += this.moveVector.x;
    dz += this.moveVector.z;

    const len = Math.hypot(dx, dz);
    if (len > 0.01) {
      dx /= Math.max(1, len);
      dz /= Math.max(1, len);
      this.engine.playerController.move(dx, dz, dt);
    }
  }

  setVirtualJoystick(x, z) {
    this.moveVector.x = x;
    this.moveVector.z = z;
  }
}
