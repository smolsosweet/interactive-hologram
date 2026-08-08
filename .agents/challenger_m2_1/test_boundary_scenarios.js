// test_boundary_scenarios.js - Boundary & Stress Tests for M2 Calibration Flow
const path = require('path');
const fs = require('fs');

console.log("==================================================");
console.log(" Running M2 Boundary & Stress Tests ");
console.log("==================================================");

// 1. Mock DOM and Window environment
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

// Mock 3D calibVisuals
window.calibVisuals = {
    setStep: (s) => {},
    setProgress: (p) => {}
};

// Load ml_gesture.js
const mlGesturePath = path.resolve(__dirname, '../../src/ml_gesture.js');
const mlCode = fs.readFileSync(mlGesturePath, 'utf8');
eval(mlCode);

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

(async () => {
    try {
        // SCENARIO 1: Partial Samples & skipTutorial() during active sampling
        console.log("\n--- Scenario 1: Partial Samples & Active Skip ---");
        window.resetMLCalibration();
        if (window.mlTutorialStep !== 0) throw new Error("Expected step 0 after init");
        
        window.startCurrentSample();
        console.log("Feeding 5 partial samples for Step 0...");
        for (let i = 0; i < 5; i++) {
            window.processMLCalibration(createMockLandmarks(i), true);
        }
        if (window.mlSamples[0].length !== 5) throw new Error(`Expected 5 samples in label 0, got ${window.mlSamples[0].length}`);
        
        console.log("Calling skipTutorial() mid-sampling...");
        window.skipTutorial();
        
        if (window.isMlCalibrating !== false) throw new Error("Expected isMlCalibrating = false after skip");
        if (window.mlTutorialStep !== -1) throw new Error("Expected mlTutorialStep = -1 after skip");
        if (window.useFallbackRuleBased !== true) throw new Error("Expected useFallbackRuleBased = true after skip");
        
        console.log("Feeding extra frame after skip (should be ignored)...");
        window.processMLCalibration(createMockLandmarks(99), true);
        if (window.mlSamples[0].length !== 5) throw new Error("Sample count increased after skip!");
        console.log("Scenario 1 PASSED: State clean after partial sample skip.");


        // SCENARIO 2: Rapid Sample Feeding (100 frames in rapid succession per step)
        console.log("\n--- Scenario 2: Rapid Sample Feeding ---");
        window.resetMLCalibration();
        
        // Step 0: Fist
        window.startCurrentSample();
        console.log("Rapidly feeding 100 frames for Step 0...");
        for (let i = 0; i < 100; i++) {
            window.processMLCalibration(createMockLandmarks(i), true);
        }
        if (window.mlSamples[0].length !== 10) {
            throw new Error(`Expected exactly 10 samples for label 0 under rapid feeding, got ${window.mlSamples[0].length}`);
        }
        if (window.mlTutorialStep !== 1) throw new Error(`Expected auto-advance to step 1, got ${window.mlTutorialStep}`);
        if (window.isMlSamplingActive !== false) throw new Error("Expected isMlSamplingActive = false after step 0 completion");

        // Step 1: Open Palm
        window.startCurrentSample();
        console.log("Rapidly feeding 100 frames for Step 1...");
        for (let i = 0; i < 100; i++) {
            window.processMLCalibration(createMockLandmarks(100 + i), true);
        }
        if (window.mlSamples[2].length !== 10) {
            throw new Error(`Expected exactly 10 samples for label 2, got ${window.mlSamples[2].length}`);
        }
        if (window.mlTutorialStep !== 2) throw new Error(`Expected auto-advance to step 2, got ${window.mlTutorialStep}`);

        // Step 2: Pinch
        window.startCurrentSample();
        console.log("Rapidly feeding 100 frames for Step 2...");
        for (let i = 0; i < 100; i++) {
            window.processMLCalibration(createMockLandmarks(200 + i), true);
        }
        if (window.mlSamples[5].length !== 10) {
            throw new Error(`Expected exactly 10 samples for label 5, got ${window.mlSamples[5].length}`);
        }
        
        console.log("Scenario 2 PASSED: Rapid sample feeding capped sample collection cleanly at 10 per label.");


        // SCENARIO 3: Feature Vector Integrity & Dimension Validation
        console.log("\n--- Scenario 3: Feature Array Size & Value Validation ---");
        for (const label of [0, 2, 5]) {
            const samples = window.mlSamples[label];
            if (!Array.isArray(samples)) throw new Error(`mlSamples[${label}] is not an array`);
            if (samples.length !== 10) throw new Error(`mlSamples[${label}] length is ${samples.length}, expected 10`);
            
            for (let i = 0; i < samples.length; i++) {
                const vec = samples[i];
                if (!Array.isArray(vec)) throw new Error(`Sample ${i} in label ${label} is not an array`);
                if (vec.length !== 63) throw new Error(`Sample ${i} in label ${label} has length ${vec.length}, expected 63`);
                for (let j = 0; j < vec.length; j++) {
                    if (typeof vec[j] !== 'number' || isNaN(vec[j])) {
                        throw new Error(`Sample ${i} in label ${label} contains invalid value at index ${j}: ${vec[j]}`);
                    }
                }
            }
        }
        console.log("Scenario 3 PASSED: All 30 feature vectors are 63-element arrays with valid float numbers.");


        // SCENARIO 4: Malformed Landmark Handing
        console.log("\n--- Scenario 4: Malformed Landmark Handling ---");
        window.resetMLCalibration();
        window.startCurrentSample();
        
        // Pass null, undefined, empty array, less than 21 landmarks
        window.processMLCalibration(null, true);
        window.processMLCalibration(undefined, true);
        window.processMLCalibration([], true);
        window.processMLCalibration(new Array(10).fill({x:0, y:0, z:0}), true);
        
        if (window.mlSamples[0].length !== 0) throw new Error("Malformed landmarks were improperly recorded");
        console.log("Scenario 4 PASSED: Malformed landmarks safely ignored.");


        // SCENARIO 5: Full ML Model Training Verification post-rapid sampling
        console.log("\n--- Scenario 5: Model Training Execution & Stress Test ---");
        // Re-feed 10 valid samples per step
        window.resetMLCalibration();
        
        for (let s = 0; s < 3; s++) {
            window.startCurrentSample();
            for (let i = 0; i < 10; i++) {
                window.processMLCalibration(createMockLandmarks(s * 100 + i), true);
            }
        }
        
        // Wait for training completion
        let waitCount = 0;
        while (window.isMlCalibrating && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
        }
        
        if (!window.mlModel) throw new Error("mlModel was not built after training");
        if (window.isMlCalibrating !== false) throw new Error("isMlCalibrating should be false after training");
        if (window.mlTutorialStep !== -1) throw new Error("mlTutorialStep should be -1 after training");
        
        // Test prediction
        const testLandmarks = createMockLandmarks(999);
        const pred = window.predictMLGestureSync(testLandmarks, true);
        console.log(`Prediction for test landmarks: ${pred}`);
        if (pred !== 0 && pred !== 2 && pred !== 5 && pred !== "fallback") {
            throw new Error(`Unexpected prediction result: ${pred}`);
        }
        console.log("Scenario 5 PASSED: Model trained and inference works without error.");

        console.log("\n==================================================");
        console.log(" ALL BOUNDARY & STRESS TESTS PASSED SUCCESSFULLY! ");
        console.log("==================================================");
        process.exit(0);

    } catch (err) {
        console.error("\nBOUNDARY TEST FAILED:", err);
        process.exit(1);
    }
})();
