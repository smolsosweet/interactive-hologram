# HoloLearn Astronaut Training — UI Survey & Overlay Analysis

## 1. Executive Summary
This document provides a complete structural, CSS, DOM, and functional analysis of the **HoloLearn / Delphora Hologram Projection** frontend application located in `d:\test_planets`. It specifically examines the existing calibration UI overlay, static emoji gesture elements, canvas containers, HUD structures, and ML integration points to guide the transition from a static emoji-based tutorial to a gamified 3D Three.js astronaut training calibration sequence.

---

## 2. DOM Hierarchy & CSS Overlay Architecture

### 2.1 Complete DOM Structure Map
```
html (lang="vi")
├── head
│   ├── vendor/tf.min.js
│   ├── inline styles (Reset, Root Variables, Component Styles)
│   ├── node_modules/@mediapipe/{camera_utils, drawing_utils, hands}
│   └── ml_gesture.js
└── body
    ├── div#lang-controls (z-index: 100)
    │   ├── button.lang-btn.active (setAppLang('vi'))
    │   ├── button.lang-btn (setAppLang('en'))
    │   ├── button.lang-btn (setAppLang('zh'))
    │   ├── button.lang-btn#btn-reset-ai (resetMLCalibration())
    │   └── button.lang-btn#btn-analytics (showLearningAnalytics())
    ├── div#privacy-badge (z-index: 100)
    │   └── 🔒 100% Edge AI (Privacy Secured)
    └── div#app-container (position: relative, 100vw x 100vh)
        ├── div#canvas-container (position: absolute, inset: 0) [Main WebGL Canvas Host]
        ├── div#tutorial-overlay.hidden (z-index: 60, position: absolute, inset: 0)
        │   └── div.tut-box (max-width: 500px, glassmorphic card)
        │       ├── h2#tut-title ("Cá nhân hóa AI" / "Bước 1: Nắm tay"...)
        │       ├── p#tut-desc ("Vui lòng làm theo hướng dẫn...")
        │       ├── div#tut-gesture-icon ("🖐", "👊", "✌️", "🚀") [STATIC EMOJI TO BE REPLACED]
        │       ├── div (flex container for action buttons)
        │       │   ├── button#tut-start-btn (startCurrentSample())
        │       │   └── button#tut-skip-btn (skipTutorial())
        │       ├── div.tut-progress-container#tut-progress-container (display: none)
        │       │   └── div#tut-progress-bar (width: 0%)
        │       ├── div#tut-status (display: none)
        │       └── div#tut-timeout ("Bạn có thể Bỏ qua...")
        ├── div#idle-overlay (z-index: 15, opacity: 0)
        │   └── div.idle-text#idle-text ("Đưa tay lên để bắt đầu khám phá")
        ├── div#planet-panel (z-index: 40, fixed right, width: 50%)
        │   ├── div.pp-scroll (scrollable planet stats & description)
        │   └── div.pp-footer (gesture hint)
        ├── div#loading-overlay (z-index: 50, inset: 0)
        │   ├── img (delphora.svg)
        │   └── div.loading-spinner
        ├── div#hud-logos (z-index: 30, top-left 24px)
        │   ├── img (delphora.svg)
        │   └── img (fpt.svg)
        ├── div#hud-gesture-wrap (z-index: 30, bottom-left 28px)
        │   ├── div#hud-gesture (gesture text feedback)
        │   └── div#hud-progress
        │       └── div#hud-progress-fill (width: 0%)
        ├── div#btn-container (display: none !important)
        │   ├── button#info-toggle-btn
        │   └── button#cam-toggle-btn
        ├── video.input_video (display: none) [MediaPipe raw camera element]
        └── canvas.output_canvas (z-index: 10, right: 20px, top: 120px, 320x240) [MediaPipe debug canvas]
```

---

## 3. Detailed Component & Visibility Rules Table

