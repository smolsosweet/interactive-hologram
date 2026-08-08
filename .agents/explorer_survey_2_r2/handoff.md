# Handoff Report: Three.js Scene Setup & 3D Astronaut Training Exploration

## 1. Observation

### 1.1 Requirements Context (`d:\test_planets\.agents\ORIGINAL_REQUEST.md`)
- **R1 (Gamified Flow)**: "Replace the current static emoji calibration overlay in `index.html` and `renderer.js` with a 3-step interactive flow. The flow must integrate seamlessly with the existing ML sampling logic (`window.startCurrentSample()`)." (lines 14-15)
- **R2 (Visual Steps)**:
  - Step 1 (Fist): 3D asteroid + "crush" / "grab" cue / hand silhouette. (line 19)
  - Step 2 (Open Palm): 3D foggy/cloudy Earth + "sweep" / "clear" fog cue / hand silhouette. (line 20)
  - Step 3 (Pinch): 3D tiny Moon + "pinch" / zoom cue / hand silhouette. (line 21)
- **R3 (Minimal Text)**: "The UI must rely primarily on visual 3D animations and hand silhouettes rather than text instructions..." (lines 23-24)
- **Acceptance Criteria**:
  - `tut-gesture-icon` is removed. (line 29)
  - 3 visual training steps (Asteroid, Cloudy Earth, Tiny Moon) implemented using Three.js geometries/materials. (line 30)
  - Calibration sequence finishes and transitions smoothly to main HoloLearn solar system view. (line 32)

### 1.2 Canvas & DOM Architecture (`d:\test_planets\src\index.html` & `src/renderer.js`)
- Container element: `<div id="canvas-container"></div>` (`src/index.html:679`).
- Renderer initialization in `src/renderer.js`:
  ```javascript
  36: const container = document.getElementById('canvas-container');
  37: const scene = new THREE.Scene();
  ...
  50: const threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  51: threeRenderer.setSize(container.clientWidth, container.clientHeight);
  52: threeRenderer.setPixelRatio(window.devicePixelRatio);
  53: threeRenderer.outputEncoding = THREE.sRGBEncoding;
  54: container.appendChild(threeRenderer.domElement);
  ```
- Overlay element in `src/index.html`:
  ```html
  581: <div id="tutorial-overlay" class="hidden">
  ...
  589:     <div id="tut-gesture-icon">🖐</div>
  ```

### 1.3 Scene Groups, Lighting, & Cameras (`d:\test_planets\src\renderer.js`)
- Overview Camera (`lines 42-45`):
  ```javascript
  const overviewCam = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 8000);
  overviewCam.position.set(0, 62.5, 42.5);
  ```
- Focus Camera (`line 48`):
  ```javascript
  const focusCam = new THREE.PerspectiveCamera(50, 1, 0.01, 5000);
  ```
- Main Scene Groups (`lines 249-251, 270-272`):
  - `modelGroup`: solar system model group added to `scene`.
  - `focusModelGroup` & `focusSpinner`: single-planet focus mode groups added to `scene`.
- Animation Loop (`lines 1633-1829`):
  `animate()` runs every frame via `requestAnimationFrame(animate)`. Updates mixers, orbits, zoom/pan lerps, idle timer, and calls `renderFrame()`.
- Scissor / Render Pipeline (`lines 1834-1929`):
  `renderFrame()` checks `transitionProgress` and renders `overviewCam` or `focusCam` with optional `setScissorTest(true)` for transition wipe effects.

### 1.4 ML Calibration Integration (`d:\test_planets\src\ml_gesture.js`)
- Calibration Lifecycle (`src/ml_gesture.js`):
  - `initMLTutorial()` (line 20) starts tutorial step 0.
  - `startTutorialStep(step)` (line 38) sets `window.mlTutorialStep = step`, `window.isMlCalibrating = true`, `window.isMlSamplingActive = false`.
  - `window.startCurrentSample()` (line 63) sets `window.isMlSamplingActive = true`.
  - `window.processMLCalibration(landmarks, isRight)` (line 105) accumulates 10 landmark samples for each step.
  - `finishTutorial(fallback)` (line 333) hides `#tutorial-overlay` and sets `window.isMlCalibrating = false`.

---

## 2. Logic Chain

