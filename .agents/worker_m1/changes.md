# Milestone 1 (M1) Code Modifications

## Summary of Changes

### 1. HTML & Static Icon Cleanup (`src/index.html`)
- **Removed Static Gesture Icon Element**: Removed `<div id="tut-gesture-icon">🖐</div>` from the calibration modal overlay.
- **Removed Static Gesture Icon CSS Rule**: Deleted `#tut-gesture-icon` CSS styles.
- **Glassmorphic Transparent Backdrop**: Updated `#tutorial-overlay` styling to `background: rgba(0,0,0,0.4)` and `backdrop-filter: blur(4px)`, allowing the background 3D canvas and `calibGroup` visual cues to serve as the centerpiece of calibration.

### 2. Gesture Logic & Callbacks Cleanup (`src/ml_gesture.js`)
- **Removed `tutIcon` References**: Removed `tutIcon` variable declaration, `document.getElementById('tut-gesture-icon')` binding, and static text emoji assignments (`👊`, `🖐`, `✌️`, `🚀`).
- **Added 3D Visual Interface Integration**:
  - `updateTutorialUI()` calls `window.calibVisuals.setStep(step)` and `window.calibVisuals.setProgress(progress)`.
  - `processMLCalibration()` calls `window.calibVisuals.setProgress(progress)` on each frame.
  - `finishTutorial()` calls `window.calibVisuals.setStep(-1)` to hide 3D calibration objects when calibration concludes or is skipped.

### 3. Three.js Calibration Scene & Objects Setup (`src/renderer.js`)
- **Procedural Canvas Textures**:
  - `createEarthTexture()`: Generates a 512x256 canvas texture featuring deep blue ocean, continent landmasses, and polar ice caps.
  - `createMoonTexture()`: Generates a 512x256 cratered lunar surface canvas texture.
  - `createCloudTexture()`: Generates an atmospheric cloud swirl texture.
- **Dedicated Calibration Group (`calibGroup`)**:
  - Instantiated `calibGroup = new THREE.Group()` at position `(0, 10, 0)` in front of `overviewCam` and added to `scene`.
- **Procedural 3D Step Objects**:
  - **Step 1 (Fist - 3D Asteroid)**: Procedural perturbed `DodecahedronGeometry` vertex noise rock mesh + rock fragment debris particle system (`THREE.Points`, 140 particles) + crushing scale shrinkage, micro-vibration, and debris dispersion animation.
  - **Step 2 (Open Palm - 3D Cloudy Earth)**: Core Earth sphere (`SphereGeometry(2.0)`) + outer atmospheric cloud shell (`SphereGeometry(2.18)`) + particle fog envelope (`THREE.Points`, 200 particles) + fog clearing opacity fade animation (`0.85 -> 0.05`).
  - **Step 3 (Pinch - 3D Tiny Moon)**: Grey cratered sphere (`SphereGeometry(0.8)`) + dual glowing pulsing target rings (`RingGeometry`) + zoom scale animation (`0.8 -> 2.2`).
- **3D Wireframe Animated Hand Silhouette**:
  - 21 joint landmark nodes (`SphereGeometry(0.08)`) + 20 bone line segments (`THREE.LineSegments`).
  - Defined 3D joint landmark poses for Fist (contracted), Open Palm (sweeping), and Pinch (index/thumb tip contact).
  - Smooth landmark lerping & step-specific gesture animations (fist flexing, palm sweeping arc, pinch contact).
- **Global Calibration Interface (`window.calibVisuals`)**:
  - Exposed `setStep(step)`, `setProgress(progress)`, `reset()`, and `getGroup()`.
  - Exposed global window functions `window.setCalibrationStep(step)` and `window.updateCalibrationProgress(progress)`.
- **Render Loop Integration**:
  - Integrated `updateCalibrationVisuals(delta)` into `animate()` loop.
  - Controlled visibility of `modelGroup`, `focusModelGroup`, and `calibGroup` during calibration state.
