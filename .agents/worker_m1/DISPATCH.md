## 2026-08-07T16:28:32Z

<USER_REQUEST>
You are Worker 1 for Milestone 1 (M1: 3D Calibration Scene & Objects Setup).
Your Working Directory: d:\test_planets\.agents\worker_m1

MANDATORY INPUT:
Read original request file at: d:\test_planets\.agents\ORIGINAL_REQUEST.md
Read project specification at: d:\test_planets\.agents\orchestrator\PROJECT.md
Read survey analyses at:
- d:\test_planets\.agents\explorer_survey_1\analysis.md
- d:\test_planets\.agents\explorer_survey_2_r2\analysis.md
- d:\test_planets\.agents\explorer_survey_3_r2\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task Description:
Implement Milestone 1 (M1) for HoloLearn Astronaut Training Calibration UI:

1. HTML & Static Icon Cleanup (`src/index.html` & `src/ml_gesture.js`):
   - Remove static `#tut-gesture-icon` (`🖐`) from `src/index.html` (lines ~595, ~689).
   - In `src/ml_gesture.js`, update `updateTutorialUI()` to remove references to `tutIcon` / static text emojis (`👊`, `🖐`, `✌️`).

2. Three.js Calibration Group & 3D Objects Setup (`src/renderer.js`):
   - Create a dedicated `calibGroup = new THREE.Group(); scene.add(calibGroup);`
   - Implement procedural 3D objects inside `calibGroup`:
     - **Step 1 (Fist - 3D Asteroid)**: Procedural `DodecahedronGeometry` / `IcosahedronGeometry` with vertex noise perturbation + rock fragment debris particle system (`THREE.Points`) & crushing animation scale effect.
     - **Step 2 (Open Palm - 3D Cloudy Earth)**: Core Earth sphere (`SphereGeometry`) + outer atmospheric cloud shell sphere (`SphereGeometry(2.15)` with transparent/additive cloud material & particle fog) & fog clearing opacity animation.
     - **Step 3 (Pinch - 3D Tiny Moon)**: Grey cratered sphere `SphereGeometry(0.8)` + pulsing target/pinch rings (`RingGeometry`) & zoom scale animation.
   - Implement 3D Wireframe Animated Hand Silhouettes:
     - Glowing 3D joint line hand model (`THREE.LineSegments` or `THREE.InstancedMesh`) representing key hand landmarks for Fist (contracted), Open Palm (sweeping), and Pinch (index/thumb touching).
   - Expose global calibration visual interface on `window.calibVisuals` or global functions (e.g. `setCalibrationStep(step)`, `updateCalibrationProgress(progress)`) so `ml_gesture.js` can control 3D visual steps and progress animations cleanly.

3. Build and Test Verification:
   - Ensure syntax is clean, no JS console errors.
   - Test that `calibGroup` renders correctly in the Three.js scene.

Output Requirements:
- Write `changes.md` and `handoff.md` in `d:\test_planets\.agents\worker_m1`.
- Include build/verification results in `handoff.md`.
- Send a message to parent when finished.
</USER_REQUEST>
