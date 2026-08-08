# Three.js Scene Setup & Astronaut Training Visuals Analysis

## Executive Summary
This document provides a thorough analysis of the Three.js architecture in `d:\test_planets` and designs a 3D visual-first Astronaut Training calibration flow to replace static emoji UI elements. The implementation leverages the existing single WebGL canvas architecture in `src/renderer.js` and integrates directly with the MediaPipe/TensorFlow.js calibration loop in `src/ml_gesture.js`.

---

## 1. Current Three.js Architecture (`src/renderer.js` & `src/index.html`)

### 1.1 DOM Container & Canvas Setup
- **Single Canvas Model**: The entire application uses a **single WebGL Canvas** created via `THREE.WebGLRenderer({ antialias: true })` and attached to `#canvas-container` (`src/index.html:679`, `src/renderer.js:36,54`).
- **Canvas Properties**:
  - `outputEncoding`: `THREE.sRGBEncoding`
  - Dimensions: Dynamically matches `#canvas-container` (`clientWidth` x `clientHeight`).
  - Overlay Elements: HTML/CSS HUDs (`#tutorial-overlay`, `#planet-panel`, `#hud-gesture-wrap`) are positioned over the WebGL canvas with CSS z-indexing (`z-index: 60`, `z-index: 40`, `z-index: 30`).
  - Camera Debug Feed: MediaPipe uses a separate, optional 2D `<canvas class="output_canvas">` positioned top-right for facial/hand landmark debug overlay.

### 1.2 Scene Structure & Camera Setup
- **Scene**: `const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);`
- **Cameras**:
  1. `overviewCam`: `THREE.PerspectiveCamera(60, aspect, 0.1, 8000)`. Base position `(0, 62.5, 42.5)` looking at `(9, 10.5, 0)` (Sun center). Configured with `setViewOffset` for screen offset adjustments.
  2. `focusCam`: `THREE.PerspectiveCamera(50, 1, 0.01, 5000)`. Positioned dynamically at `(0, 0, focusCamDist)` looking at `(0,0,0)`. Shifted dynamically when planet info panel opens.
- **Root Object Groups**:
  - `modelGroup`: Holds the main solar system model (`solar_system.glb`). Rotated and scaled for overview navigation.
  - `focusModelGroup` / `focusSpinner`: Two-layer hierarchy for single-planet focus mode with fixed lighting and model rotation.

### 1.3 Lighting Configuration
- **Overview Mode**: `AmbientLight(0xffffff, 0.8)` + `PointLight(0xfff0cc, 3.5, 6000)` at `(0,0,0)`.
- **Focus Mode**: 5-light studio setup inside `focusModelGroup` (`focusKey`, `focusSpecular` PointLight for realistic sphere specular highlight, `focusFill`, `focusRim` for edge outline, and `focusAmbient`).

### 1.4 Animation Loop & Rendering Pipeline
- **Main Loop**: `animate()` driven by `requestAnimationFrame(animate)`.
- **Clock & Updates**: `delta = Math.min(clock.getDelta(), 0.05);` updates skeletal GLTF mixers, planet orbit rotations (`updateOrbits(delta)`), camera zoom/pan interpolation, and screen-idle timeout checks (5 minutes).
- **Scissor & Viewport Rendering (`renderFrame()`)**:
  - Renders `overviewCam` when `transitionProgress < 0.02`.
  - Renders `focusCam` when `transitionProgress > 0.98`.
  - Uses `threeRenderer.setScissorTest(true)` to perform a horizontal wipe transition between views when transitioning (`0.05 < transitionProgress < 0.98`).

---

## 2. 3D Visual Training Objects Design (Procedural & Assets)

To satisfy **R2 (Visual Steps)** and **R3 (Minimal Text)** without external video assets or Lottie files, 3 procedural 3D training objects can be instantiated inside a dedicated `calibGroup` in Three.js.

```
                  +-----------------------------------+
                  |      Three.js Scene (scene)       |
                  +-----------------------------------+
                                    |
         +--------------------------+--------------------------+
         |                          |                          |
+-----------------+        +-----------------+        +------------------+
|   modelGroup    |        | focusModelGroup |        |    calibGroup    |
| (Solar System)  |        | (Planet Focus)  |        | (3D Calibration) |
+-----------------+        +-----------------+        +------------------+
  [Active in Main]          [Active in Focus]         [Active in Calib]
```

### 2.1 Step 1 (Fist): 3D Asteroid & Crush/Grab Cue
- **3D Asteroid Object**:
  - *Geometry*: Procedural `DodecahedronGeometry(2.0, 2)` or `IcosahedronGeometry(2.0, 2)`. Vertex positions perturbed along their normals using random noise/displacements to form a rugged, irregular space rock.
  - *Material*: `MeshStandardMaterial({ color: 0x776655, roughness: 0.8, metalness: 0.2, flatShading: true })`.
- **Visual Cue & Interaction Animation**:
  - *Silhouette / Guidance*: A glowing 3D wireframe hand silhouette or pulsing circular target ring (`RingGeometry(2.5, 2.7, 32)`) surrounding the asteroid.
  - *Crush Effect during Sampling*: As samples accumulate (`currentSampleCount` 0 -> 10 in `ml_gesture.js`), the asteroid scales down (e.g. `1.0 -> 0.6`), vibrates with high-frequency micro-jitter, and spawns rock fragment debris using a `THREE.Points` particle system (rock shards bursting outward).

### 2.2 Step 2 (Open Palm): 3D Cloudy Earth & Fog Sweep Cue
- **3D Cloudy Earth Object**:
  - *Core Earth Sphere*: `SphereGeometry(2.0, 32, 32)` with blue/green Earth texture (or reused `planetModelCache[3]` from preloaded `earth.glb`).
  - *Atmospheric Fog Layer*: Outer sphere `SphereGeometry(2.15, 32, 32)` with semi-transparent cloud material (`MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })`) plus a dense cloud particle cloud (`THREE.Points`).
