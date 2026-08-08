# Handoff Report — HoloLearn UI Layout & Calibration Overlay Survey

## 1. Observation

### Key Files Inspected
- `d:\test_planets\.agents\ORIGINAL_REQUEST.md` (Lines 1–33)
- `d:\test_planets\src\index.html` (Lines 1–875)
- `d:\test_planets\src\ml_gesture.js` (Lines 1–425)
- `d:\test_planets\src\renderer.js` (Lines 1–2015)
- `d:\test_planets\main.js` (Lines 1–171)

### Key Verbatim Elements & Code Quotes

1. **Static Gesture Icon & Tutorial Overlay in `src/index.html`:**
   - Lines 580–586:
     ```css
     #tutorial-overlay {
         position: absolute; inset: 0; z-index: 60;
         display: flex; flex-direction: column; align-items: center; justify-content: center;
         background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
         transition: opacity 0.5s ease;
     }
     #tutorial-overlay.hidden { opacity: 0; pointer-events: none; }
     ```
   - Line 595:
     ```css
     #tut-gesture-icon { font-size: 5rem; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
     ```
   - Lines 682–695:
     ```html
     <div id="tutorial-overlay" class="hidden">
         <div class="tut-box">
             <h2 id="tut-title">Cá nhân hóa AI</h2>
             <p id="tut-desc">Vui lòng làm theo hướng dẫn để AI học thói quen tay của bạn.</p>
             <div id="tut-gesture-icon">🖐</div>
             <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
                 <button id="tut-start-btn" onclick="if(window.startCurrentSample) window.startCurrentSample()" ...>Bắt đầu lấy mẫu</button>
                 <button id="tut-skip-btn" onclick="if(window.skipTutorial) window.skipTutorial()" ...>Bỏ qua</button>
             </div>
             <div class="tut-progress-container" id="tut-progress-container" style="display: none; margin-top: 15px;"><div id="tut-progress-bar"></div></div>
             <div id="tut-status" style="display: none; margin-top: 5px;">Đang lấy mẫu... (0/10)</div>
             <div id="tut-timeout">Bạn có thể Bỏ qua nếu muốn dùng thuật toán mặc định.</div>
         </div>
     </div>
     ```

2. **Calibration Logic & Emoji Assignment in `src/ml_gesture.js`:**
   - Lines 74–88:
     ```javascript
     function updateTutorialUI() {
         if (window.mlTutorialStep === 0) {
             tutTitle.textContent = "Bước 1: Nắm tay";
             tutDesc.textContent = "Vui lòng đưa tay vào camera và NẮM CHẶT TAY.";
             tutIcon.textContent = "👊";
         } else if (window.mlTutorialStep === 1) {
             tutTitle.textContent = "Bước 2: Xòe tay";
             tutDesc.textContent = "Vui lòng XÒE RỘNG BÀN TAY của bạn ra.";
             tutIcon.textContent = "🖐";
         } else if (window.mlTutorialStep === 2) {
             tutTitle.textContent = "Bước 3: Chụm tay (Pinch)";
             tutDesc.textContent = "Chụm 2 ĐẦU NGÓN TAY (Cái & Trỏ) vào nhau để Zoom.";
             tutIcon.textContent = "✌️";
         }
     ```

3. **Frame Processing Integration in `src/renderer.js`:**
   - Lines 1230–1238:
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

---

## 2. Logic Chain

1. **Requirement Analysis:**
   - User request demands replacing the static emoji calibration overlay (`tut-gesture-icon` and related static text/emoji controls) with an interactive 3-step gamified flow using space-themed Three.js 3D objects (Step 1: Asteroid/crush for Fist; Step 2: Cloudy Earth/clear fog for Open Palm; Step 3: Tiny Moon/pinch-zoom for Pinch).
   - Minimal text must be used, targeting 6–15 year old students.

2. **DOM & Z-Index Analysis:**
   - `#tutorial-overlay` currently sits at `z-index: 60`, which is above all main UI layers (`#loading-overlay` at 50, `#planet-panel` at 40, `#hud-logos` at 30, and `#canvas-container` at 0).
   - The static icon `<div id="tut-gesture-icon">🖐</div>` is located inside `.tut-box`.

3. **ML Integration Bridge:**
   - Sampling functionality (`window.startCurrentSample()`), sample collection (`window.processMLCalibration()`), data array (`window.mlSamples`), skip function (`window.skipTutorial()`), and finish function (`finishTutorial()`) form the core calibration API contract.
   - Any new 3D visual cue system must invoke `window.startCurrentSample()` or automatically sample while providing visual 3D feedback, maintaining compatibility with `processMLCalibration`.

4. **Transition to Solar System:**
   - Calling `finishTutorial()` applies the `.hidden` class to `#tutorial-overlay`, turning `isMlCalibrating` to `false`.
   - Once `isMlCalibrating` is `false`, `onResults()` in `renderer.js` automatically routes hand landmark frames to standard solar system controls (rotation, zooming, planet selection).

---

## 3. Caveats
- No code modifications were performed during this task, as specified by the read-only Explorer role.
- OpenVINO inference fallback was inspected in `main.js` and `ml_gesture.js`; it runs in Electron main process via IPC (`ov-init`, `ov-infer-sync`).
- Existing geometries for planets exist in `models/` (`earth.glb`, `solar_system.glb`, etc.), but custom geometries/materials for Asteroid, Cloudy Earth, and Tiny Moon may be generated dynamically in Three.js or loaded from GLTF models.

---

## 4. Conclusion
The UI structure and calibration workflow are well-isolated and straightforward to replace:
1. `#tut-gesture-icon` in `src/index.html` and its text manipulation in `src/ml_gesture.js` are the exact components to replace.
2. The 3D calibration visuals can either render into a new canvas/container inside `#tutorial-overlay` or directly leverage the Three.js scene overlay in `#canvas-container`.
3. The underlying ML sampling logic (`window.startCurrentSample()`, `window.processMLCalibration()`, `window.mlSamples`, `finishTutorial()`) is clean and decoupled from the static UI markup.

The detailed survey report has been saved to `d:\test_planets\.agents\explorer_survey_1\analysis.md`.

---

## 5. Verification Method

To verify these observations independently:
1. Inspect DOM elements in `src/index.html` using `view_file` at lines 580–600 and 680–695 to confirm `#tutorial-overlay`, `.tut-box`, and `#tut-gesture-icon`.
2. Inspect `src/ml_gesture.js` using `view_file` at lines 74–102 and 105–138 to confirm `updateTutorialUI()` and `window.processMLCalibration`.
3. Inspect `src/renderer.js` using `view_file` at lines 1230–1238 to confirm the MediaPipe callback routing logic.
