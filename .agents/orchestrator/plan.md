# Plan: HoloLearn Astronaut Training Calibration UI

## Objectives
1. Replace static gesture tutorial (`tut-gesture-icon`, text overlay) with a 3-step interactive Three.js 3D calibration flow.
2. Step 1 (Fist): 3D Asteroid with crush/grab visual cue.
3. Step 2 (Open Palm): 3D Cloudy Earth with sweep/clear fog visual cue.
4. Step 3 (Pinch): 3D Tiny Moon with pinch/zoom visual cue.
5. Minimal text instructions, relying on 3D animations and hand silhouettes.
6. Seamless integration with `window.startCurrentSample()` ML calibration data collection.
7. Smooth transition to main HoloLearn solar system view upon completion.

## Phase 0: Survey & Exploration (Current)
- Dispatch 3 parallel Explorers to investigate:
  - Explorer 1: Index.html, UI layout, CSS styles, existing overlay, static gesture icons, canvas elements.
  - Explorer 2: Renderer.js, main.js, solar system code, Three.js setup, scene management, rendering loop, transitions.
  - Explorer 3: Gesture recognition / ML calibration sampling code (`window.startCurrentSample()`), gesture state transitions, event flow.

## Phase 1: Architecture & PROJECT.md
- Merge survey findings into `PROJECT.md` at project root.
- Define feature inventory, milestone breakdown, interface contracts, and code layout.

## Phase 2: Dual-Track Execution
- E2E Testing Track: Build comprehensive test infrastructure and test cases (Tiers 1-4).
- Implementation Track:
  - Milestone 1 (M1): Three.js Calibration Scene & 3D Objects Setup (Asteroid, Cloudy Earth, Tiny Moon, silhouettes/cues).
  - Milestone 2 (M2): Gamified Calibration Flow & ML Integration (`window.startCurrentSample()`, gesture states, overlay replacement).
  - Milestone 3 (M3): Transition & UI Polish (smooth camera/scene transition to main solar system view, removal of legacy static elements).
  - Final Milestone: Pass E2E test suite + Adversarial Coverage Hardening (Tier 5).

## Phase 3: Final Audit & Verification
- Forensic Audit verification.
- Report completion to Sentinel.
