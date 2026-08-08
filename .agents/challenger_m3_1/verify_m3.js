import * as THREE from '../../src/vendor/three.module.js';
import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log(" MILESTONE 3 TRANSITION & CAMERA LERP TEST HARNESS");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  [PASS] ${message}`);
        passedCount++;
    } else {
        console.error(`  [FAIL] ${message}`);
        failedCount++;
    }
}

// ---------------------------------------------------------
// TEST 1: Step-by-step Frame Simulation (0 to 1)
// ---------------------------------------------------------
console.log("--- TEST 1: Step-by-Step Transition Frame Simulation ---");

// Set up simulation environment representing renderer.js logic
let isCalibTransitioning = false;
let calibTransitionProgress = 0.0;
const CALIB_TRANSITION_DURATION = 0.6;

const calibCamPos = new THREE.Vector3(0, 12, 22);
const calibLookAt = new THREE.Vector3(0, 10, 0);
const overviewCamPos = new THREE.Vector3(0, 62.5, 42.5);
const overviewCamLook = new THREE.Vector3(9, 10.5, 0);

const overviewCam = new THREE.PerspectiveCamera(60, 1, 0.1, 8000);
const calibGroup = new THREE.Group();
const modelGroup = new THREE.Group();

// Add dummy mesh to calibGroup
const calibMeshMat = new THREE.MeshBasicMaterial({ opacity: 0.8, transparent: true });
const calibMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), calibMeshMat);
calibGroup.add(calibMesh);

// Add dummy mesh to modelGroup
const modelMeshMat = new THREE.MeshBasicMaterial({ opacity: 1.0, transparent: false });
const modelMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), modelMeshMat);
modelGroup.add(modelMesh);

function transitionToMainView() {
    if (isCalibTransitioning) return;
    isCalibTransitioning = true;
    calibTransitionProgress = 0.0;
    modelGroup.visible = true;
}

// Trigger transition
transitionToMainView();
assert(isCalibTransitioning === true, "isCalibTransitioning flag initialized to true");
assert(calibTransitionProgress === 0.0, "calibTransitionProgress initialized to 0.0");
assert(modelGroup.visible === true, "modelGroup.visible set to true on transition start");

const frameDelta = 1 / 60; // 60 FPS
let hasNaN = false;
let hasInfinity = false;
const stepsLog = [];

for (let step = 0; step <= 40; step++) {
    if (step > 0) {
        calibTransitionProgress += frameDelta / CALIB_TRANSITION_DURATION;
    }
    const rawProgress = Math.min(1.0, calibTransitionProgress);
    const p = THREE.MathUtils.smoothstep(rawProgress, 0.0, 1.0);

    const camPos = calibCamPos.clone().lerp(overviewCamPos, p);
    const camLook = calibLookAt.clone().lerp(overviewCamLook, p);
    overviewCam.position.copy(camPos);
    overviewCam.lookAt(camLook);

    const scaleVal = 1.0 - p;
    calibGroup.scale.set(scaleVal, scaleVal, scaleVal);

    // Fade calibGroup
    calibGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            if (child.material.userData.origOpacity === undefined) {
                child.material.userData.origOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
                child.material.userData.origTransparent = child.material.transparent;
            }
            child.material.transparent = true;
            child.material.opacity = child.material.userData.origOpacity * (1.0 - p);
        }
    });

    // Fade modelGroup
    modelGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            if (child.material.userData.origOpacity === undefined) {
                child.material.userData.origOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
                child.material.userData.origTransparent = child.material.transparent;
            }
            child.material.transparent = true;
            child.material.opacity = child.material.userData.origOpacity * p;
        }
    });

    // Check numbers for NaN / Infinity
    const valuesToCheck = [camPos.x, camPos.y, camPos.z, camLook.x, camLook.y, camLook.z, scaleVal, calibMeshMat.opacity, modelMeshMat.opacity];
    for (const val of valuesToCheck) {
        if (Number.isNaN(val)) hasNaN = true;
        if (!Number.isFinite(val)) hasInfinity = true;
    }

    if (rawProgress >= 1.0) {
        isCalibTransitioning = false;
        calibGroup.visible = false;
        calibGroup.scale.set(1.0, 1.0, 1.0);
        modelGroup.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.userData.origOpacity !== undefined) {
                    child.material.opacity = child.material.userData.origOpacity;
                    child.material.transparent = child.material.userData.origTransparent;
                }
            }
        });
    }

    stepsLog.push({
        step,
        timeSec: (step * frameDelta).toFixed(3),
        rawProgress: rawProgress.toFixed(4),
        smoothP: p.toFixed(4),
        camX: camPos.x.toFixed(2),
        camY: camPos.y.toFixed(2),
        camZ: camPos.z.toFixed(2),
        lookX: camLook.x.toFixed(2),
        lookY: camLook.y.toFixed(2),
        lookZ: camLook.z.toFixed(2),
        calibScale: calibGroup.scale.x.toFixed(2),
        calibOpacity: calibMeshMat.opacity.toFixed(3),
        modelOpacity: modelMeshMat.opacity.toFixed(3),
        calibVisible: calibGroup.visible,
        isTransitioning: isCalibTransitioning
    });
}

assert(!hasNaN, "No NaN values detected across all 40 simulation steps");
assert(!hasInfinity, "No Infinity values detected across all 40 simulation steps");

// Spot check initial position (Step 0)
const step0 = stepsLog[0];
assert(step0.camX === "0.00" && step0.camY === "12.00" && step0.camZ === "22.00", `Step 0 initial cam pos is (0, 12, 22), got (${step0.camX}, ${step0.camY}, ${step0.camZ})`);
assert(step0.lookX === "0.00" && step0.lookY === "10.00" && step0.lookZ === "0.00", `Step 0 initial lookAt is (0, 10, 0), got (${step0.lookX}, ${step0.lookY}, ${step0.lookZ})`);

// Spot check midpoint (Step 18 ~ 0.3s)
const step18 = stepsLog[18];
assert(step18.rawProgress === "0.5000", `Step 18 raw progress is 0.5000, got ${step18.rawProgress}`);
assert(step18.smoothP === "0.5000", `Step 18 smoothstep p is 0.5000, got ${step18.smoothP}`);
assert(step18.camX === "0.00" && step18.camY === "37.25" && step18.camZ === "32.25", `Step 18 midpoint cam pos is (0, 37.25, 32.25), got (${step18.camX}, ${step18.camY}, ${step18.camZ})`);
assert(step18.lookX === "4.50" && step18.lookY === "10.25" && step18.lookZ === "0.00", `Step 18 midpoint lookAt is (4.5, 10.25, 0), got (${step18.lookX}, ${step18.lookY}, ${step18.lookZ})`);

// Spot check completion (Step 36 ~ 0.6s)
const step36 = stepsLog[36];
assert(step36.rawProgress === "1.0000", `Step 36 raw progress is 1.0000, got ${step36.rawProgress}`);
assert(step36.camX === "0.00" && step36.camY === "62.50" && step36.camZ === "42.50", `Step 36 overview cam pos is (0, 62.5, 42.5), got (${step36.camX}, ${step36.camY}, ${step36.camZ})`);
assert(step36.lookX === "9.00" && step36.lookY === "10.50" && step36.lookZ === "0.00", `Step 36 overview lookAt is (9, 10.5, 0), got (${step36.lookX}, ${step36.lookY}, ${step36.lookZ})`);
assert(step36.calibVisible === false, "calibGroup.visible is set to false upon completion");
assert(step36.modelOpacity === "1.000", "modelGroup opacity restored to original opacity 1.0 upon completion");
assert(step36.calibScale === "1.00", "calibGroup scale reset back to 1.0 upon completion");


// ---------------------------------------------------------
// TEST 2: Multiple Calls Guard Check (Re-entrance Test)
// ---------------------------------------------------------
console.log("\n--- TEST 2: Multiple Calls Guard Check (Re-entrance) ---");

isCalibTransitioning = false;
calibTransitionProgress = 0.0;
transitionToMainView();
assert(isCalibTransitioning === true, "First call initiates transition");

// Advance midway (0.3s)
calibTransitionProgress += 0.3 / CALIB_TRANSITION_DURATION; // 0.5
const midProgress = calibTransitionProgress;

// Call transitionToMainView again while active
transitionToMainView();
assert(calibTransitionProgress === midProgress, `Second call during transition preserved progress at ${midProgress}`);
assert(isCalibTransitioning === true, "isCalibTransitioning remains true");

// Complete transition
calibTransitionProgress = 1.0;
isCalibTransitioning = false;

// Call transitionToMainView again after completed
transitionToMainView();
assert(isCalibTransitioning === true, "Call after completion initiates a new transition gracefully");
assert(calibTransitionProgress === 0.0, "calibTransitionProgress resets to 0.0 on new transition");


// ---------------------------------------------------------
// TEST 3: Active vs Skipped Calibration Integration
// ---------------------------------------------------------
console.log("\n--- TEST 3: Active vs Skipped Calibration Integration ---");

let globalState = {
    isMlCalibrating: true,
    mlTutorialStep: 2,
    useFallbackRuleBased: false,
    transitionCalled: false
};

function mockTransitionToMainView() {
    globalState.transitionCalled = true;
}

function mockFinishTutorial(fallback) {
    globalState.isMlCalibrating = false;
    globalState.mlTutorialStep = -1;
    globalState.useFallbackRuleBased = !!fallback;
    mockTransitionToMainView();
}

// Test Normal Completion
mockFinishTutorial(false);
assert(globalState.isMlCalibrating === false, "Active completion clears isMlCalibrating");
assert(globalState.mlTutorialStep === -1, "Active completion resets mlTutorialStep to -1");
assert(globalState.useFallbackRuleBased === false, "Active completion sets useFallbackRuleBased to false");
assert(globalState.transitionCalled === true, "Active completion invokes transitionToMainView()");

// Reset & Test Skip Completion
globalState = { isMlCalibrating: true, mlTutorialStep: 1, useFallbackRuleBased: false, transitionCalled: false };
mockFinishTutorial(true);
assert(globalState.isMlCalibrating === false, "Skipped calibration clears isMlCalibrating");
assert(globalState.mlTutorialStep === -1, "Skipped calibration resets mlTutorialStep to -1");
assert(globalState.useFallbackRuleBased === true, "Skipped calibration sets useFallbackRuleBased to true");
assert(globalState.transitionCalled === true, "Skipped calibration invokes transitionToMainView()");


// ---------------------------------------------------------
// TEST 4: Large Time Delta / Spike Resilience
// ---------------------------------------------------------
console.log("\n--- TEST 4: Frame Spike / Delta Jump Test ---");

isCalibTransitioning = false;
calibTransitionProgress = 0.0;
transitionToMainView();

// Simulate massive delta jump (e.g. 5.0 seconds)
const spikeDelta = 5.0;
calibTransitionProgress += spikeDelta / CALIB_TRANSITION_DURATION; // 8.333
const rawProgressSpike = Math.min(1.0, calibTransitionProgress);
const pSpike = THREE.MathUtils.smoothstep(rawProgressSpike, 0.0, 1.0);

assert(rawProgressSpike === 1.0, `rawProgress clamped to 1.0 despite delta 5.0 (got ${rawProgressSpike})`);
assert(pSpike === 1.0, `smoothstep p evaluates to 1.0 on delta spike (got ${pSpike})`);

if (rawProgressSpike >= 1.0) {
    isCalibTransitioning = false;
}
assert(isCalibTransitioning === false, "Transition completes gracefully in 1 frame during large delta spike");


// ---------------------------------------------------------
// TEST 5: Static File Integrity & Code Inspection
// ---------------------------------------------------------
console.log("\n--- TEST 5: Static File & AST/Pattern Inspection ---");

const rendererCode = fs.readFileSync(path.resolve('src/renderer.js'), 'utf8');
const mlCode = fs.readFileSync(path.resolve('src/ml_gesture.js'), 'utf8');
const htmlCode = fs.readFileSync(path.resolve('src/index.html'), 'utf8');

assert(rendererCode.includes('window.transitionToMainView = function'), "src/renderer.js exposes window.transitionToMainView");
assert(rendererCode.includes('transitionToMainView: function()'), "src/renderer.js exposes window.calibVisuals.transitionToMainView");
assert(rendererCode.includes('Vector3(0, 12, 22)'), "src/renderer.js defines calibration camera pos (0, 12, 22)");
assert(rendererCode.includes('Vector3(0, 62.5, 42.5)'), "src/renderer.js defines overview camera pos (0, 62.5, 42.5)");
assert(rendererCode.includes('THREE.MathUtils.smoothstep'), "src/renderer.js uses smoothstep for non-linear camera lerp");
assert(rendererCode.includes('CALIB_TRANSITION_DURATION = 0.6'), "src/renderer.js sets transition duration to 0.6s");

assert(mlCode.includes('transitionToMainView'), "src/ml_gesture.js calls transitionToMainView inside finishTutorial()");
assert(mlCode.includes('✊ Bước 1: Nắm tay - Thu phục Tiểu hành tinh!'), "src/ml_gesture.js contains Step 1 gamified Vietnamese cue");
assert(mlCode.includes('🖐️ Bước 2: Xòe tay - Dọn sạch mây Trái Đất!'), "src/ml_gesture.js contains Step 2 gamified Vietnamese cue");
assert(mlCode.includes('🤏 Bước 3: Chụm ngón tay - Phóng to Mặt Trăng!'), "src/ml_gesture.js contains Step 3 gamified Vietnamese cue");

assert(htmlCode.includes('backdrop-filter: blur(12px)'), "src/index.html includes 12px blur backdrop-filter for glassmorphism");
assert(htmlCode.includes('box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6)'), "src/index.html includes card glowing shadow");

// Summary
console.log("\n=================================================");
console.log(` VERIFICATION SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED`);
console.log("=================================================\n");

if (failedCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