- **Visual Cue & Interaction Animation**:
  - *Silhouette / Guidance*: An animated 3D sweeping arc arrow / open palm wireframe moving side-to-side over the planet.
  - *Sweep/Clear Effect*: As sampling progresses from 0 to 10, the cloud shell opacity lerps smoothly from `0.85 -> 0.0`, while fog particles expand outward and dissipate, revealing the crystal-clear blue Earth beneath.

### 2.3 Step 3 (Pinch): 3D Tiny Moon & Pinch/Zoom Cue
- **3D Tiny Moon Object**:
  - *Geometry & Material*: Small sphere `SphereGeometry(0.8, 32, 32)` with cratered grey surface (`MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 })`) or using preloaded `moon.glb`.
- **Visual Cue & Interaction Animation**:
  - *Silhouette / Guidance*: Two 3D glowing pinch indicators (cyan/green pulse rings) positioned above and below the tiny Moon, squeezing towards the center in a looping animation.
  - *Pinch/Zoom Effect*: When sampling the pinch gesture, the Moon scales up smoothly (from `scale = 0.8` to `scale = 2.5`), accompanied by a radial sparkling ring particle expansion and lens flare glow.

---

## 3. Visual Cues & Animated Hand Silhouettes Implementation

### 3.1 3D Procedural Hand Silhouette (Wireframe/Glow)
- **Structure**: A 21-node `THREE.LineSegments` or `THREE.InstancedMesh` representation of hand landmarks.
- **Pre-defined Pose Animation**:
  - *Fist Pose*: Finger tip nodes contract into palm center.
  - *Open Palm Pose*: Finger tip nodes extend outward with sweeping motion.
  - *Pinch Pose*: Index tip (node 8) and Thumb tip (node 4) move close together.
- **Rendering**: Added directly to `calibGroup` with glowing additive shader or `LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7 })`.

### 3.2 HTML/CSS Overlay Integration (`#tutorial-overlay`)
- Remove static `#tut-gesture-icon` (`🖐`) from `index.html` (line 589).
- Update `#tutorial-overlay` CSS to have a transparent/glassmorphic backdrop (`backdrop-filter: blur(4px); background: rgba(0,0,0,0.4)`), allowing the 3D scene in `#canvas-container` behind it to serve as the visual centerpiece.

---

## 4. Transition Mechanism to Main Solar System View

### 4.1 Calibration Stage State Management
Introduce a clean state controller in `renderer.js`:
```javascript
// State enum: 'CALIBRATION' | 'OVERVIEW' | 'FOCUS'
let appViewState = 'CALIBRATION';
const calibGroup = new THREE.Group();
scene.add(calibGroup);
```

### 4.2 Step-by-Step Transition Sequence
1. **Calibration Active** (`appViewState = 'CALIBRATION'`):
   - `modelGroup.visible = false`
   - `focusModelGroup.visible = false`
   - `calibGroup.visible = true`
   - Calibration camera frames the active step object (Asteroid / Earth / Moon).
2. **Step Completion / Skip**:
   - `finishTutorial()` in `ml_gesture.js` sets `isMlCalibrating = false` and triggers `transitionToMainView()`.
3. **Smooth Transition to Main View**:
   - `calibGroup` scales down to 0 and fades out opacity over 0.6 seconds.
   - `modelGroup` (Solar System) sets `visible = true` with opacity fading in from 0 to 1.
   - Camera position lerps smoothly to `overviewCam` default position `(0, 62.5, 42.5)`.
   - `#tutorial-overlay` adds class `.hidden` (`opacity: 0`, `pointer-events: none`).
   - `appViewState` becomes `'OVERVIEW'`.
   - Main gesture navigation loop takes control seamlessly.

---

## 5. Answers to Key Technical Questions

| Question | Answer | Evidence Location |
|---|---|---|
| **1. Three.js Initialization** | Single `THREE.WebGLRenderer` attached to `#canvas-container`. Uses two perspective cameras (`overviewCam` fov 60, `focusCam` fov 50), ambient + point lights for overview, 5-light studio rig for focus mode. Driven by `requestAnimationFrame(animate)`. | `src/renderer.js:36-62, 1633-1929` |
| **2. Constructing 3D Step Objects** | Procedural geometries (`DodecahedronGeometry` for Asteroid, `SphereGeometry` + cloud shell for Earth, small `SphereGeometry` for Moon) inside a `calibGroup`. Responsive animations driven by ML sample counts (0-10). | `src/renderer.js`, design spec in Section 2 |
| **3. Visual Cues & Silhouettes** | 3D wireframe joint line hands (`THREE.LineSegments`), particle emitters (`THREE.Points` for crush debris / fog sweep / zoom flare), and animated pulse rings (`RingGeometry`). Remove static `#tut-gesture-icon` emoji. | `src/index.html:589`, design spec in Section 3 |
| **4. Scene/Camera Transition** | On `finishTutorial()`, `calibGroup` scales down and fades out, `modelGroup` (Solar System) fades in, and camera smoothly lerps to `overviewCam` position `(0, 62.5, 42.5)`. | `src/renderer.js:808-866, 1716-1724`, `src/ml_gesture.js:333-343` |
| **5. DOM / Canvas Setup** | **Single WebGL canvas** appended to `#canvas-container`. DOM overlays sit on top via CSS z-index. MediaPipe debug camera uses a small separate 2D canvas (`output_canvas`). | `src/index.html:440-448, 679`, `src/renderer.js:50-54` |
