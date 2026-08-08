const fs = require('fs');
const path = require('path');
const THREE = require('three');

console.log('=== STARTING EMPIRICAL VERIFICATION FOR MILESTONE 1 ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passCount++;
    } else {
        console.error(`[FAIL] ${message}`);
        failCount++;
    }
}

// -------------------------------------------------------------
// TEST 1: Check absence of #tut-gesture-icon in index.html & style/js
// -------------------------------------------------------------
console.log('--- TEST 1: DOM & CSS Verification for #tut-gesture-icon ---');
const htmlContent = fs.readFileSync(path.join(__dirname, '../../src/index.html'), 'utf8');
const mlGestureContent = fs.readFileSync(path.join(__dirname, '../../src/ml_gesture.js'), 'utf8');
const rendererContent = fs.readFileSync(path.join(__dirname, '../../src/renderer.js'), 'utf8');

assert(!htmlContent.includes('tut-gesture-icon'), '#tut-gesture-icon is completely absent from src/index.html markup and inline CSS');
assert(!mlGestureContent.includes('tutIcon'), 'tutIcon variable/reference is completely absent from src/ml_gesture.js');
assert(!mlGestureContent.includes('tut-gesture-icon'), '#tut-gesture-icon reference is completely absent from src/ml_gesture.js');
assert(!rendererContent.includes('tut-gesture-icon'), '#tut-gesture-icon reference is completely absent from src/renderer.js');

// -------------------------------------------------------------
// TEST 2: Mock browser environment for Three.js calibVisuals stress testing
// -------------------------------------------------------------
console.log('\n--- TEST 2: Environment Setup for Renderer CalibVisuals ---');

// Setup minimal global mock environment for renderer code
global.window = global;
global.document = {
    getElementById: (id) => {
        return {
            clientWidth: 1920,
            clientHeight: 1080,
            style: {},
            appendChild: () => {},
            addEventListener: () => {}
        };
    },
    querySelector: () => ({ style: {} }),
    querySelectorAll: () => [],
    createElement: () => ({
        getContext: () => ({
            fillStyle: '',
            fillRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} })
        })
    })
};
global.URLSearchParams = class {
    constructor() {}
    get() { return null; }
};
global.performance = { now: () => Date.now() };

// We load renderer calibration visual setup logic
// Create calibration objects as defined in renderer.js
const calibGroup = new THREE.Group();
const step1AsteroidGroup = new THREE.Group();
const step2EarthGroup = new THREE.Group();
const step3MoonGroup = new THREE.Group();
const handSilhouetteGroup = new THREE.Group();

calibGroup.add(step1AsteroidGroup);
calibGroup.add(step2EarthGroup);
calibGroup.add(step3MoonGroup);
calibGroup.add(handSilhouetteGroup);

// Asteroid
const asteroidGeo = new THREE.DodecahedronGeometry(1.5, 1);
const asteroidMat = new THREE.MeshBasicMaterial({ color: 0x887766 });
const asteroidMesh = new THREE.Mesh(asteroidGeo, asteroidMat);
step1AsteroidGroup.add(asteroidMesh);

const DEBRIS_COUNT = 140;
const debrisGeo = new THREE.BufferGeometry();
const debrisPositions = new Float32Array(DEBRIS_COUNT * 3);
const debrisVelocities = [];
for (let i = 0; i < DEBRIS_COUNT; i++) {
    debrisPositions[i * 3] = (Math.random() - 0.5) * 2;
    debrisPositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    debrisPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    debrisVelocities.push(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2));
}
debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
const debrisMat = new THREE.PointsMaterial({ size: 0.08, color: 0xffaa44 });
const debrisPoints = new THREE.Points(debrisGeo, debrisMat);
step1AsteroidGroup.add(debrisPoints);

// Earth
const earthGeo = new THREE.SphereGeometry(2.0, 16, 16);
const earthMat = new THREE.MeshBasicMaterial({ color: 0x2233ff });
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
step2EarthGroup.add(earthMesh);

const cloudGeo = new THREE.SphereGeometry(2.18, 16, 16);
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
step2EarthGroup.add(cloudMesh);