1. **Single Canvas Suitability**:
   - *Observation*: `src/renderer.js` instantiates a single `WebGLRenderer` attached to `#canvas-container` (`lines 50-54`), rendering to a single canvas at 60 FPS.
   - *Reasoning*: Constructing a separate canvas for calibration would create unnecessary WebGL context overhead and visual mismatch. Therefore, all 3D calibration visuals should be added to a dedicated group (`calibGroup`) within the existing Three.js `scene`.

2. **3D Training Object Construction**:
   - *Observation*: Requirements R2 specify Asteroid for Fist, Cloudy Earth for Open Palm, Tiny Moon for Pinch.
   - *Reasoning*:
     - **Asteroid**: Can be procedurally created using `DodecahedronGeometry` with vertex normal perturbations, styled with a low-poly dark grey `MeshStandardMaterial`. Sampling progress (0-10) scales the asteroid down with rock debris particles (`THREE.Points`).
     - **Cloudy Earth**: Can combine a `SphereGeometry` Earth base with an atmospheric cloud shell sphere (`transparent: true, opacity: 0.85`) and particle fog. Sampling progress reduces cloud opacity to 0.0 (clearing fog).
     - **Tiny Moon**: Can use a small cratered sphere `SphereGeometry(0.8)` with dual glowing 3D pinch ring cues. Sampling progress scales up the Moon with a sparkling particle ring flare.

3. **Visual Cues & Emoji Removal**:
   - *Observation*: `tut-gesture-icon` contains static emoji `🖐` in `src/index.html:589`.
   - *Reasoning*: Removing `#tut-gesture-icon` and styling `#tutorial-overlay` with a transparent glassmorphic overlay allows 3D animated visual cues (wireframe hand silhouettes, particle effects, and 3D pulse rings in `calibGroup`) to guide young users (ages 6-15) intuitively without relying on dense text.

4. **Smooth Transition to Main View**:
   - *Observation*: `finishTutorial()` in `src/ml_gesture.js:333` completes calibration, while `src/renderer.js:1716-1724` controls view transitions via `transitionProgress` and `modelGroup.visible`.
   - *Reasoning*: When calibration finishes, fading out `calibGroup`, fading in `modelGroup`, and lerping the camera to `overviewCam` position `(0, 62.5, 42.5)` creates a seamless transition directly into the main interactive solar system view without reloads.

---

## 3. Caveats

- **No Code Implementation**: This investigation is strictly read-only. Implementation must be carried out by the Implementer agent.
- **Model Load Timing**: `solar_system.glb` and planet models are loaded asynchronously (`loadSolarSystem()`, `preloadPlanetModels()`). `calibGroup` procedural objects do not rely on external GLTF models and can render immediately upon app startup.
- **Performance Considerations**: Particle systems (`THREE.Points`) used for fog sweep and rock debris must keep particle counts reasonable (~200-500 particles) to maintain 60 FPS on integrated GPUs.

---

## 4. Conclusion

1. **Architecture Ready**: The existing single WebGL canvas setup in `src/renderer.js` and HTML overlay structure in `src/index.html` cleanly support integrating a 3D visual calibration group (`calibGroup`).
2. **Procedural 3D Objects**: The 3 visual steps (Asteroid, Cloudy Earth, Tiny Moon) can be procedurally generated with standard Three.js geometries/materials and animated based on `currentSampleCount` (0-10) from `ml_gesture.js`.
3. **Seamless Transition**: Calibration completion cleanly triggers a fade-out of `calibGroup` and a smooth camera lerp to the main solar system `overviewCam` view.

---

## 5. Verification Method

To verify these findings and subsequent implementation:
1. **File Inspection**:
   - Check `d:\test_planets\src\renderer.js` for `threeRenderer` setup (`lines 50-54`) and `animate()` loop (`lines 1633-1829`).
   - Check `d:\test_planets\src\index.html` for `#canvas-container` (`line 679`) and `#tutorial-overlay` (`line 581`).
   - Check `d:\test_planets\src\ml_gesture.js` for `processMLCalibration` (`line 105`) and `finishTutorial` (`line 333`).
2. **Execution Check**:
   - Launch app via `npm start` or Electron runtime in `d:\test_planets`.
   - Observe calibration startup, 3D training object animations per gesture step, and smooth camera transition upon calibration completion.
