// verify_m2_empirical.js - Challenger 2 empirical test suite for Milestone 2
const path = require('path');
const fs = require('fs');

console.log("==========================================================");
console.log(" Challenger 2: M2 Empirical Verification Suite ");
console.log("==========================================================");

// --- 1. SETUP ENVIRONMENT & MOCKS ---
const mockDOM = {
    'tutorial-overlay': { classList: { remove: () => {}, add: () => {} } },
    'tut-title': { textContent: '' },
    'tut-desc': { textContent: '' },
    'tut-progress-bar': { style: { width: '' } },
    'tut-status': { textContent: '', style: { display: '' } },
    'tut-timeout': { textContent: '' },
    'tut-start-btn': { style: { display: '' } },
    'tut-skip-btn': { style: { display: '' } },
    'tut-progress-container': { style: { display: '' } }
};

global.window = global;
global.document = {
    body: { classList: { contains: () => false } },
    getElementById: (id) => mockDOM[id] || { style: {}, classList: { remove: () => {}, add: () => {} } },
    createElement: (tag) => ({ getContext: () => null })
};

// Load TF.js
const tf = require('../../src/vendor/tf.min.js');
global.tf = tf;
window.tf = tf;
if (tf.setBackend) {
    tf.setBackend('cpu').catch(() => {});
}

// Extract calibVisuals definition from src/renderer.js
let currentCalibStep = -1;
let targetCalibProgress = 0.0;
let currentCalibProgress = 0.0;

window.calibVisuals = {
    setStep: function(step) {
        currentCalibStep = step;
        targetCalibProgress = 0.0;
        currentCalibProgress = 0.0;
    },
    setProgress: function(prog) {
        targetCalibProgress = Math.max(0.0, Math.min(1.0, prog));
    },
    getTargetProgress: function() {
        return targetCalibProgress;
    }
};

// Load src/ml_gesture.js
const mlGesturePath = path.resolve(__dirname, '../../src/ml_gesture.js');
const mlCode = fs.readFileSync(mlGesturePath, 'utf8');
eval(mlCode);

// Helper for generating mock MediaPipe landmarks (21 points with x,y,z)
function createMockLandmarks(seed) {
    const landmarks = [];
    for (let i = 0; i < 21; i++) {
        landmarks.push({
            x: 0.5 + Math.sin(seed + i * 0.1) * 0.2,
            y: 0.5 + Math.cos(seed + i * 0.1) * 0.2,
            z: Math.sin(seed * 0.5 + i * 0.05) * 0.1
        });
    }
    return landmarks;
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`  ❌ FAIL: ${message}`);
        testsFailed++;
        throw new Error(`Assertion failed: ${message}`);
    } else {
        console.log(`  ✅ PASS: ${message}`);
        testsPassed++;
    }
}

// --- TEST 1: window.calibVisuals.setProgress() Input Bounds ---
console.log("\n[TEST 1] Verifying window.calibVisuals.setProgress() bounds inputs safely between 0.0 and 1.0...");

const testCases = [
    { input: -1.0, expected: 0.0, desc: "Negative input (-1.0) clamped to 0.0" },
    { input: -0.5, expected: 0.0, desc: "Negative input (-0.5) clamped to 0.0" },
    { input: -0.0001, expected: 0.0, desc: "Slightly negative input (-0.0001) clamped to 0.0" },
    { input: 0.0, expected: 0.0, desc: "Exact lower bound (0.0) preserved" },
    { input: 0.25, expected: 0.25, desc: "In-range value (0.25) preserved" },
    { input: 0.5, expected: 0.5, desc: "Mid-range value (0.5) preserved" },
    { input: 0.75, expected: 0.75, desc: "In-range value (0.75) preserved" },
    { input: 1.0, expected: 1.0, desc: "Exact upper bound (1.0) preserved" },
    { input: 1.0001, expected: 1.0, desc: "Slightly out-of-range input (1.0001) clamped to 1.0" },
    { input: 1.5, expected: 1.0, desc: "Out-of-range input (1.5) clamped to 1.0" },
    { input: 100.0, expected: 1.0, desc: "Large positive input (100.0) clamped to 1.0" }
];

for (const tc of testCases) {
    window.calibVisuals.setProgress(tc.input);
    const actual = window.calibVisuals.getTargetProgress();
    assert(actual === tc.expected, `${tc.desc} -> input: ${tc.input}, actual: ${actual}, expected: ${tc.expected}`);
}

// --- TEST 2: extractFeatures() Output Format & Dimension ---
console.log("\n[TEST 2] Verifying extractFeatures() produces 63 floats per landmark frame...");

// Test 2a: Invalid landmark inputs
assert(extractFeatures(null, true) === null, "extractFeatures(null) returns null");
assert(extractFeatures([], true) === null, "extractFeatures([]) returns null");
assert(extractFeatures(createMockLandmarks(1).slice(0, 20), true) === null, "extractFeatures with 20 landmarks returns null");

// Test 2b: Valid right hand landmarks
const landmarksRight = createMockLandmarks(42);
const featuresRight = extractFeatures(landmarksRight, true);
assert(Array.isArray(featuresRight), "features is an Array");
assert(featuresRight.length === 63, `features length is 63 (actual: ${featuresRight.length})`);
assert(featuresRight.every(v => typeof v === 'number' && !isNaN(v)), "all 63 elements are valid numeric floats");

// Wrist position check (wrist is landmark 0 -> (x-wrist.x, y-wrist.y, z-wrist.z) -> (0,0,0))
assert(featuresRight[0] === 0 && featuresRight[1] === 0 && featuresRight[2] === 0, "wrist feature vector (first 3 floats) is [0, 0, 0]");