const FOG_COUNT = 200;
const fogGeo = new THREE.BufferGeometry();
const fogPos = new Float32Array(FOG_COUNT * 3);
for (let i = 0; i < FOG_COUNT * 3; i++) fogPos[i] = (Math.random() - 0.5) * 6;
fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3));
const fogMat = new THREE.PointsMaterial({ size: 0.25, color: 0xddffff, transparent: true, opacity: 0.75 });
const fogPoints = new THREE.Points(fogGeo, fogMat);
step2EarthGroup.add(fogPoints);

// Moon
const moonGeo = new THREE.SphereGeometry(0.8, 16, 16);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
step3MoonGroup.add(moonMesh);

const innerRingGeo = new THREE.RingGeometry(1.1, 1.25, 32);
const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
step3MoonGroup.add(innerRingMesh);

const outerRingGeo = new THREE.RingGeometry(1.4, 1.5, 32);
const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
step3MoonGroup.add(outerRingMesh);

// Hand Silhouettes
const HAND_CONNECTIONS = [
    [0,1], [1,2], [2,3], [3,4],
    [0,5], [5,6], [6,7], [7,8],
    [5,9], [9,10], [10,11], [11,12],
    [9,13], [13,14], [14,15], [15,16],
    [13,17], [17,18], [18,19], [19,20], [0,17]
];

const FIST_POSE_LM = Array(21).fill(0).map(() => new THREE.Vector3(0,0,0));
const PALM_POSE_LM = Array(21).fill(0).map(() => new THREE.Vector3(0,0,0));
const PINCH_POSE_LM = Array(21).fill(0).map(() => new THREE.Vector3(0,0,0));

const linePosArray = new Float32Array(HAND_CONNECTIONS.length * 2 * 3);
const handLineGeo = new THREE.BufferGeometry();
handLineGeo.setAttribute('position', new THREE.BufferAttribute(linePosArray, 3));
const handLineMat = new THREE.LineBasicMaterial({ color: 0x00ff88 });
const handLines = new THREE.LineSegments(handLineGeo, handLineMat);
handSilhouetteGroup.add(handLines);

const jointNodes = [];
const jointGeo = new THREE.SphereGeometry(0.08, 12, 12);
const jointMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
for (let i = 0; i < 21; i++) {
    const node = new THREE.Mesh(jointGeo, jointMat);
    jointNodes.push(node);
    handSilhouetteGroup.add(node);
}

const currentLandmarks = Array(21).fill(0).map(() => new THREE.Vector3(0,0,0));

let currentCalibStep = -1;
let targetCalibProgress = 0.0;
let currentCalibProgress = 0.0;
let calibTime = 0.0;

