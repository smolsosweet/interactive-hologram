# Reviewer 2 Handoff Report — Milestone 1 (M1: 3D Calibration Scene & Objects Setup)

## Review Summary
**Verdict**: REQUEST_CHANGES

The 3D Calibration Scene & Objects setup in `src/renderer.js` and glassmorphic UI styling in `src/index.html` are visually well-crafted with strong procedural Three.js geometries, textures, particle emitters, and wireframe hand silhouette pose interpolation. Syntax checks pass cleanly. However, a **Major UI state integration bug** in `src/ml_gesture.js` breaks the sampling progress display during active calibration.

---

## Findings

### [Major] Finding 1: `updateTutorialUI()` Unconditionally Overrides Active Sampling UI State
- **Location**: `src/ml_gesture.js`, lines 99–108
- **Why this is a problem**: When `window.startCurrentSample()` is clicked, `window.isMlSamplingActive` is set to `true`, hiding `tut-start-btn` & `tut-skip-btn` and showing `tut-progress-container` & `tut-status`. However, whenever `window.processMLCalibration()` receives a hand landmark frame during sampling, it calls `updateTutorialUI()`. Lines 99–108 in `updateTutorialUI()` unconditionally execute:
  ```javascript
  if (startBtn && progCont && tutStat) {
      startBtn.style.display = 'block';
      if (skipBtn) skipBtn.style.display = 'block';
      progCont.style.display = 'none';
      tutStat.style.display = 'none';
  }
  ```
  Because this code lacks a check for `if (!window.isMlSamplingActive)`, the very first landmark frame processed during active sampling immediately hides the progress bar and status text (`Đang lấy mẫu... (1/10)`) and brings the "Bắt đầu lấy mẫu" button back onto the screen.
- **Suggestion**: Wrap lines 99–108 in `if (!window.isMlSamplingActive) { ... }` so button/progress container visibility is only reset when sampling is NOT active.

### [Minor] Finding 2: Debris Particle Position Accumulation Without Reset on Recalibration
- **Location**: `src/renderer.js`, lines 593–601 & `calibVisuals.reset()` / `setStep()`
- **Why this is a problem**: Asteroid debris particles update their positions incrementally on each frame (`posArr[i * 3] += vel.x * delta * expandFactor * 0.2`). Mutating `debrisGeo.attributes.position.array` in-place without restoring initial position coordinates when `setStep(0)` or `reset()` is called causes debris particles to remain permanently dispersed if calibration is restarted via `window.resetMLCalibration()`.
- **Suggestion**: Maintain a copy of the initial `debrisPositions` array and reassign it to `debrisGeo.attributes.position.array` whenever `setStep(0)` or `reset()` is called.

---

## Verified Claims

1. **Removal of `#tut-gesture-icon`**:
   - `src/index.html`: Line 686 static emoji `<div>` removed. -> **PASS**
   - `src/index.html`: `#tut-gesture-icon` CSS block removed. -> **PASS**
   - `src/ml_gesture.js`: `tutIcon` DOM variable and emoji text assignments removed. -> **PASS**

2. **Glassmorphic `#tutorial-overlay` UI Styling**:
   - `src/index.html`: Lines 580–585 styled with `background: rgba(0,0,0,0.4)` and `backdrop-filter: blur(4px)`. -> **PASS**

3. **3D Objects & Procedural Construction (`calibGroup`)**:
   - Step 1 Asteroid (`DodecahedronGeometry` with perturbed vertices + 140 debris particles). -> **PASS**
   - Step 2 Cloudy Earth (`SphereGeometry` Earth + Cloud shell + 200 fog particles with opacity fade). -> **PASS**
   - Step 3 Tiny Moon (`SphereGeometry` crater texture + dual pulsing target rings). -> **PASS**
   - 3D Wireframe Hand Silhouette (21 joint spheres + 20 line segments lerping between Fist, Open Palm, and Pinch poses). -> **PASS**

4. **Syntax Verification**:
   - Command: `node --check src/ml_gesture.js` -> Exit Code 0 (**PASS**)
   - Command: `powershell -Command "Get-Content src/renderer.js -Raw | node --input-type=module --check"` -> Exit Code 0 (**PASS**)

---

## 1. Observation
- `src/index.html`: Removed static `#tut-gesture-icon` element/CSS. Overlay uses `background: rgba(0,0,0,0.4)` and `backdrop-filter: blur(4px)`.
- `src/ml_gesture.js`: Cleaned up `tutIcon` bindings. `updateTutorialUI()` calls `window.calibVisuals.setStep()` and `window.calibVisuals.setProgress()`. However, lines 99–108 in `updateTutorialUI()` force buttons to `display: block` and progress container to `display: none` without checking `window.isMlSamplingActive`.
- `src/renderer.js`: `calibGroup` created with Asteroid, Cloudy Earth, Tiny Moon, particle emitters, and wireframe hand silhouette pose lerping (`FIST_POSE_LM`, `PALM_POSE_LM`, `PINCH_POSE_LM`). Global control interface `window.calibVisuals` exposed.
- `node --check src/ml_gesture.js` and module check on `src/renderer.js` both exited with code 0.

## 2. Logic Chain
1. Removing `#tut-gesture-icon` cleanly removes static text emojis from HTML/CSS/JS.
2. `calibGroup` in `src/renderer.js` implements procedural 3D objects, particle systems, pulsing rings, and animated wireframe hands natively.
3. In `src/ml_gesture.js`, `updateTutorialUI()` is called from `processMLCalibration()` on every frame while landmarks are being collected.
4. Because `updateTutorialUI()` unconditionally sets `progCont.style.display = 'none'` and `startBtn.style.display = 'block'`, active sampling breaks the UI progress display by hiding the progress bar and un-hiding the start button on the first frame.
5. Therefore, the implementation requires a minor fix to guard `updateTutorialUI()`'s UI reset logic with `if (!window.isMlSamplingActive)`.

## 3. Caveats
- No caveats. Codebase functionality and 3D graphics were evaluated directly against source files and syntax compilers.

## 4. Conclusion
Milestone 1 implementation is visually rich and structurally complete in 3D construction, but requires a fix for the UI state reset bug in `updateTutorialUI()` before approval. Verdict: **REQUEST_CHANGES**.

## 5. Verification Method
1. Re-run syntax check commands:
   - `node --check src/ml_gesture.js`
   - `powershell -Command "Get-Content src/renderer.js -Raw | node --input-type=module --check"`
2. Inspect `src/ml_gesture.js` lines 99–108 to confirm `if (!window.isMlSamplingActive)` guard is added around the button/container display reset.
