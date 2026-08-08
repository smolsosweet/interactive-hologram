# Original User Request

## 2026-08-07T16:23:05Z

# Teamwork Project Prompt

Build an interactive, gamified "Astronaut Training" calibration UI for HoloLearn. It will guide users through 3 hand gestures (Fist, Open Palm, Pinch) using visual space-themed 3D cues rendered with Three.js instead of text, eliminating the need for external videos or Lottie files.

Working directory: d:\test_planets
Integrity mode: development

## Requirements

### R1. Gamified Calibration Flow
Replace the current static emoji calibration overlay in `index.html` and `renderer.js` with a 3-step interactive flow. The flow must integrate seamlessly with the existing ML sampling logic (`window.startCurrentSample()`).

### R2. Visual Steps (Three.js)
The 3 steps must be rendered using Three.js 3D objects in the background (or an overlay canvas):
- **Step 1 (Fist):** Display a 3D asteroid. Show a silhouette or visual cue to "crush" or "grab" it.
- **Step 2 (Open Palm):** Display a foggy/cloudy 3D Earth. Show a visual cue to "sweep" or "clear" the fog.
- **Step 3 (Pinch):** Display a tiny 3D moon. Show a visual cue to "pinch" and zoom it.

### R3. Minimal Text
The UI must rely primarily on visual 3D animations and hand silhouettes rather than text instructions to suit the 6-15 age demographic.

## Acceptance Criteria

### Implementation
- [ ] The static `tut-gesture-icon` is removed.
- [ ] The 3 visual training steps (Asteroid, Cloudy Earth, Tiny Moon) are implemented using Three.js geometries/materials.
- [ ] The existing ML calibration logic correctly collects data for all 3 gestures while the 3D visuals are active.
- [ ] The calibration sequence successfully finishes and transitions smoothly to the main HoloLearn solar system view.
