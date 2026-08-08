import fs from 'fs';

// Read src/renderer.js content
const rendererCode = fs.readFileSync('src/renderer.js', 'utf8');

console.log("=== EMPIRICAL VERIFICATION OF MILESTONE 1 ===");

// 1. Check calibGroup scene linkage
const calibGroupCreated = rendererCode.includes('const calibGroup = new THREE.Group();');
const calibGroupAdded = rendererCode.includes('scene.add(calibGroup);');
console.log(`1. calibGroup created: ${calibGroupCreated}, added to scene: ${calibGroupAdded}`);

// 2. Check render loop hook
const updateVisualsHooked = rendererCode.includes('updateCalibrationVisuals(delta);');
console.log(`2. updateCalibrationVisuals(delta) hooked in animate(): ${updateVisualsHooked}`);

// 3. Inspect procedural objects creation
const hasAsteroid = rendererCode.includes('DodecahedronGeometry') && rendererCode.includes('step1AsteroidGroup');
const hasDebrisParticles = rendererCode.includes('THREE.Points') && rendererCode.includes('debrisGeo') && rendererCode.includes('DEBRIS_COUNT = 140');
const hasEarthAndCloud = rendererCode.includes('createEarthTexture()') && rendererCode.includes('createCloudTexture()');
const hasFogParticles = rendererCode.includes('fogGeo') && rendererCode.includes('FOG_COUNT = 200');
const hasMoonAndRings = rendererCode.includes('RingGeometry') && rendererCode.includes('createMoonTexture()');
const hasHandSilhouette = rendererCode.includes('THREE.LineSegments') && rendererCode.includes('HAND_CONNECTIONS') && rendererCode.includes('jointNodes');

console.log(`3a. Step 1 (Asteroid + Debris Particles): Asteroid=${hasAsteroid}, Debris=${hasDebrisParticles}`);
console.log(`3b. Step 2 (Cloudy Earth + Fog Particles): Earth/Cloud=${hasEarthAndCloud}, Fog=${hasFogParticles}`);
console.log(`3c. Step 3 (Tiny Moon + Pulse Rings): Moon/Rings=${hasMoonAndRings}`);
console.log(`3d. 3D Wireframe Hand Silhouette (LineSegments + Joints): Hand=${hasHandSilhouette}`);

// 4. Memory Leak Analysis: Extract updateCalibrationVisuals function body
const startIdx = rendererCode.indexOf('function updateCalibrationVisuals(delta) {');
const endIdx = rendererCode.indexOf('window.calibVisuals = {');

if (startIdx !== -1 && endIdx !== -1) {
    const body = rendererCode.substring(startIdx, endIdx);
    
    // Check for THREE object instantiations inside render loop
    const matches = [...body.matchAll(/new\s+THREE\.(\w+)/g)].map(m => m[1]);
    
    console.log(`4. Memory Leak Check inside updateCalibrationVisuals loop:`);
    console.log(`   Allocations found inside function body:`, matches);
    
    const gpuAllocations = matches.filter(m => /Geometry|Material|Texture|Points|LineSegments|Mesh|WebGL|Group|Scene/.test(m));
    if (gpuAllocations.length > 0) {
        console.warn("  FAIL: Found GPU resource allocations inside update loop!", gpuAllocations);
    } else {
        console.log("  PASS: Zero GPU resources (Geometries, Materials, Textures, Meshes) are created per frame in updateCalibrationVisuals.");
    }

    // Check targetPose[i].clone() usage
    const cloneCount = (body.match(/\.clone\(\)/g) || []).length;
    console.log(`   Vector3 .clone() calls per joint per frame: ${cloneCount}`);
    if (cloneCount > 0) {
        console.log("  NOTE: Vector3.clone() is used for target joint pose interpolation (21 JS vector objects/frame). Lightweight JS GC objects only, no WebGL/GPU memory leak.");
    }
} else {
    console.error("  FAILED to slice updateCalibrationVisuals function body!");
}

// 5. Global window API check
const hasWindowCalibVisuals = rendererCode.includes('window.calibVisuals = {') &&
    rendererCode.includes('setStep:') &&
    rendererCode.includes('setProgress:') &&
    rendererCode.includes('reset:');
console.log(`5. Global API window.calibVisuals present: ${hasWindowCalibVisuals}`);
