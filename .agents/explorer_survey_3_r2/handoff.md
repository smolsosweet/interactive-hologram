# Handoff Report: ML Calibration & Flow Analysis (Explorer 3)

## 1. Observation
Target repository: `d:\test_planets`
Investigated files: `d:\test_planets\.agents\ORIGINAL_REQUEST.md`, `src/ml_gesture.js`, `src/renderer.js`, `src/index.html`, `main.js`.

### Direct Code Quotes & File Locations:

1. **State & Control Flags in `src/ml_gesture.js` (lines 6–11)**:
   ```javascript
   window.mlModel = null;
   window.isMlCalibrating = false;
   window.mlTutorialStep = -1; // -1: Done/Hidden, 0: Nắm tay, 1: Xòe tay, 2: Pinch
   window.mlSamples = { 0: [], 2: [], 5: [] }; 
   window.useFallbackRuleBased = false;
   window.isMlSamplingActive = false;
   ```

2. **Step Start and UI Updating (`src/ml_gesture.js`, lines 38–55, 74–102)**:
   - `startTutorialStep(step)` sets `window.mlTutorialStep = step`, `window.isMlCalibrating = true`, `window.isMlSamplingActive = false`, `currentSampleCount = 0`, removes `.hidden` from `tutOverlay`, updates UI, and sets a 15-second inactivity timeout.
   - `updateTutorialUI()` updates DOM elements `#tut-title`, `#tut-desc`, `#tut-gesture-icon` (using text emojis `👊`, `🖐`, `✌️`), `#tut-status`, `#tut-progress-bar`.

3. **Sampling Activation & Landmark Collection (`src/ml_gesture.js`, lines 63–72, 105–138)**:
   - `window.startCurrentSample()` sets `window.isMlSamplingActive = true`, hides start/skip buttons, and shows progress bar/status.
   - `window.processMLCalibration(landmarks, isRight)` extracts 63 normalized landmark features via `extractFeatures(landmarks, isRight)`, pushes them to `window.mlSamples[targetLabel]`, increments `currentSampleCount`, updates UI, and advances steps when `currentSampleCount >= 10`.

4. **MediaPipe Frame Routing (`src/renderer.js`, lines 1230–1238)**:
   ```javascript
   if (window.isMlCalibrating) {
       if (results.multiHandLandmarks.length > 0) {
           if (typeof window.processMLCalibration === 'function') {
               const isRight = isRightHand(results.multiHandedness[0]);
               window.processMLCalibration(results.multiHandLandmarks[0], isRight);
           }
       }
       canvasCtx.restore();
       return;
   }
   ```

5. **Completion & Mode Switching (`src/ml_gesture.js`, lines 333–343)**:
   ```javascript
   function finishTutorial(fallback) {
       clearTimeout(tutorialTimer);
       window.isMlCalibrating = false;
       window.mlTutorialStep = -1;
       if (fallback) {
           window.useFallbackRuleBased = true;
       } else {
           window.useFallbackRuleBased = false;
       }
       if (tutOverlay) tutOverlay.classList.add('hidden');
   }
   ```

6. **Original User Request Requirements (`ORIGINAL_REQUEST.md`, lines 14–32)**:
   - R1: Replace static emoji calibration overlay with 3-step interactive flow integrated with `window.startCurrentSample()`.
   - R2: Visual steps using Three.js: Step 1 (Fist - Asteroid), Step 2 (Open Palm - Cloudy Earth), Step 3 (Pinch - Tiny Moon).
   - R3: Minimal text, no static `tut-gesture-icon`.

---

## 2. Logic Chain

1. **Observation 1 & 4**: `renderer.js` checks `window.isMlCalibrating`. While `true`, frame execution returns early and routes landmarks directly to `window.processMLCalibration`.
2. **Observation 1 & 3**: When `window.startCurrentSample()` is called, `isMlSamplingActive` becomes `true`, enabling `window.processMLCalibration` to record 10 samples per step (30 total across steps 0, 1, 2) into `window.mlSamples`.
3. **Observation 2 & 6**: `updateTutorialUI()` currently sets DOM emoji text (`tut-gesture-icon`). To fulfill `ORIGINAL_REQUEST.md` (R1–R3), `updateTutorialUI()` or a callback registered on step changes must drive Three.js 3D objects (Asteroid for Step 0, Cloudy Earth for Step 1, Tiny Moon for Step 2) while progress bars or 3D visual progress track `currentSampleCount / 10`.
4. **Observation 3, 4 & 5**: Upon reaching 10 samples in Step 2, `processMLCalibration` triggers `trainMLModel()`, which after fitting/stress test calls `finishTutorial(false)`. `finishTutorial` sets `isMlCalibrating = false`, hiding `#tutorial-overlay`. This immediately unlocks normal gesture control in `renderer.js:1230` without needing changes to the core MediaPipe pipeline.

---

## 3. Caveats
- **OpenVINO Native Node Addon Dependency**: OpenVINO backend export (`exportToOpenVINO`) depends on `openvino-node` in `main.js`. If `openvino-node` fails or is absent, execution falls back cleanly to the TF.js model in renderer memory.
- **Hardware Camera Constraints**: Camera initialization in `renderer.js` attempts auto-selection of external/laptop camera. Sampling requires a valid camera feed emitting MediaPipe hand landmarks.

---

## 4. Conclusion
The calibration subsystem is cleanly isolated through two global state variables: `window.isMlCalibrating` and `window.isMlTutorialStep`. 

To implement the gamified 3D Astronaut Training flow required by `ORIGINAL_REQUEST.md`:
1. The implementer can preserve `ml_gesture.js` data gathering logic (`processMLCalibration`, `mlSamples`, `trainMLModel`, `startCurrentSample`).
2. Remove static emoji `#tut-gesture-icon` from HTML/JS and replace DOM text updates with dynamic Three.js 3D objects (Asteroid, Cloudy Earth, Tiny Moon).
3. Connect step state changes (`window.mlTutorialStep` 0, 1, 2) and sampling progress (`currentSampleCount / 10`) to update 3D scene objects and visual cues.
4. Transitioning out of calibration mode requires only calling `finishTutorial()`, which sets `isMlCalibrating = false` and automatically resumes normal gesture control in `renderer.js`.

---

## 5. Verification Method

### Local Inspection & Tracing
1. Inspect `src/ml_gesture.js`:
   - Verify `startTutorialStep(step)` sets `window.mlTutorialStep = step` and `window.isMlCalibrating = true`.
   - Verify `window.startCurrentSample()` sets `window.isMlSamplingActive = true`.
   - Verify `window.processMLCalibration` accumulates 10 samples per step into `window.mlSamples`.
2. Inspect `src/renderer.js`:
   - Verify `if (window.isMlCalibrating)` at line 1230 correctly routes MediaPipe landmarks to `processMLCalibration` during calibration.
   - Verify that setting `window.isMlCalibrating = false` allows frame processing to fall through to normal gesture control (`checkFist`, `checkPinch`, etc.).

### Invalidation Conditions
- If `window.isMlCalibrating` is cleared before training finishes, frame processing will trigger normal gesture control prematurely.
- If `extractFeatures` signature or output length (63 floats) is altered, `trainMLModel` tensor shapes (`[63]`) will fail.