| Element ID / Class | Z-Index | Display / Position | Default Visibility State | Modifiers & Transition Logic | Function / Purpose |
|-------------------|---------|-------------------|--------------------------|-----------------------------|--------------------|
| `#app-container` | N/A | `relative`, 100vw x 100vh | Visible | Container root for all UI layers | Root layout holder |
| `#canvas-container` | 0 | `absolute`, `inset: 0` | Visible | Hosts `threeRenderer.domElement` | Primary 3D WebGL canvas container |
| `#tutorial-overlay` | **60** | `absolute`, `inset: 0` | `.hidden` (`opacity: 0; pointer-events: none`) | Toggle class `.hidden`. Controlled via `initMLTutorial()`, `startTutorialStep()`, and `finishTutorial()` | ML Calibration overlay modal screen |
| `.tut-box` | 60 | Centered flex item | Visible within overlay | Glassmorphic gradient container | Dialogue card box for calibration |
| `#tut-gesture-icon` | 60 | Block element inside `.tut-box` | Visible within overlay | Text font-size: 5rem. Updated via `tutIcon.textContent` with static emojis (`👊`, `🖐`, `✌️`, `🚀`) | Target of replacement for 3D visual cues |
| `#tut-start-btn` | 60 | Flex button | Visible | Hidden (`display: none`) when `startCurrentSample()` is invoked | Button triggering sampling phase |
| `#tut-skip-btn` | 60 | Flex button | Visible | Hidden (`display: none`) when `startCurrentSample()` is invoked | Button bypassing calibration flow |
| `#tut-progress-container` | 60 | Block container | `display: none` | Displayed when sampling starts (`startCurrentSample()`) | Container for sample collection bar |
| `#tut-progress-bar` | 60 | Inner bar | `width: 0%` | Width dynamically calculated as `(currentSampleCount / 10) * 100%` | Sampling progress indicator bar |
| `#tut-status` | 60 | Text div | `display: none` | Displayed during sampling (`startCurrentSample()`), text updated per sample | Shows e.g. "Đang lấy mẫu... (3/10)" |
| `#loading-overlay` | **50** | `absolute`, `inset: 0` | Visible at boot | Receives `.hidden` once `window.__solarLoaded` is true, then removed | Pre-application asset loading screen |
| `#planet-panel` | **40** | `fixed`, right: 0, width: 50% | Hidden (`translateX(100%)`, `opacity: 0`) | Class `.active` (`translateX(0)`, `opacity: 1`) on planet focus | Right-side detailed planet information panel |
| `#hud-logos` | **30** | `absolute`, top: 24px, left: 24px | Visible | Scaled down via `body.panel-active` | Delphora & FPT branding header |
| `#hud-gesture-wrap` | **30** | `absolute`, bottom: 28px, left: 24px | Visible | Text updated via `setGestureHUD()`, fill via `setProgressHUD()` | Gesture action text & hold feedback |
| `#idle-overlay` | **15** | `absolute`, `inset: 0` | Invisible (`opacity: 0`) | Class `.active` (`opacity: 1`) when idle > 5 mins | Attract mode screen saver prompt |
| `canvas.output_canvas` | **10** | `absolute`, top: 120px, right: 20px | Visible (display: block) | Relocated to left: 20px, bottom: 80px when `body.in-focus` is set | MediaPipe hand landmark tracking canvas |

---

## 4. Calibration UI Survey (`#tutorial-overlay` & `ml_gesture.js`)

### 4.1 Calibration Lifecycle & State Machine
The current calibration logic is implemented in `src/ml_gesture.js` with the following global state variables:

```javascript
window.mlModel = null;                 // TF.js sequential model reference
window.isMlCalibrating = false;        // true during calibration phase
window.mlTutorialStep = -1;            // -1: Hidden, 0: Step 1 (Fist), 1: Step 2 (Open Palm), 2: Step 3 (Pinch)
window.mlSamples = { 0: [], 2: [], 5: [] }; // Collected landmark feature vectors for each gesture label
window.useFallbackRuleBased = false;   // true if user clicks Skip or training fails
window.isMlSamplingActive = false;     // true while collecting 10 frames for current step
```

### 4.2 Step-by-Step Flow Breakdown

1. **Initialization (`initMLTutorial()`):**
   - Retrieves DOM references for `tutOverlay`, `tutTitle`, `tutDesc`, `tutIcon`, `tutProgressBar`, `tutStatus`, `tutTimeoutText`.
   - Checks `body.classList.contains('hologram-mode')`. If true, skips tutorial automatically (`finishTutorial(true)`).
   - Otherwise, invokes `startTutorialStep(0)`.

