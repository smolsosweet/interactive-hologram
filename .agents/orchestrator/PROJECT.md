# Project: HoloLearn Astronaut Training Calibration UI

## Architecture
- **Single WebGL Canvas Model**: Attached to `#canvas-container` in `src/index.html`, managed by `THREE.WebGLRenderer` in `src/renderer.js`.
- **Three.js Scene Hierarchy**:
  - `scene` (Root)
    - `modelGroup` (Main Solar System overview model - `solar_system.glb`)
    - `focusModelGroup` (Single planet focus model & 5-light studio rig)
    - `calibGroup` (3D Astronaut Training Calibration objects & visual cues)
- **ML Gesture Subsystem** (`src/ml_gesture.js`):
  - State flags: `window.isMlCalibrating`, `window.mlTutorialStep` (0: Fist/Asteroid, 1: Open Palm/Cloudy Earth, 2: Pinch/Tiny Moon, -1: Finished), `window.isMlSamplingActive`.
  - Core API: `window.startCurrentSample()`, `window.processMLCalibration(landmarks, isRight)`, `window.mlSamples`, `finishTutorial()`.
- **UI & DOM Overlay** (`src/index.html`):
  - `#tutorial-overlay` (z-index 60): Glassmorphic backdrop (`backdrop-filter: blur(4px); background: rgba(0,0,0,0.4)`), minimal text instructions. Static `#tut-gesture-icon` removed.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Remove Static Gesture Icon | Remove static emoji `<div id="tut-gesture-icon">` and clean up emoji string updates | M1 | ORIGINAL_REQUEST §AC |
| 2 | 3D Calibration Scene & Objects | Instantiate `calibGroup` with 3D Asteroid (Fist), Cloudy Earth (Open Palm), and Tiny Moon (Pinch) | M1 | ORIGINAL_REQUEST §R2, §AC |
| 3 | Visual Cues & 3D Silhouettes | Add animated 3D hand silhouettes, pulse rings, and particle effects (crush, sweep fog, zoom) | M1 | ORIGINAL_REQUEST §R2, §R3 |
| 4 | Interactive 3-Step Calibration Flow | Integrate 3D visual steps with `window.startCurrentSample()`, `window.mlTutorialStep`, sampling progress | M2 | ORIGINAL_REQUEST §R1 |
| 5 | ML Calibration Data Collection | Collect 10 samples per step via `processMLCalibration()`, fit TF.js model / fallback rule-based | M2 | ORIGINAL_REQUEST §R1, §AC |
| 6 | Smooth Transition to Main View | Fade out `calibGroup`, fade in `modelGroup`, lerp camera to `overviewCam`, hide `#tutorial-overlay` | M3 | ORIGINAL_REQUEST §R1, §AC |
| 7 | Minimal Text & UI Polish | Streamline text instructions for 6-15 age group, glassmorphic UI overlay, ensure UI responsiveness | M3 | ORIGINAL_REQUEST §R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: 3D Calibration Scene & Objects | Create `calibGroup`, 3D Asteroid, 3D Cloudy Earth, 3D Tiny Moon, animated 3D silhouettes/cues, remove `#tut-gesture-icon` | none | DONE |
| 2 | M2: Gamified Calibration Flow & ML Integration | Connect 3D objects & cues to `mlTutorialStep` (0,1,2), `startCurrentSample()`, sample progress lerps, `processMLCalibration()` | M1 | DONE |
| 3 | M3: Transition & UI Polish | Smooth transition from `calibGroup` to main `modelGroup`, glassmorphic overlay, minimal text instructions | M2 | IN_PROGRESS |
| 4 | Final Milestone | Pass 100% E2E test suite + Adversarial Coverage Hardening (Tier 5) | M1, M2, M3 | PLANNED |

## Interface Contracts
### `calibGroup` ↔ `src/ml_gesture.js`
- `window.mlTutorialStep`: 0 (Fist / Asteroid), 1 (Open Palm / Cloudy Earth), 2 (Pinch / Tiny Moon), -1 (Inactive / Finished).
- `window.updateTutorialUI()`: Called on step change and sample progress update (`currentSampleCount / 10`). Updates 3D object visibility, scales, rotations, particle effects, and hand silhouette animations.
- `window.startCurrentSample()`: Sets `window.isMlSamplingActive = true` to begin landmark collection.
- `finishTutorial(fallback)`: Sets `window.isMlCalibrating = false`, triggers smooth 3D transition (hides `calibGroup`, shows `modelGroup`, lerps camera), and hides `#tutorial-overlay`.

## Code Layout
- `src/index.html`: DOM layout, `#tutorial-overlay` glassmorphic styling, progress bars, buttons.
- `src/renderer.js`: Three.js setup, `calibGroup` initialization, procedural 3D geometries/materials, animation loop updates, camera/scene transition logic.
- `src/ml_gesture.js`: ML gesture state machine, feature extraction, `processMLCalibration()`, `startCurrentSample()`, `trainMLModel()`, `finishTutorial()`.
- `main.js`: Electron main process, window creation, OpenVINO IPC handlers.
