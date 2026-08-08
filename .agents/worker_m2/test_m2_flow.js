// test_m2_flow.js - Empirical test script for M2 Calibration & ML Integration
const path = require('path');
const fs = require('fs');

console.log("==================================================");
console.log(" Running M2 Empirical Calibration Flow Test ");
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

// 2. Load TF.js
const tf = require('../../src/vendor/tf.min.js');
global.tf = tf;
window.tf = tf;
if (tf.setBackend) {
    tf.setBackend('cpu').catch(() => {});
}

// 3. Mock 3D calibVisuals with step & progress tracking
const visualStepHistory = [];
const visualProgressHistory = [];
window.calibVisuals = {
    setStep: function(step) {
        visualStepHistory.push(step);
        console.log(`[3D Visuals] setStep(${step})`);
    },
    setProgress: function(prog) {
        visualProgressHistory.push(prog);
        console.log(`[3D Visuals] setProgress(${prog.toFixed(2)})`);
    }
};

// 4. Load ml_gesture.js
const mlGesturePath = path.resolve(__dirname, '../../src/ml_gesture.js');
const mlCode = fs.readFileSync(mlGesturePath, 'utf8');
eval(mlCode);

// Helper function to create mock MediaPipe 21 hand landmarks
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

// Intercept window.trainMLModel to track when it gets invoked
let trainMLModelCalled = false;
const originalTrainMLModel = window.trainMLModel;
window.trainMLModel = async function() {
    trainMLModelCalled = true;
    console.log("[Test] trainMLModel() called! Executing model training...");
    await originalTrainMLModel();
};

// Run the interactive calibration flow test
(async () => {
    try {
        console.log("\n--- Starting Calibration Flow (Step 0: Fist) ---");
        initMLTutorial();
        
        // Assert initial state for Step 0
        if (window.mlTutorialStep !== 0) throw new Error(`Expected step 0, got ${window.mlTutorialStep}`);
        if (window.isMlCalibrating !== true) throw new Error("Expected isMlCalibrating = true");
        if (window.isMlSamplingActive !== false) throw new Error("Expected isMlSamplingActive = false initially");

        // Start sampling for Step 0
        window.startCurrentSample();
        if (window.isMlSamplingActive !== true) throw new Error("Expected isMlSamplingActive = true after startCurrentSample()");

        // Feed 10 frames for Step 0 (Fist -> label 0)
        console.log("Feeding 10 frames for Step 0 (Fist)...");
        for (let i = 0; i < 10; i++) {
            const lm = createMockLandmarks(10 + i);
            window.processMLCalibration(lm, true);
        }

        // Verify Step 0 completion and auto-advance to Step 1
        if (window.mlSamples[0].length !== 10) throw new Error(`Expected 10 samples for label 0, got ${window.mlSamples[0].length}`);
        if (window.mlTutorialStep !== 1) throw new Error(`Expected transition to step 1, got ${window.mlTutorialStep}`);
        console.log(`Step 0 complete. Label 0 count: ${window.mlSamples[0].length}. Current Step: ${window.mlTutorialStep}`);

        // Start sampling for Step 1 (Open Palm -> label 2)
        console.log("\n--- Starting Sampling for Step 1 (Open Palm) ---");
        window.startCurrentSample();
        if (window.isMlSamplingActive !== true) throw new Error("Expected isMlSamplingActive = true for step 1");

        // Feed 10 frames for Step 1
        for (let i = 0; i < 10; i++) {
            const lm = createMockLandmarks(20 + i);
            window.processMLCalibration(lm, true);
        }

        // Verify Step 1 completion and auto-advance to Step 2
        if (window.mlSamples[2].length !== 10) throw new Error(`Expected 10 samples for label 2, got ${window.mlSamples[2].length}`);
        if (window.mlTutorialStep !== 2) throw new Error(`Expected transition to step 2, got ${window.mlTutorialStep}`);
        console.log(`Step 1 complete. Label 2 count: ${window.mlSamples[2].length}. Current Step: ${window.mlTutorialStep}`);

        // Start sampling for Step 2 (Pinch -> label 5)
        console.log("\n--- Starting Sampling for Step 2 (Pinch) ---");
        window.startCurrentSample();
        if (window.isMlSamplingActive !== true) throw new Error("Expected isMlSamplingActive = true for step 2");

        // Feed 10 frames for Step 2
        for (let i = 0; i < 10; i++) {
            const lm = createMockLandmarks(30 + i);
            window.processMLCalibration(lm, true);
        }

        // Verify Step 2 completion
        if (window.mlSamples[5].length !== 10) throw new Error(`Expected 10 samples for label 5, got ${window.mlSamples[5].length}`);
        console.log(`Step 2 complete. Label 5 count: ${window.mlSamples[5].length}.`);

        // Total samples assertion: { 0: 10, 2: 10, 5: 10 }
        console.log("\n--- Verifying Total Collected Samples ---");
        const counts = {
            0: window.mlSamples[0].length,
            2: window.mlSamples[2].length,
            5: window.mlSamples[5].length
        };
        console.log("Collected mlSamples count:", JSON.stringify(counts));
        if (counts[0] !== 10 || counts[2] !== 10 || counts[5] !== 10) throw new Error("mlSamples count mismatch!");

        // Wait for trainMLModel timeout (100ms) and execution
        console.log("\n--- Waiting for trainMLModel() trigger ---");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!trainMLModelCalled) throw new Error("trainMLModel was not called!");

        console.log("\n--- Verifying 3D Visual Flow Interactivity ---");
        console.log("3D Visual Step calls:", visualStepHistory);
        if (!visualStepHistory.includes(0) || !visualStepHistory.includes(1) || !visualStepHistory.includes(2)) throw new Error("Visual steps missing");
        if (visualProgressHistory.length === 0) throw new Error("No progress updates sent to 3D visuals");

        console.log("\n==================================================");
        console.log(" SUCCESS: All M2 calibration flow tests passed! ");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("\nTEST FAILED:", err);
        process.exit(1);
    }
})();
