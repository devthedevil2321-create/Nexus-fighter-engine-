# ⚡ NEXUS FIGHTER ENGINE 02
> **A Standalone, Offline-Capable 3D Anime Fighting Game Engine**
> **Creator & Lead Architect:** Dev Aradhya Swain

---

## 🌟 Overview

**NEXUS FIGHTER ENGINE 02** is a lightweight, high-performance, completely offline-capable 3D anime fighting engine built for web browsers and Android tablets. It allows game creators—regardless of programming experience—to import custom 3D characters (`.glb` / `.gltf`), assign animation clips, configure frame-accurate hitboxes and hurtboxes, design custom 3D battle environments, and fight in real time using a PSP-style touch virtual controller or desktop keyboard controls.

The application is **100% self-contained**, requiring **zero cloud dependencies, paid APIs, external servers, or internet access**.

---

## ✨ Key AAA Features

### 1. 🎨 Dark Anime UI & Viewport Workspace
- High-contrast, dark charcoal design with crimson accents.
- Responsive design tailored for Samsung Android tablets and desktop browsers in landscape orientation.
- Dedicated navigation tabs:
  - 🏠 **HOME**: Instant asset drag-and-drop zone and engine status readout.
  - 🎬 **SCENE EDITOR**: Viewport camera tracking, lighting, and wireframe debug toggles.
  - 👤 **CHARACTER EDITOR**: Stats editor for movement speed, health, defense, and scale.
  - 💃 **ANIMATION LAB**: Clip discovery, action mapping, and fallback motion engine.
  - ⚔️ **COMBAT CONFIG**: Attack timing parameters (startup, active, recovery) and AI difficulty settings.
  - 🏟️ **ARENA EDITOR**: Arena geometry scaling, ring boundaries, and lighting presets.
  - 📁 **PROJECT MANAGER**: ZIP export/import and IndexedDB persistence.
  - ⚙️ **SETTINGS**: Multi-tier graphics performance presets (Low, Medium, High).

### 2. 🐉 Drag-and-Drop Asset Importer
- Import `.glb`, `.gltf`, textures (`.png`, `.jpg`, `.webp`), and audio files (`.wav`, `.mp3`) directly into the engine workspace via drag-and-drop or file picker.
- Automatic skeletal hierarchy discovery, animation clip extraction, and material preserving.
- Persistent local binary storage using IndexedDB.

### 3. 🕹️ PSP-Style Virtual Touch Controller
- **Left Side**: Responsive analog movement joystick / D-pad.
- **Right Side**: PSP action buttons in diamond layout:
  - **△ (Triangle)**: Special Attack
  - **○ (Circle)**: Heavy Attack
  - **× (Cross)**: Light Attack
  - **□ (Square)**: Combo Sequence
- **Top Triggers & Utilities**: **L** (Guard / Block), **R** (Dodge / Dash), **JUMP**, **EXIT BATTLE**.
- **Keyboard Fallback**:
  - `W / A / S / D` or `Arrow Keys`: Movement
  - `X`: Light Attack
  - `O`: Heavy Attack
  - `Q`: Special Attack
  - `Z`: Combo Sequence
  - `F`: Guard / Block
  - `Shift`: Dodge / Dash
  - `Space`: Jump

### 4. 🥊 Real 3D Frame-Based Combat & Hitbox System
- Separate, independent 3D **Hitboxes** (attack geometry) and **Hurtboxes** (vulnerability capsule).
- **SHOW HITBOXES** toggle for real-time visual wireframe debugging.
- Frame phases: **Startup** ➔ **Active** ➔ **Recovery** ➔ **Hit-Stop / Stun**.
- Damage reduction via **Guard / Block**, temporary invulnerability windows via **Dodge**, knockback vectors, and dynamic combo counting.

### 5. 🤖 Finite State Machine Enemy AI
- 3 adjustable difficulty tiers: **EASY**, **NORMAL**, and **HARD**.
- Autonomous target tracking, distance evaluation, dynamic attack selection, block reactions, and dodge mechanics.

### 6. 📦 Portable Project Persistence
- Save and load projects locally.
- **Export ZIP**: Package character configurations, camera, arena, combat parameters, and binary assets into a portable single `.zip` file using local `fflate`.
- **Import ZIP**: Load exported engine projects anywhere without network connections.

---

## 🚀 Quick Setup & Offline Launch Guide

### Method A: Static Web Server (Recommended)
Because modern Web Browsers restrict `fetch()` and Web Workers when loading ES modules directly over `file://`, serve the folder with any static local web server:

1. Open your terminal in the project directory:
   ```bash
   # Using Python 3 built-in HTTP server:
   python3 -m http.server 3000
   ```
2. Open your web browser or tablet browser at:
   ```
   http://localhost:3000
   ```

### Method B: Node.js / Serve
```bash
npm install -g serve
serve -p 3000
```

---

## 📂 Project Structure

```
├── index.html               # Main Web Entry Point & Anime UI HTML
├── css/
│   └── style.css            # Dark Anime Theme Stylesheet
├── js/
│   ├── main.js              # Application Orchestrator & UI Event Handler
│   └── engine/
│       ├── Engine.js        # Main Loop, State Management & Quality Presets
│       ├── SceneManager.js  # Three.js 3D Viewport, Lighting, and Arena Camera
│       ├── AssetManager.js  # GLB Parser & IndexedDB Persistence Manager
│       ├── FighterController.js # Character Physics, State Machine & Hit/Hurtboxes
│       ├── AnimationController.js # AnimationMixer & Procedural Motion Fallbacks
│       ├── HitboxSystem.js  # 3D Collision Detection & Wireframe Visual Debugger
│       ├── CombatSystem.js  # Frame Timing, Damage, Block, Dodge & Combo Engine
│       ├── EnemyAI.js       # Finite State Machine Enemy Intelligence
│       ├── InputManager.js  # Dual Touchscreen & Keyboard Input Handler
│       └── ProjectManager.js # Portable ZIP Export/Import Handler
├── lib/
│   ├── three.module.js      # Bundled Three.js (Offline)
│   ├── GLTFLoader.js        # Bundled GLTF/GLB Importer
│   ├── OrbitControls.js     # Bundled 3D Viewport Camera Controls
│   ├── fflate.module.js     # Bundled High-Speed ZIP Compressor
│   └── utils/               # Internal Three.js utilities
└── test_engine.js           # Automated Unit & Integration Test Suite
```

---

## 🧪 Running Tests

To verify core engine mechanics, attack frame timings, damage calculations, and AI states:

```bash
npm test
# OR
node test_engine.js
```

---

## 📜 License & Credits

- **Project Creator & Author:** Dev Aradhya Swain
- **Dependencies:** Three.js (MIT), fflate (MIT) — all locally bundled in `lib/`.