2. **Step Setup (`startTutorialStep(step)`):**
   - Sets `window.mlTutorialStep = step`, `window.isMlCalibrating = true`, `window.isMlSamplingActive = false`, `currentSampleCount = 0`.
   - Removes `.hidden` from `tutOverlay`.
   - Calls `updateTutorialUI()` to populate text and static emoji:
     - Step 0 (Fist): `tutTitle` = "Bước 1: Nắm tay", `tutDesc` = "Vui lòng đưa tay vào camera và NẮM CHẶT TAY.", `tutIcon` = "👊"
     - Step 1 (Open Palm): `tutTitle` = "Bước 2: Xòe tay", `tutDesc` = "Vui lòng XÒE RỘNG BÀN TAY của bạn ra.", `tutIcon` = "🖐"
     - Step 2 (Pinch): `tutTitle` = "Bước 3: Chụm tay (Pinch)", `tutDesc` = "Chụm 2 ĐẦU NGÓN TAY (Cái & Trỏ) vào nhau để Zoom.", `tutIcon` = "✌️"
   - Starts 15-second auto-timeout timer (`TIMEOUT_MS = 15000`). If inactive, calls `window.skipTutorial()`.

3. **Sample Sampling (`startCurrentSample()`):**
   - Triggered when user clicks `tut-start-btn`.
   - Sets `window.isMlSamplingActive = true`.
   - Hides `tut-start-btn` and `tut-skip-btn`.
   - Displays `tut-progress-container` and `tut-status`.

4. **Frame Processing (`window.processMLCalibration(landmarks, isRight)`):**
   - Invoked every video frame inside MediaPipe's `onResults()` callback in `renderer.js` whenever `window.isMlCalibrating && window.isMlSamplingActive` is true.
   - Extracts 63-dimensional normalized feature vector from wrist-centered landmarks (`extractFeatures(landmarks, isRight)`).
   - Appends feature vector to `window.mlSamples[targetLabel]`.
   - Increments `currentSampleCount` and updates progress bar/status text.
   - When `currentSampleCount >= 10`:
     - Sets `isMlSamplingActive = false`.
     - If `mlTutorialStep < 2`, advances to `startTutorialStep(mlTutorialStep + 1)`.
     - If `mlTutorialStep === 2`, displays training UI ("Đang huấn luyện AI...", `tutIcon` = "🚀") and calls `trainMLModel()`.

5. **Model Training & Transition (`trainMLModel()`):**
   - Augment collected samples (rotations ±10°, ±20°).
   - Trains 3-layer TF.js MLP (`[63] -> Dense(32, relu) -> Dense(16, relu) -> Dense(3, softmax)`).
   - Runs automated stress test (`runStressTest()`).
   - Exports to OpenVINO if backend available (`exportToOpenVINO()`).
   - Invokes `finishTutorial(false)` which sets `isMlCalibrating = false`, `mlTutorialStep = -1`, and adds `.hidden` to `tutOverlay`.

---

## 5. Overlay Canvas, Hand Silhouettes & Gesture Elements Analysis

### 5.1 Static Gesture Icon Elements
- **Current Element:** `<div id="tut-gesture-icon">🖐</div>` (Line 686 of `src/index.html`).
- **CSS Styling:** Lines 595 of `src/index.html`: `font-size: 5rem; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255,255,255,0.2);`.
- **Limitation:** Uses static unicode emoji text characters (`👊`, `🖐`, `✌️`, `🚀`) updated imperatively in JS (`tutIcon.textContent`).
- **Requirement per ORIGINAL_REQUEST.md:** The static `tut-gesture-icon` must be removed/replaced with interactive 3D cues rendered with Three.js (Asteroid for Fist, Cloudy Earth for Open Palm, Tiny Moon for Pinch).

### 5.2 Hand Silhouettes & Visual Cues
- **Current Implementation:** No SVG or 3D hand silhouette currently exists in HTML or CSS. MediaPipe draws 2D landmark lines on `canvas.output_canvas` via `drawing_utils.js` (`drawConnectors` and `drawLandmarks`).
- **Target Design:** Interactive hand silhouette cues or 3D space-themed cues need to overlay or integrate with the 3D calibration scene.