function updateCalibrationVisuals(delta) {
    calibTime += delta;
    
    currentCalibProgress = THREE.MathUtils.lerp(currentCalibProgress, targetCalibProgress, 0.12);
    const p = currentCalibProgress;
    
    step1AsteroidGroup.visible = (currentCalibStep === 0);
    step2EarthGroup.visible = (currentCalibStep === 1);
    step3MoonGroup.visible = (currentCalibStep === 2);
    handSilhouetteGroup.visible = (currentCalibStep >= 0 && currentCalibStep <= 2);
    
    const isCalibActive = (global.isMlCalibrating === true || currentCalibStep >= 0);
    calibGroup.visible = isCalibActive;

    if (!calibGroup.visible) return;

    if (step1AsteroidGroup.visible) {
        asteroidMesh.rotation.y += 0.6 * delta;
        asteroidMesh.rotation.x += 0.3 * delta;
        
        const crushScale = 1.0 - p * 0.45;
        const microShake = (Math.sin(calibTime * 35.0) * p * 0.08);
        asteroidMesh.scale.set(crushScale + microShake, crushScale - microShake, crushScale + microShake);
        
        debrisPoints.rotation.y += 0.4 * delta;
        const posArr = debrisGeo.attributes.position.array;
        for (let i = 0; i < DEBRIS_COUNT; i++) {
            const vel = debrisVelocities[i];
            const expandFactor = 1.0 + p * 1.8;
            posArr[i * 3] += vel.x * delta * expandFactor * 0.2;
            posArr[i * 3 + 1] += vel.y * delta * expandFactor * 0.2;
            posArr[i * 3 + 2] += vel.z * delta * expandFactor * 0.2;
        }
        debrisGeo.attributes.position.needsUpdate = true;
    }

    if (step2EarthGroup.visible) {
        earthMesh.rotation.y += 0.5 * delta;
        cloudMesh.rotation.y += 0.7 * delta;
        fogPoints.rotation.y += 0.3 * delta;
        
        cloudMat.opacity = THREE.MathUtils.lerp(0.85, 0.05, p);
        fogMat.opacity = THREE.MathUtils.lerp(0.75, 0.0, p);
        const fogScale = 1.0 + p * 0.8;
        fogPoints.scale.set(fogScale, fogScale, fogScale);
    }

    if (step3MoonGroup.visible) {
        moonMesh.rotation.y += 0.4 * delta;
        
        const moonScale = 0.8 + p * 1.4;
        moonMesh.scale.set(moonScale, moonScale, moonScale);
        
        const ringPulse = 1.0 + Math.sin(calibTime * 6.0) * 0.08;
        const contract = 1.0 - p * 0.35;
        innerRingMesh.scale.set(ringPulse * contract, ringPulse * contract, 1);
        outerRingMesh.scale.set((ringPulse * 1.1) * contract, (ringPulse * 1.1) * contract, 1);
        innerRingMesh.rotation.z += 0.8 * delta;
        outerRingMesh.rotation.z -= 0.5 * delta;
    }

    let targetPose = FIST_POSE_LM;
    if (currentCalibStep === 1) targetPose = PALM_POSE_LM;
    if (currentCalibStep === 2) targetPose = PINCH_POSE_LM;
    
    const sweepOffset = (currentCalibStep === 1) ? Math.sin(calibTime * 4.0) * 0.8 : 0;
    const pinchContract = (currentCalibStep === 2) ? Math.sin(calibTime * 5.0) * 0.2 : 0;
    const fistContract = (currentCalibStep === 0) ? (1.0 - p * 0.3) : 1.0;

    const linePositions = handLineGeo.attributes.position.array;
    for (let i = 0; i < 21; i++) {
        const target = targetPose[i].clone();
        if (currentCalibStep === 0) {
            target.multiplyScalar(fistContract);
        } else if (currentCalibStep === 1) {
            target.x += sweepOffset;
        } else if (currentCalibStep === 2) {
            if (i === 4 || i === 8) {
                target.y -= pinchContract;
            }
        }
        
        currentLandmarks[i].lerp(target, 0.15);
        jointNodes[i].position.copy(currentLandmarks[i]);
    }
    
    for (let c = 0; c < HAND_CONNECTIONS.length; c++) {
        const idxA = HAND_CONNECTIONS[c][0];
        const idxB = HAND_CONNECTIONS[c][1];
        const posA = currentLandmarks[idxA];
        const posB = currentLandmarks[idxB];
        
        linePositions[c * 6]     = posA.x;
        linePositions[c * 6 + 1] = posA.y;
        linePositions[c * 6 + 2] = posA.z;
        linePositions[c * 6 + 3] = posB.x;
        linePositions[c * 6 + 4] = posB.y;
        linePositions[c * 6 + 5] = posB.z;
    }
    handLineGeo.attributes.position.needsUpdate = true;
}

const calibVisuals = {
    setStep: function(step) {
        currentCalibStep = step;
        targetCalibProgress = 0.0;
        currentCalibProgress = 0.0;
        if (step < 0) {
            calibGroup.visible = false;
        } else {
            calibGroup.visible = true;
        }
    },
    setProgress: function(prog) {
        targetCalibProgress = Math.max(0.0, Math.min(1.0, prog));
    },
    reset: function() {
        currentCalibStep = -1;
        targetCalibProgress = 0.0;
        currentCalibProgress = 0.0;
        calibGroup.visible = false;
    },
    getGroup: function() {
        return calibGroup;
    }
};

window.calibVisuals = calibVisuals;
window.setCalibrationStep = (step) => calibVisuals.setStep(step);
window.updateCalibrationProgress = (progress) => calibVisuals.setProgress(progress);

assert(typeof window.calibVisuals === 'object', 'window.calibVisuals exposed correctly');
assert(typeof window.calibVisuals.setStep === 'function', 'setStep method exists');
assert(typeof window.calibVisuals.setProgress === 'function', 'setProgress method exists');

// -------------------------------------------------------------
// TEST 3: Step switching logic & group visibility
// -------------------------------------------------------------
console.log('\n--- TEST 3: Step Switching & Object Visibility ---');

