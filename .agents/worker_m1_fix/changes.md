# Changes Summary — Worker 1 Fix (Milestone 1)

## Files Modified

### 1. `src/ml_gesture.js`
- **Location**: `updateTutorialUI()` function (lines 99–114)
- **Change**: Added state check for `window.isMlSamplingActive`.
  - When `window.isMlSamplingActive` is `true`:
    - `startBtn.style.display = 'none'`
    - `skipBtn.style.display = 'none'`
    - `progCont.style.display = 'block'`
    - `tutStatus.style.display = 'block'`
  - When `window.isMlSamplingActive` is `false`:
    - `startBtn.style.display = 'block'`
    - `skipBtn.style.display = 'inline-block'`
    - `progCont.style.display = 'none'`
    - `tutStatus.style.display = 'none'`
- **Rationale**: Prevents `processMLCalibration()` from inadvertently hiding the progress container/status text and restoring the start/skip buttons when landmark frames arrive during active sampling.

## Verification
- Executed `node --check src/ml_gesture.js`: Exit Code 0 (Passed).
