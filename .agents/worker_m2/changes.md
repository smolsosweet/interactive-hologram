# Changes — Milestone 2 (M2: Gamified Calibration Flow & ML Integration)

## Files Modified

### 1. `src/ml_gesture.js`
- **Step-to-Label Mapping**: Fixed `targetLabel` calculation in `processMLCalibration`:
  - Step 0 (Fist) -> Label `0`
  - Step 1 (Open Palm) -> Label `2`
  - Step 2 (Pinch) -> Label `5`
- **3D Visual Progress Synchronization**:
  - `startTutorialStep(step)` calls `window.calibVisuals.setStep(step)` and `window.calibVisuals.setProgress(0.0)`.
  - `processMLCalibration()` extracts features, updates `window.mlSamples[targetLabel]`, calculates sampling progress `Math.min(1.0, currentSampleCount / 10)`, updates 3D visual progress `window.calibVisuals.setProgress(progress)`, and refreshes DOM overlay UI.
- **Sampling Activation & Step Progression**:
  - `startCurrentSample()` sets `isMlSamplingActive = true` and updates tutorial UI.
  - When `currentSampleCount >= 10`: resets `isMlSamplingActive = false`, advances to `startTutorialStep(step + 1)` (for steps 0 and 1) or schedules `trainMLModel()` (for step 2).
- **Environment Safety & Global Exposure**:
  - Exposed `window.trainMLModel = trainMLModel` to allow external interception/invocation.
  - Guarded Electron `ipcRenderer` calls (`log-stresstest`, `exportToOpenVINO`, `predictMLGestureSync`) inside `try/catch` checks for non-Electron Node test environments.

### 2. `.agents/worker_m2/test_m2_flow.js` (New File)
- Built empirical Node.js test script mocking MediaPipe 21 hand landmarks and 3D visual callbacks (`calibVisuals`).
- Simulates 10 sampling frames for Step 0, 10 frames for Step 1, and 10 frames for Step 2.
- Verifies vector collection into `window.mlSamples` (`{ 0: 10, 2: 10, 5: 10 }`), 3D step transitions, progress updates, and clean trigger of `trainMLModel()`.

## Verification Summary
- `node --check src/ml_gesture.js`: PASS (Exit code 0)
- `powershell -Command "Get-Content src/renderer.js -Raw | node --input-type=module --check"`: PASS (Exit code 0)
- `node .agents/worker_m2/test_m2_flow.js`: PASS (Exit code 0, 30 sample vectors collected, 3D visual step lerps executed, model trained successfully)