### 5.3 WebGL & Overlay Canvases
- **Main Canvas:** `#canvas-container` contains the primary WebGL renderer (`threeRenderer.domElement`) created in `renderer.js` (Line 54).
- **Camera Feedback Canvas:** `canvas.output_canvas` is a 2D canvas overlaying the view (top-right) showing raw camera feed + skeleton overlay.
- **Overlay Layering:** `#tutorial-overlay` has `z-index: 60`, which sits directly above `#loading-overlay` (50), `#planet-panel` (40), `#hud-logos` (30), `#idle-overlay` (15), and `#canvas-container` (0).

---

## 6. Relationship & Transition between Calibration UI & Main Solar System

### 6.1 UI Hierarchy Relationship
```
┌─────────────────────────────────────────────────────────────┐
│ #tutorial-overlay (z-index: 60)                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .tut-box                                                │ │
│ │   [Step Title, Desc, 3D/Gesture Cue Container, Buttons] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ finishTutorial() adds .hidden
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ #app-container                                              │
│ ├── #canvas-container (z-index: 0)                          │
│ │   └── threeRenderer.domElement (Solar System 3D Scene)  │
│ ├── #hud-logos (z-index: 30)                                │
│ ├── #hud-gesture-wrap (z-index: 30)                         │
│ └── #planet-panel (z-index: 40)                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Gesture Control Mode Switching
- **During Calibration (`isMlCalibrating == true`):**
  - Hand landmark frames from MediaPipe pass directly to `processMLCalibration(landmarks, isRight)`.
  - Solar system interaction (orbiting, panning, zooming, planet selection) is bypassed.
- **After Calibration (`isMlCalibrating == false`):**
  - Landmark frames pass to `checkFist`, `checkPinch`, `countFingersAll`, and `predictMLGestureSync`.
  - Full interactive solar system navigation (Overview mode & Planet Focus mode) is active.

---

## 7. Key Code Locations & Function Registry

### `src/index.html`
- **Lines 580–600:** CSS rules for `#tutorial-overlay`, `.tut-box`, `#tut-gesture-icon`, `.tut-progress-container`, `#tut-progress-bar`, `#tut-status`.
- **Lines 681–695:** DOM layout for `#tutorial-overlay`, `tut-box`, `tut-title`, `tut-desc`, `tut-gesture-icon`, `tut-start-btn`, `tut-skip-btn`, `tut-progress-container`, `tut-status`, `tut-timeout`.

### `src/ml_gesture.js`
- **Lines 20–36:** `initMLTutorial()` — DOM element binding and step 0 startup.
- **Lines 38–55:** `startTutorialStep(step)` — step configuration & auto-timeout timer setup.
- **Lines 57–61:** `window.skipTutorial()` — fallback trigger.
- **Lines 63–72:** `window.startCurrentSample()` — sample collection UI toggle.
- **Lines 74–102:** `updateTutorialUI()` — text & emoji update function.
- **Lines 105–138:** `window.processMLCalibration(landmarks, isRight)` — frame sampling loop.
- **Lines 140–209:** `trainMLModel()` — model training execution.
- **Lines 333–343:** `finishTutorial(fallback)` — hides overlay and exits calibration mode.

### `src/renderer.js`
- **Line 420:** Calls `window.initMLTutorial()` on startup.
- **Lines 1230–1238:** Routes landmarks to `window.processMLCalibration()` inside `onResults()`.

---

## 8. Summary of Findings & Handoff Guidelines for Implementer

1. **Static Gesture Icon Removal:** `#tut-gesture-icon` in `src/index.html` (line 686) and its text manipulation in `ml_gesture.js` (`tutIcon.textContent`) should be replaced by the implementer with a Three.js 3D viewport or container suitable for rendering the Asteroid (Step 1), Cloudy Earth (Step 2), and Tiny Moon (Step 3).
2. **Preservation of ML Sampling API:** The implementation must preserve calling `window.startCurrentSample()`, `window.skipTutorial()`, and `window.processMLCalibration(landmarks, isRight)` so that landmark data collection and neural network training remain 100% functional.
3. **Smooth Transition:** The completion of Step 3 must cleanly trigger `trainMLModel()`, follow up with `finishTutorial()`, add `.hidden` to `#tutorial-overlay`, and transition directly into the main HoloLearn solar system WebGL view.
