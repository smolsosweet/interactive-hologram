## 2026-08-07T16:31:30Z
You are Worker 1 Fix (worker_m1_fix) for Milestone 1.
Your Working Directory: d:\test_planets\.agents\worker_m1_fix

MANDATORY INPUT:
Read original request file at: d:\test_planets\.agents\ORIGINAL_REQUEST.md
Read project specification at: d:\test_planets\.agents\orchestrator\PROJECT.md
Read Gate status & failure report at:
- d:\test_planets\.agents\orchestrator\GATE_STATUS.md
- d:\test_planets\.agents\reviewer_m1_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Fix Task Description:
Resolve the UI state guard issue reported by Reviewer 2:
In `src/ml_gesture.js`, `updateTutorialUI()` currently sets:
```javascript
startBtn.style.display = 'block';
skipBtn.style.display = 'inline-block';
progCont.style.display = 'none';
tutStatus.style.display = 'none';
```
unconditionally without checking `if (!window.isMlSamplingActive)`. As a result, when landmark frames are processed during active sampling, `processMLCalibration()` calls `updateTutorialUI()`, which immediately hides the progress bar/status text and un-hides the start button mid-sampling.

Required Fix:
In `src/ml_gesture.js`:
Inside `updateTutorialUI()`, add a state check for `window.isMlSamplingActive`:
```javascript
if (window.isMlSamplingActive) {
    if (startBtn) startBtn.style.display = 'none';
    if (skipBtn) skipBtn.style.display = 'none';
    if (progCont) progCont.style.display = 'block';
    if (tutStatus) tutStatus.style.display = 'block';
} else {
    if (startBtn) startBtn.style.display = 'block';
    if (skipBtn) skipBtn.style.display = 'inline-block';
    if (progCont) progCont.style.display = 'none';
    if (tutStatus) tutStatus.style.display = 'none';
}
```

Verification:
- Run `node --check src/ml_gesture.js` to ensure syntax clean.
- Write `changes.md` and `handoff.md` in `d:\test_planets\.agents\worker_m1_fix`.
- Send message to parent when finished.
