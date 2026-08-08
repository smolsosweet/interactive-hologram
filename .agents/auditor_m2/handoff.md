# Forensic Audit Report — Milestone 2 (M2: Gamified Calibration Flow & ML Integration)

**Work Product**: Milestone 2 Implementation (`src/ml_gesture.js`, `src/renderer.js`, `.agents/worker_m2/test_m2_flow.js`)  
**Profile**: General Project (Integrity Mode: `development` as specified in `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**

---

### Phase Results
- **Check 1: Prohibited Facade & Fake Mock Verification**: **PASS** — No hardcoded training samples, fake model accuracy mocks, or dummy training facades were found. Data structure `window.mlSamples` starts empty `{ 0: [], 2: [], 5: [] }` and accumulates live extracted features. TF.js model compiles, trains dynamically with 40 epochs on augmented sample tensors, and evaluates real model outputs in `runStressTest()`.
- **Check 2: Feature Computation Verification**: **PASS** — `extractFeatures(landmarks, isRight)` processes 21 3D MediaPipe hand landmarks, applies wrist-relative translation, left-hand mirroring, and scale normalization, generating a 63-element float array (21 landmarks × 3 coordinates `[x, y, z]`). `processMLCalibration` pushes this exact 63-feature array to `window.mlSamples[targetLabel]`.
- **Check 3: Gesture Class Index & Label Mapping Verification**: **PASS** — Step 0 (Fist) maps to `targetLabel = 0` (softmax index 0), Step 1 (Open Palm) maps to `targetLabel = 2` (softmax index 1), and Step 2 (Pinch) maps to `targetLabel = 5` (softmax index 2). `predictMLGestureSync` and `runStressTest` translate softmax argMax results [0, 1, 2] back to target gesture labels [0, 2, 5] consistently.
- **Check 4: Syntax & Empirical Execution Verification**: **PASS** — `node --check src/ml_gesture.js`, `powershell -Command "Get-Content src/renderer.js -Raw | node --input-type=module --check"`, and `node .agents/worker_m2/test_m2_flow.js` all executed with exit code 0.

---

## 1. Observation
1. **Source Code Inspection (`src/ml_gesture.js`)**:
   - `window.mlSamples` is initialized at line 9 as `{ 0: [], 2: [], 5: [] }` and reset at line 456.
   - `extractFeatures(landmarks, isRight)` (lines 433–452) validates `landmarks.length === 21`, subtracts wrist `landmarks[0]` from each coordinate, mirrors `x` if `isRight === false`, scales by wrist-to-middle-MCP distance (`normalized[9]`), and pushes 63 numbers (`21 * 3`) into `features`.
   - `processMLCalibration(landmarks, isRight)` (lines 117–161) maps Step 0 -> `targetLabel = 0`, Step 1 -> `targetLabel = 2`, Step 2 -> `targetLabel = 5`, pushes the 63-element feature vector to `window.mlSamples[targetLabel]`, calls `window.calibVisuals.setProgress()`, and triggers `window.trainMLModel()` on step 2 completion.
   - `trainMLModel()` (lines 163–232) builds a real 3-layer neural network with input shape `[63]`, dense layers of `32`, `16`, and `3` units (softmax), compiles with Adam optimizer (`lr=0.01`, `loss='categoricalCrossentropy'`), and trains asynchronously for 40 epochs on augmented sample tensors.
   - `runStressTest()` (lines 234–314) runs actual tensor predictions via `window.mlModel.predict(xs)`, extracts `argMaxes`, and computes empirical accuracy over rotated test features.

2. **Syntax and Command Execution**:
   - `node --check src/ml_gesture.js`: Exit Code 0.
   - `powershell -Command "Get-Content src/renderer.js -Raw | node --input-type=module --check"`: Exit Code 0.
   - `node .agents/worker_m2/test_m2_flow.js`: Exit Code 0. Output confirmed collection of 10 samples per step (`{"0":10,"2":10,"5":10}`), 3D visual step switching (`setStep(0)` -> `setStep(1)` -> `setStep(2)`), progress callbacks, and successful invocation of `trainMLModel()`.

---

## 2. Logic Chain
1. **Premise**: In an authentic ML integration, training data must be dynamically derived from real/simulated 21-landmark MediaPipe inputs, mapped to correct gesture indices, and used to train a genuine TF.js classifier.
2. **Observation 1**: `extractFeatures` calculates 63 floats (`21 * 3`) per frame using wrist-relative translation and middle-MCP scaling.
3. **Observation 2**: `processMLCalibration` populates `window.mlSamples` under keys `0` (Fist), `2` (Open Palm), and `5` (Pinch).
4. **Observation 3**: `trainMLModel()` constructs `tf.sequential()` with `inputShape: [63]` and 3 softmax outputs mapping to `0` -> `[1,0,0]`, `2` -> `[0,1,0]`, `5` -> `[0,0,1]`.
5. **Observation 4**: `predictMLGestureSync` converts argMax index `0 -> 0`, `1 -> 2`, `2 -> 5`, maintaining perfect contract symmetry across sampling, training, stress-testing, and sync prediction.
6. **Conclusion**: The implementation is genuine, non-fabricated, correctly mapped, and syntactically sound.

---

## 3. Caveats
- No caveats. The Milestone 2 implementation was empirically audited, tested, and verified with zero defects or violations.

---

## 4. Conclusion
Milestone 2 (M2) passes all forensic integrity checks. **Verdict: CLEAN.**

---

## 5. Verification Method
To independently verify this audit:
1. Run `node --check src/ml_gesture.js`
2. Run `powershell -Command "Get-Content src/renderer.js -Raw | node --input-type=module --check"`
3. Run `node .agents/worker_m2/test_m2_flow.js`
All commands must exit with code 0 and output `SUCCESS: All M2 calibration flow tests passed!`.
