# Detailed Analysis of ML Calibration Logic & Flow

## Executive Summary
This document provides a complete technical analysis of the ML gesture calibration subsystem in HoloLearn (`d:\test_planets`). The investigation covers `src/ml_gesture.js`, `src/renderer.js`, `src/index.html`, `main.js`, and `ORIGINAL_REQUEST.md`.

The goal of the overall project milestone is to replace the static emoji overlay (`tut-gesture-icon`) with a gamified, interactive 3D Three.js "Astronaut Training" flow across 3 visual steps (Step 1: Asteroid / Fist, Step 2: Cloudy Earth / Open Palm, Step 3: Tiny Moon / Pinch), while preserving the underlying ML sampling and model training pipeline.

---

## 1. Full Lifecycle of ML Calibration (`ml_gesture.js`)

### Global State Variables
- `window.mlTutorialStep`: Integer step index (`-1`: inactive/done, `0`: Step 1 - Fist/Nắm tay, `1`: Step 2 - Open Palm/Xòe tay, `2`: Step 3 - Pinch/Chụm tay).
- `window.isMlCalibrating`: Boolean flag indicating if calibration mode is active. When `true`, MediaPipe frame processing in `renderer.js` directs landmarks exclusively to `window.processMLCalibration`.
- `window.isMlSamplingActive`: Boolean flag controlling active frame recording for the current step. Initialized to `false` when step starts; set to `true` when `window.startCurrentSample()` is called.
- `window.mlSamples`: Object storing collected feature arrays per gesture label: `{ 0: [], 2: [], 5: [] }` (label `0` = Fist, `5` = Open Palm, `2` = Pinch).
- `window.mlModel`: Holds the trained TensorFlow.js sequential model object.
- `window.useFallbackRuleBased`: Boolean flag set to `true` if user skips tutorial or training fails.

### Complete Lifecycle Step-by-Step

1. **Initialization (`initMLTutorial`)**:
   - `initMLTutorial()` (lines 20–36) grabs DOM references (`tutOverlay`, `tutTitle`, `tutDesc`, `tutIcon`, `tutProgressBar`, `tutStatus`, `tutTimeoutText`).
   - Checks if `document.body.classList.contains('hologram-mode')`. If yes, skips tutorial by calling `finishTutorial(true)`.
   - Otherwise, invokes `startTutorialStep(0)`.

2. **Step Start (`startTutorialStep(step)`)**:
   - Sets `window.mlTutorialStep = step`, `window.isMlCalibrating = true`, `window.isMlSamplingActive = false`, and resets `currentSampleCount = 0` (lines 38–55).
   - Removes `.hidden` from `#tutorial-overlay`.
   - Calls `updateTutorialUI()` to show prompt and reset buttons/progress.
   - Sets a 15-second inactivity timer (`TIMEOUT_MS = 15000`). If `isMlSamplingActive` is still `false` when timer fires, auto-triggers `window.skipTutorial()`.

3. **Sampling Activation (`window.startCurrentSample()`)**:
   - Called when user clicks `#tut-start-btn` (lines 63–72).
   - Clears `tutorialTimer`.
   - Sets `window.isMlSamplingActive = true`.
   - Hides `#tut-start-btn` and `#tut-skip-btn`; displays `#tut-progress-container` and `#tut-status`.

4. **Frame Processing & Data Collection (`window.processMLCalibration`)**:
   - Invoked every video frame by MediaPipe `onResults` in `renderer.js` (lines 105–138 in `ml_gesture.js`).
   - If `isMlSamplingActive` is `true`, extracts 63-element feature vector from hand landmarks, pushes it to `window.mlSamples[targetLabel]`, and increments `currentSampleCount`.
   - Updates progress UI (`updateTutorialUI()`).
   - When `currentSampleCount >= 10`:
     - Sets `isMlSamplingActive = false`.
     - If `mlTutorialStep < 2`: calls `startTutorialStep(window.mlTutorialStep + 1)`.
     - If `mlTutorialStep === 2`: displays "Đang huấn luyện AI...", sets progress bar to 100%, and schedules `trainMLModel()` via `setTimeout(trainMLModel, 100)`.

5. **Model Training & Validation (`trainMLModel` & `runStressTest`)**:
   - Performs Z-axis rotation data augmentation (±10°, ±20°), generating 5x samples (150 total samples from 30 raw captures) (lines 140–198).
   - Builds TF.js Dense Neural Network: `[63] -> Dense(32, relu) -> Dense(16, relu) -> Dense(3, softmax)`.
   - Fits model with Adam optimizer (`lr=0.01`, `epochs=40`, `batchSize=16`).
   - Runs `runStressTest()` (lines 211–287) evaluating model accuracy under ±20° variation. If accuracy >= 90%, attempts backend OpenVINO export (`exportToOpenVINO()`).
   - Invokes `finishTutorial(false)`.