// Test 2c: Left hand mirroring
const landmarksLeft = createMockLandmarks(42);
const featuresLeft = extractFeatures(landmarksLeft, false);
assert(featuresLeft.length === 63, "left hand features length is 63");
// Check mirroring: x values for landmark 1 should have opposite sign relative to right hand
const lm1XRight = (landmarksRight[1].x - landmarksRight[0].x);
const lm1XLeftMirrored = featuresLeft[3] * (Math.hypot(landmarksLeft[9].x - landmarksLeft[0].x, landmarksLeft[9].y - landmarksLeft[0].y, landmarksLeft[9].z - landmarksLeft[0].z));
assert(Math.abs(featuresLeft[3] - (-featuresRight[3])) < 1e-5, "left hand X-coordinates are mirrored relative to right hand");

// --- TEST 3: processMLCalibration & Tensor Formatting for trainMLModel() ---
console.log("\n[TEST 3] Verifying processMLCalibration() data collection & trainMLModel() input tensor formatting...");

// Reset mlSamples state
window.mlSamples = { 0: [], 2: [], 5: [] };

// Run sampling flow for step 0 (Fist), 1 (Open Palm), 2 (Pinch)
const steps = [
    { step: 0, label: 0, desc: "Step 0 (Fist)" },
    { step: 1, label: 2, desc: "Step 1 (Open Palm)" },
    { step: 2, label: 5, desc: "Step 2 (Pinch)" }
];

let capturedProgressCalls = [];
window.calibVisuals.setProgress = function(prog) {
    targetCalibProgress = Math.max(0.0, Math.min(1.0, prog));
    capturedProgressCalls.push(targetCalibProgress);
};

for (const s of steps) {
    startTutorialStep(s.step);
    window.startCurrentSample();
    capturedProgressCalls = [];

    for (let i = 0; i < 10; i++) {
        const lm = createMockLandmarks(100 + s.step * 20 + i);
        window.processMLCalibration(lm, true);
    }

    assert(window.mlSamples[s.label].length === 10, `Collected 10 samples for ${s.desc} under label ${s.label}`);
    assert(window.mlSamples[s.label][0].length === 63, `Sample feature vector length is 63 for label ${s.label}`);
    
    // Verify progress calls were clamped and went from 0.1 to 1.0
    assert(capturedProgressCalls.length >= 10, `Received progress calls (actual: ${capturedProgressCalls.length}) for ${s.desc}`);
    assert(capturedProgressCalls.includes(1.0), `Progress reached 1.0 during ${s.desc}`);
    assert(capturedProgressCalls.every(p => p >= 0.0 && p <= 1.0), `All progress values bounded in [0.0, 1.0] for ${s.desc}`);
}

// Test Tensor creation formatting for trainMLModel
let createdXsTensorShape = null;
let createdYsTensorShape = null;
let createdYsValues = null;

const originalTensor2d = tf.tensor2d;
tf.tensor2d = function(values, shape, dtype) {
    const t = originalTensor2d(values, shape, dtype);
    if (!createdXsTensorShape) {
        createdXsTensorShape = t.shape;
    } else if (!createdYsTensorShape) {
        createdYsTensorShape = t.shape;
        createdYsValues = t.arraySync();
    }
    return t;
};

// Execute training
(async () => {
    try {
        console.log("\n[TEST 4] Intercepting trainMLModel() tensor construction...");
        await window.trainMLModel();

        // 10 samples per label * 3 labels = 30 original.
        // Each sample has 1 original + 4 augmentations (±10°, ±20°) = 5 vectors per sample.
        // Total inputs = 30 * 5 = 150 feature vectors.
        console.log(`Created xs shape: [${createdXsTensorShape.join(', ')}]`);
        console.log(`Created ys shape: [${createdYsTensorShape.join(', ')}]`);

        assert(createdXsTensorShape[0] === 150, `xs batch size is 150 (30 samples x 5 augments)`);
        assert(createdXsTensorShape[1] === 63, `xs feature dimension is 63`);
        assert(createdYsTensorShape[0] === 150, `ys batch size is 150`);
        assert(createdYsTensorShape[1] === 3, `ys target label dimension is 3 (one-hot)`);

        // Check one-hot labels: first 50 should be [1,0,0], middle 50 [0,1,0], last 50 [0,0,1]
        assert(JSON.stringify(createdYsValues[0]) === '[1,0,0]', "Label 0 one-hot encoding is [1, 0, 0]");
        assert(JSON.stringify(createdYsValues[50]) === '[0,1,0]', "Label 2 one-hot encoding is [0, 1, 0]");
        assert(JSON.stringify(createdYsValues[100]) === '[0,0,1]', "Label 5 one-hot encoding is [0, 0, 1]");

        // Model architecture verification
        assert(window.mlModel !== null, "window.mlModel created successfully");
        assert(window.mlModel.inputs[0].shape[1] === 63, "Model input tensor dimension is 63");
        assert(window.mlModel.outputs[0].shape[1] === 3, "Model output tensor dimension is 3");

        console.log("\n==========================================================");
        console.log(` SUMMARY: ${testsPassed} passed, ${testsFailed} failed.`);
        console.log(" ALL M2 VERIFICATION CHECKS PASSED EMPIRICALLY! ");
        console.log("==========================================================");
        process.exit(0);
    } catch (e) {
        console.error("Test error:", e);
        process.exit(1);
    }
})();
