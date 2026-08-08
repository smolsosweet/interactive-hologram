const fs = require('fs');
const path = require('path');

// Test suite runner for Milestone 3 Challenger
console.log("=================================================");
console.log("   Milestone 3 Empirical Verification Test Suite   ");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`❌ [FAIL] ${message}`);
    }
}

// ---------------------------------------------------------
// Test Group 1: Static HTML & CSS Inspection
// ---------------------------------------------------------
console.log("--- Group 1: DOM Elements & CSS Styling Inspection ---");

const htmlPath = path.join(__dirname, '../../src/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1.1 Overlay container and elements presence
assert(htmlContent.includes('id="tutorial-overlay"'), 'index.html contains #tutorial-overlay');
assert(htmlContent.includes('class="tut-box"'), 'index.html contains .tut-box card container');
assert(htmlContent.includes('id="tut-title"'), 'index.html contains #tut-title');
assert(htmlContent.includes('id="tut-desc"'), 'index.html contains #tut-desc');
assert(htmlContent.includes('id="tut-progress-container"'), 'index.html contains #tut-progress-container');
assert(htmlContent.includes('id="tut-progress-bar"'), 'index.html contains #tut-progress-bar');
assert(htmlContent.includes('id="tut-status"'), 'index.html contains #tut-status');
assert(htmlContent.includes('id="tut-timeout"'), 'index.html contains #tut-timeout');
assert(htmlContent.includes('id="tut-start-btn"'), 'index.html contains #tut-start-btn');
assert(htmlContent.includes('id="tut-skip-btn"'), 'index.html contains #tut-skip-btn');

// 1.2 Verification of static removal of emoji icon
assert(!htmlContent.includes('id="tut-gesture-icon"'), 'Static emoji icon #tut-gesture-icon is removed as required by R1');

// 1.3 Button Click Handler Attributes
assert(htmlContent.includes('id="tut-start-btn" onclick="if(window.startCurrentSample) window.startCurrentSample()"'), '#tut-start-btn has correct inline onclick handler for startCurrentSample()');
assert(htmlContent.includes('id="tut-skip-btn" onclick="if(window.skipTutorial) window.skipTutorial()"'), '#tut-skip-btn has correct inline onclick handler for skipTutorial()');

// 1.4 Glassmorphism CSS Properties
assert(htmlContent.includes('background: rgba(0, 5, 15, 0.55)'), 'CSS backdrop background for #tutorial-overlay uses translucent rgba(0, 5, 15, 0.55)');
assert(htmlContent.includes('backdrop-filter: blur(12px)'), 'CSS backdrop blur for #tutorial-overlay is set to 12px');
assert(htmlContent.includes('-webkit-backdrop-filter: blur(12px)'), 'Webkit prefix backdrop blur is set to 12px');
assert(htmlContent.includes('border: 1px solid rgba(0, 255, 200, 0.35)'), '.tut-box has cyan/green glowing border');
assert(htmlContent.includes('box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 255, 200, 0.2)'), '.tut-box has outer shadow and glow effect');
assert(htmlContent.includes('backdrop-filter: blur(16px)'), '.tut-box glass card has blur(16px)');

// ---------------------------------------------------------
// Test Group 2: Behavioral & State Machine Testing
// ---------------------------------------------------------
console.log("\n--- Group 2: ML State Machine & Skip Handling ---");

function createMockElement(initialClasses = []) {
    const classSet = new Set(initialClasses);
    return {
        textContent: '',
        style: {},
        parentElement: { style: {} },
        classList: {
            add: function(c) { classSet.add(c); },
            remove: function(c) { classSet.delete(c); },
            contains: function(c) { return classSet.has(c); }
        }
    };
}

const mockElements = {
    'tutorial-overlay': createMockElement(['hidden']),
    'tut-title': createMockElement(),
    'tut-desc': createMockElement(),
    'tut-progress-container': createMockElement(),
    'tut-progress-bar': createMockElement(),
    'tut-status': createMockElement(),
    'tut-timeout': createMockElement(),
    'tut-start-btn': createMockElement(),
    'tut-skip-btn': createMockElement()
};

global.document = {
    body: createMockElement(),
    getElementById: function(id) {
        if (!mockElements[id]) {
            mockElements[id] = createMockElement();
        }
        return mockElements[id];
    }
};

global.window = global;
global.window.calibVisuals = {
    step: undefined,
    progress: undefined,
    transitionCalled: false,
    setStep: function(s) { this.step = s; },
    setProgress: function(p) { this.progress = p; },
    transitionToMainView: function() { this.transitionCalled = true; }
};
global.window.transitionToMainView = function() {
    global.window.transitionToMainViewCalled = true;
};
global.setTimeout = function(fn, ms) { return 123; };
global.clearTimeout = function(id) {};
global.console = console;

// Load ml_gesture.js code dynamically
const mlPath = path.join(__dirname, '../../src/ml_gesture.js');
const mlCode = fs.readFileSync(mlPath, 'utf8');
eval(mlCode);

// 2.1 Test initMLTutorial()
initMLTutorial();
assert(window.mlTutorialStep === 0, 'initMLTutorial sets window.mlTutorialStep = 0');
assert(window.isMlCalibrating === true, 'initMLTutorial sets window.isMlCalibrating = true');
assert(window.isMlSamplingActive === false, 'initMLTutorial sets window.isMlSamplingActive = false');
assert(!mockElements['tutorial-overlay'].classList.contains('hidden'), 'initMLTutorial removes "hidden" class from #tutorial-overlay');
assert(mockElements['tut-title'].textContent.includes('Thu phục Tiểu hành tinh'), 'Step 0 title is set correctly');

// 2.2 Test startCurrentSample()
startCurrentSample();
assert(window.isMlSamplingActive === true, 'startCurrentSample sets window.isMlSamplingActive = true');
assert(mockElements['tut-start-btn'].style.display === 'none', 'startCurrentSample hides #tut-start-btn');
assert(mockElements['tut-skip-btn'].style.display === 'inline-block', 'startCurrentSample shows #tut-skip-btn');

// 2.3 Test skipTutorial() -> finishTutorial(true)
window.calibVisuals.transitionCalled = false;
window.transitionToMainViewCalled = false;
window.skipTutorial();

assert(window.isMlCalibrating === false, 'skipTutorial sets window.isMlCalibrating = false');
assert(window.mlTutorialStep === -1, 'skipTutorial resets window.mlTutorialStep = -1');
assert(window.useFallbackRuleBased === true, 'skipTutorial / finishTutorial(true) sets window.useFallbackRuleBased = true');
assert(mockElements['tutorial-overlay'].classList.contains('hidden'), 'finishTutorial(true) adds "hidden" class to #tutorial-overlay');
assert(window.calibVisuals.transitionCalled === true, 'finishTutorial(true) triggers window.calibVisuals.transitionToMainView()');

// 2.4 Test predictMLGestureSync when useFallbackRuleBased = true
const fallbackResult = window.predictMLGestureSync([{x:0,y:0,z:0}], true);
assert(fallbackResult === 'fallback', 'predictMLGestureSync returns "fallback" immediately when window.useFallbackRuleBased is true');

// 2.5 Test finishTutorial(false) (Normal completion flow)
initMLTutorial(); // Reset to calibration state
window.calibVisuals.transitionCalled = false;
finishTutorial(false);

assert(window.isMlCalibrating === false, 'finishTutorial(false) sets window.isMlCalibrating = false');
assert(window.mlTutorialStep === -1, 'finishTutorial(false) resets window.mlTutorialStep = -1');
assert(window.useFallbackRuleBased === false, 'finishTutorial(false) sets window.useFallbackRuleBased = false');
assert(mockElements['tutorial-overlay'].classList.contains('hidden'), 'finishTutorial(false) adds "hidden" class to #tutorial-overlay');
assert(window.calibVisuals.transitionCalled === true, 'finishTutorial(false) triggers window.calibVisuals.transitionToMainView()');

// ---------------------------------------------------------
// Test Group 3: 3D Scene Transition Logic in renderer.js
// ---------------------------------------------------------
console.log("\n--- Group 3: 3D Transition Logic Inspection ---");

const rendPath = path.join(__dirname, '../../src/renderer.js');
const rendCode = fs.readFileSync(rendPath, 'utf8');

assert(rendCode.includes('window.transitionToMainView = function()'), 'renderer.js exports window.transitionToMainView');
assert(rendCode.includes('let isCalibTransitioning = false;'), 'renderer.js declares isCalibTransitioning state');
assert(rendCode.includes('let calibTransitionProgress = 0.0;'), 'renderer.js declares calibTransitionProgress');
assert(rendCode.includes('CALIB_TRANSITION_DURATION = 0.6'), 'Transition duration is 0.6 seconds');
assert(rendCode.includes('THREE.MathUtils.smoothstep'), 'Transition uses THREE.MathUtils.smoothstep for smooth camera easing');
assert(rendCode.includes('Vector3(0, 12, 22)'), 'Camera interpolates from calibration position (0, 12, 22)');
assert(rendCode.includes('Vector3(0, 62.5, 42.5)'), 'Camera lerps to solar system overview position (0, 62.5, 42.5)');
assert(rendCode.includes('window.calibVisuals') && rendCode.includes('transitionToMainView: function()'), 'calibVisuals connects transitionToMainView to window.transitionToMainView');

// ---------------------------------------------------------
// Final Test Summary
// ---------------------------------------------------------
console.log("\n=================================================");
console.log(`Test Results: ${passedTests} / ${totalTests} passed`);
console.log("=================================================");

if (passedTests === totalTests) {
    console.log("\nVerdict: APPROVE — All Milestone 3 UI, skip, and transition requirements verified empirically!");
    process.exit(0);
} else {
    console.error(`\nVerdict: REQUEST_CHANGES — ${totalTests - passedTests} test(s) failed!`);
    process.exit(1);
}