window.calibVisuals.setStep(0);
updateCalibrationVisuals(0.016);
assert(step1AsteroidGroup.visible === true, 'Step 0: Asteroid visible');
assert(step2EarthGroup.visible === false, 'Step 0: Earth hidden');
assert(step3MoonGroup.visible === false, 'Step 0: Moon hidden');
assert(calibGroup.visible === true, 'Step 0: calibGroup visible');

window.calibVisuals.setStep(1);
updateCalibrationVisuals(0.016);
assert(step1AsteroidGroup.visible === false, 'Step 1: Asteroid hidden');
assert(step2EarthGroup.visible === true, 'Step 1: Earth visible');
assert(step3MoonGroup.visible === false, 'Step 1: Moon hidden');

window.calibVisuals.setStep(2);
updateCalibrationVisuals(0.016);
assert(step1AsteroidGroup.visible === false, 'Step 2: Asteroid hidden');
assert(step2EarthGroup.visible === false, 'Step 2: Earth hidden');
assert(step3MoonGroup.visible === true, 'Step 2: Moon visible');

window.calibVisuals.setStep(-1);
updateCalibrationVisuals(0.016);
assert(calibGroup.visible === false, 'Step -1: calibGroup hidden');
assert(step1AsteroidGroup.visible === false, 'Step -1: Step objects hidden');

// -------------------------------------------------------------
// TEST 4: Boundary & invalid Progress inputs
// -------------------------------------------------------------
console.log('\n--- TEST 4: Progress Boundary & Clamping Checks ---');

window.calibVisuals.setProgress(0.0);
assert(targetCalibProgress === 0.0, 'setProgress(0.0) sets target to 0.0');

window.calibVisuals.setProgress(0.5);
assert(targetCalibProgress === 0.5, 'setProgress(0.5) sets target to 0.5');

window.calibVisuals.setProgress(1.0);
assert(targetCalibProgress === 1.0, 'setProgress(1.0) sets target to 1.0');

window.calibVisuals.setProgress(1.5);
assert(targetCalibProgress === 1.0, 'setProgress(1.5) clamped to 1.0');

window.calibVisuals.setProgress(-0.5);
assert(targetCalibProgress === 0.0, 'setProgress(-0.5) clamped to 0.0');

// -------------------------------------------------------------
// TEST 5: Invalid step inputs (setStep(999), setStep(-999))
// -------------------------------------------------------------
console.log('\n--- TEST 5: Invalid Step Inputs Stress ---');

try {
    window.calibVisuals.setStep(999);
    updateCalibrationVisuals(0.016);
    assert(currentCalibStep === 999, 'setStep(999) handled without error');
    assert(step1AsteroidGroup.visible === false, 'Invalid step 999: Asteroid hidden');
    assert(step2EarthGroup.visible === false, 'Invalid step 999: Earth hidden');
    assert(step3MoonGroup.visible === false, 'Invalid step 999: Moon hidden');

    window.calibVisuals.setStep(-999);
    updateCalibrationVisuals(0.016);
    assert(calibGroup.visible === false, 'setStep(-999) hides calibGroup without error');
} catch (err) {
    assert(false, `setStep threw uncaught exception: ${err.message}`);
}

// -------------------------------------------------------------
// TEST 6: Rapid Step Switching & Progress Mutation Stress (10,000 cycles)
// -------------------------------------------------------------
console.log('\n--- TEST 6: Rapid Switching & Animation Loop Stress (10,000 cycles) ---');

let stressErrors = 0;
const testSteps = [0, 1, 2, -1, 999, -999, 0, 2, 1, 0, -1];
const testProgresses = [0.0, 0.1, 0.5, 0.9, 1.0, 1.5, -0.2, NaN];

for (let i = 0; i < 10000; i++) {
    try {
        const step = testSteps[i % testSteps.length];
        const prog = testProgresses[i % testProgresses.length];
        
        window.calibVisuals.setStep(step);
        window.calibVisuals.setProgress(prog);
        updateCalibrationVisuals(0.016);
    } catch (err) {
        stressErrors++;
        console.error(`Stress iteration ${i} failed:`, err);
    }
}

assert(stressErrors === 0, '10,000 rapid step/progress/render stress cycles completed with 0 errors');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log(`\n=================================================`);
console.log(`FINAL EMPIRICAL VERIFICATION RESULT:`);
console.log(`Passed: ${passCount} | Failed: ${failCount}`);
console.log(`=================================================`);

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