6. **Completion / Teardown (`finishTutorial`)**:
   - Clears active timer.
   - Sets `window.isMlCalibrating = false` and `window.mlTutorialStep = -1` (lines 333–343).
   - Sets `window.useFallbackRuleBased` to `fallback` boolean parameter (`true` if skipped/failed, `false` if trained).
   - Adds `.hidden` class to `#tutorial-overlay`.

7. **User Skip (`window.skipTutorial`)**:
   - Triggered via `#tut-skip-btn` or 15s inactivity timeout (lines 57–61).
   - Calls `finishTutorial(true)`, falling back to rule-based hand geometry classification.

---

## 2. Sample Collection & Feature Extraction Mechanics

### Sample Requirements
- **Samples needed per step**: `SAMPLES_NEEDED = 10` samples.
- **Total raw samples**: 30 samples total across 3 steps (10 per gesture class).
- **Label Mapping**:
  - Step 0 (Fist): `targetLabel = 0`
  - Step 1 (Open Palm): `targetLabel = 5`
  - Step 2 (Pinch): `targetLabel = 2`

### Landmark Processing (`extractFeatures(landmarks, isRight)`)
Located in `src/ml_gesture.js` (lines 395–414):
1. **Validation**: Requires exactly 21 MediaPipe hand landmarks.
2. **Wrist Normalization**: Uses wrist (landmark 0) as coordinate origin. Subtracts `wrist.x`, `wrist.y`, `wrist.z` from each landmark.
3. **Left Hand Mirroring**: If `isRight === false`, inverts x-coordinate (`(lm.x - wrist.x) * -1`) so left hand features match right hand representation.
4. **Scale Normalization**: Computes Euclidean distance from wrist to Middle MCP (landmark 9) as `scale`. Divides all `(x, y, z)` coordinates by `scale`.
5. **Flattening**: Returns a 63-element 1D array (`[x0, y0, z0, x1, y1, z1, ..., x20, y20, z20]`).

---

## 3. `updateTutorialUI()` & Strategy for 3D Step Transitions

### Current DOM-based UI Updates
Currently, `updateTutorialUI()` in `src/ml_gesture.js` (lines 74–102) modifies static HTML text and emojis:
- Step 0: Title = "Bước 1: Nắm tay", Desc = "Vui lòng đưa tay vào camera và NẮM CHẶT TAY.", Icon = "👊".
- Step 1: Title = "Bước 2: Xòe tay", Desc = "Vui lòng XÒE RỘNG BÀN TAY của bạn ra.", Icon = "🖐".
- Step 2: Title = "Bước 3: Chụm tay (Pinch)", Desc = "Chụm 2 ĐẦU NGÓN TAY (Cái & Trỏ) vào nhau để Zoom.", Icon = "✌️".
- Status & Progress: `#tut-status` text (`Đang lấy mẫu... (X/10)`) and `#tut-progress-bar` width.

### Replacement / 3D Integration Architecture
Per `ORIGINAL_REQUEST.md` (R1, R2, R3), the static emoji `#tut-gesture-icon` must be removed/replaced with dynamic 3D Three.js visual objects:
- **Step 1 (Fist)**: Render 3D Asteroid object with visual cue to "crush" / "grab".
- **Step 2 (Open Palm)**: Render 3D Cloudy Earth object with visual cue to "sweep" / "clear" fog.
- **Step 3 (Pinch)**: Render 3D Tiny Moon object with visual cue to "pinch" and zoom.

### Implementation Strategy
1. **Decouple UI from Hardcoded Emojis**:
   - Replace `#tut-gesture-icon` DOM updates in `updateTutorialUI()` with a state event or callback hook (e.g. `if (window.onCalibrationStepChange) window.onCalibrationStepChange(window.mlTutorialStep, currentSampleCount)`).
2. **Three.js Calibration Overlay / Scene Manager**:
   - A dedicated 3D scene module (or renderer integration) listens to step changes.
   - Dynamically transitions 3D models (Asteroid -> Cloudy Earth -> Tiny Moon) with smooth entry/exit animations.
   - Interacts with landmark stream or sample progress to display 3D visual feedback (e.g., asteroid crushing animation as samples increase, fog clearing as samples increase, moon scaling as samples increase).
3. **Minimal Text & Gamified HUD**:
   - Keep text minimal for target demographic (ages 6–15). Rely on 3D objects, visual hand silhouettes, and smooth progress indicators.

---

## 4. Progress Bars and Status Updates During Sampling

### State Flow During Sampling
1. **Pre-sampling (Step initialized)**:
   - `startTutorialStep(step)` calls `updateTutorialUI()`.
   - `startBtn` & `skipBtn` displayed (`display: block`).
   - `progCont` & `tutStat` hidden (`display: none`).
   - Progress bar width = `0%`. Status text = `Đang lấy mẫu... (0/10)`.

2. **Sampling active (`startCurrentSample()`)**:
   - `isMlSamplingActive` set to `true`.
   - `startBtn` & `skipBtn` hidden (`display: none`).
   - `progCont` & `tutStat` unhidden (`display: block`).

3. **Per-frame Sampling (`processMLCalibration`)**:
   - Landmark feature pushed to `window.mlSamples`.
   - `currentSampleCount` incremented.
   - `updateTutorialUI()` updates progress bar width: `(currentSampleCount / 10) * 100 + "%"`.
   - `#tut-status` text updated: `Đang lấy mẫu... (${currentSampleCount}/10)`.

4. **Step Completion**:
   - When `currentSampleCount === 10`, sampling stops for current step, and flow transitions to next step or training.

---

## 5. Event and Callback Flow for Step Transitions

| Event / Trigger | Triggering Location | Action / State Change | Next State |
|---|---|---|---|
| App Load (`DOMContentLoaded`) | `renderer.js:417` | Calls `window.initMLTutorial()` | Checks hologram mode; calls `startTutorialStep(0)` |
| Start Step 0 | `ml_gesture.js:35` | `mlTutorialStep = 0`, `isMlCalibrating = true` | Shows `#tutorial-overlay`, displays Start/Skip buttons |
| User clicks "Bắt đầu lấy mẫu" | `#tut-start-btn` onclick | Calls `window.startCurrentSample()` | `isMlSamplingActive = true`, progress bar visible |
| 10 Samples Collected (Step 0) | `ml_gesture.js:127` | `currentSampleCount >= 10` | Calls `startTutorialStep(1)` |
| 10 Samples Collected (Step 1) | `ml_gesture.js:127` | `currentSampleCount >= 10` | Calls `startTutorialStep(2)` |
| 10 Samples Collected (Step 2) | `ml_gesture.js:130` | `currentSampleCount >= 10` & `step === 2` | Displays "Đang huấn luyện AI...", runs `trainMLModel()` |
| Training Completed | `ml_gesture.js:204` | `trainMLModel()` completes fit & stress test | Calls `finishTutorial(false)` |
| User clicks "Bỏ qua" / Inactivity | `#tut-skip-btn` / 15s Timer | Calls `window.skipTutorial()` | Calls `finishTutorial(true)` |
| Tutorial Finished | `ml_gesture.js:333` | `finishTutorial()` | `isMlCalibrating = false`, `mlTutorialStep = -1`, hides `#tutorial-overlay` |

---

## 6. Mode Transition: Calibration Mode vs. Normal Control Mode in `renderer.js`

### Calibration Mode Active (`window.isMlCalibrating === true`)
- In `renderer.js` MediaPipe `onResults` function (lines 1230–1238):
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
- **Crucial Behavior**: When `isMlCalibrating` is `true`, execution inside `onResults` returns early IMMEDIATELY after calling `processMLCalibration`.
- Consequently, all normal gesture interactions (rotating 3D solar system, 2-fist panning, pinch zooming, finger selection, planet focus view) are COMPLETELY BLOCKED.

### Transition Trigger
- When `finishTutorial()` is executed (in `ml_gesture.js`), it sets `window.isMlCalibrating = false` and `window.mlTutorialStep = -1`, and hides `#tutorial-overlay`.

### Normal Control Mode Active (`window.isMlCalibrating === false`)
- Subsequent calls to `onResults` bypass the `if (window.isMlCalibrating)` check.
- `onResults` parses left/right hand landmarks, calls `checkFist`, `checkPinch`, `countFingersAll`, and `window.predictMLGestureSync(lm, isRight)`.
- If custom model was trained (`useFallbackRuleBased === false`), `predictMLGestureSync` uses `window.mlModel` (TF.js) or OpenVINO backend for gesture predictions.
- `animate()` render loop seamlessly controls 3D solar system rotation, focus mode zoom/pan, and UI HUD updates.

---

## Summary Matrix of Key Functions & Globals

| Function / Global | File | Purpose / Role |
|---|---|---|
| `window.mlTutorialStep` | `ml_gesture.js` | Current step index (-1: done, 0: Fist, 1: Open Palm, 2: Pinch) |
| `window.isMlCalibrating` | `ml_gesture.js` | Flag gating MediaPipe frame routing to calibration vs normal control |
| `window.isMlSamplingActive` | `ml_gesture.js` | Flag gating active feature vector extraction per step |
| `window.mlSamples` | `ml_gesture.js` | Storage for 63-dim feature vectors: `{ 0: [], 2: [], 5: [] }` |
| `window.startCurrentSample` | `ml_gesture.js` | Activates sampling for current step |
| `window.processMLCalibration` | `ml_gesture.js` | Per-frame landmark extractor, sample accumulator, and step advancer |
| `trainMLModel` | `ml_gesture.js` | Augments data, fits TF.js sequential model, triggers stress test & OV export |
| `finishTutorial` | `ml_gesture.js` | Resets calibrating flags, unblocks normal gesture control |
| `onResults` | `renderer.js` | MediaPipe callback; routes frames to calibration or gesture controller |
