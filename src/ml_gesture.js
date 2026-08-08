// ==========================================
// ML GESTURE RECOGNITION (TENSORFLOW.JS)
// ==========================================

// Global State
window.mlModel = null;
window.isMlCalibrating = false;
window.mlTutorialStep = -1; // -1: Done/Hidden, 0: Nắm tay, 1: Xòe tay, 2: Pinch
window.mlSamples = { 0: [], 2: [], 5: [] }; 
window.useFallbackRuleBased = false;
window.isMlSamplingActive = false;

// UI Elements
let tutOverlay, tutTitle, tutDesc, tutIcon, tutProgressBar, tutStatus, tutTimeoutText;
let currentSampleCount = 0;
let tutorialTimer = null;
const SAMPLES_NEEDED = 10;
const TIMEOUT_MS = 15000;

function initMLTutorial() {
    tutOverlay = document.getElementById('tutorial-overlay');
    tutTitle = document.getElementById('tut-title');
    tutDesc = document.getElementById('tut-desc');
    tutIcon = document.getElementById('tut-gesture-icon');
    tutProgressBar = document.getElementById('tut-progress-bar');
    tutStatus = document.getElementById('tut-status');
    tutTimeoutText = document.getElementById('tut-timeout');

    // Chỉ bật tutorial ở Tab 1 (Control) hoặc khi không bật dual-screen
    if (document.body.classList.contains('hologram-mode')) {
        finishTutorial(true); // Hologram tab doesn't do tutorial
        return;
    }

    startTutorialStep(0);
}

function startTutorialStep(step) {
    window.mlTutorialStep = step;
    window.isMlCalibrating = true;
    window.isMlSamplingActive = false;
    currentSampleCount = 0;
    
    document.body.classList.add('ml-calibrating');

    if (tutOverlay) tutOverlay.classList.remove('hidden');
    updateTutorialUI();
    
    // Auto-skip sau 15 giây nếu học sinh không thao tác
    clearTimeout(tutorialTimer);
    tutorialTimer = setTimeout(() => {
        if (!window.isMlSamplingActive) {
            console.warn("[ML] Auto-timeout triggered due to inactivity.");
            window.skipTutorial();
        }
    }, TIMEOUT_MS);
}

window.skipTutorial = function() {
    clearTimeout(tutorialTimer);
    console.log("[ML] User skipped tutorial. Fallback to rule-based.");
    finishTutorial(true);
}

window.startCurrentSample = function() {
    clearTimeout(tutorialTimer);
    window.isMlSamplingActive = true;
    const startBtn = document.getElementById('tut-start-btn');
    const skipBtn = document.getElementById('tut-skip-btn');
    if (startBtn) startBtn.style.display = 'none';
    if (skipBtn) skipBtn.style.display = 'none';
    document.getElementById('tut-progress-container').style.display = 'block';
    document.getElementById('tut-status').style.display = 'block';
}

function updateTutorialUI() {
    if (window.mlTutorialStep === 0) {
        tutTitle.textContent = "Bước 1: Nắm tay";
        tutDesc.textContent = "Vui lòng đưa tay vào camera và NẮM CHẶT TAY.";
        tutIcon.textContent = "👊";
    } else if (window.mlTutorialStep === 1) {
        tutTitle.textContent = "Bước 2: Xòe tay";
        tutDesc.textContent = "Vui lòng XÒE RỘNG BÀN TAY của bạn ra.";
        tutIcon.textContent = "🖐️";
    } else if (window.mlTutorialStep === 2) {
        tutTitle.textContent = "Bước 3: Chụm tay (Pinch)";
        tutDesc.textContent = "Chụm 2 ĐẦU NGÓN TAY (Cái & Trỏ) vào nhau để Zoom.";
        tutIcon.textContent = "🤏";
    }
    
    tutStatus.textContent = `Đang lấy mẫu... (${currentSampleCount}/${SAMPLES_NEEDED})`;
    tutProgressBar.style.width = `${(currentSampleCount / SAMPLES_NEEDED) * 100}%`;

    const startBtn = document.getElementById('tut-start-btn');
    const skipBtn = document.getElementById('tut-skip-btn');
    const progCont = document.getElementById('tut-progress-container');
    const tutStat = document.getElementById('tut-status');
    if (startBtn && progCont && tutStat) {
        startBtn.style.display = 'block';
        if (skipBtn) skipBtn.style.display = 'block';
        progCont.style.display = 'none';
        tutStat.style.display = 'none';
    }
}

// Hàm này được gọi từ renderer.js mỗi frame khi isMlCalibrating = true
window.processMLCalibration = function(landmarks, isRight) {
    if (!window.isMlCalibrating || window.mlTutorialStep < 0 || window.mlTutorialStep > 2 || !window.isMlSamplingActive) return;
    
    const label = [0, 2, 5][window.mlTutorialStep];
    const features = extractFeatures(landmarks, isRight);
    if (!features) return;

    let targetLabel = 0;
    if (window.mlTutorialStep === 0) targetLabel = 0;
    else if (window.mlTutorialStep === 1) targetLabel = 5;
    else if (window.mlTutorialStep === 2) targetLabel = 2;

    window.mlSamples[targetLabel].push(features);
    currentSampleCount++;
    
    // UI Update (throttle a bit if needed)
    updateTutorialUI();

    if (currentSampleCount >= SAMPLES_NEEDED) {
        window.isMlSamplingActive = false; // Ngăn chặn việc gọi nhiều lần
        
        if (window.mlTutorialStep < 2) {
            startTutorialStep(window.mlTutorialStep + 1);
        } else {
            // Done gathering! Train it.
            tutTitle.textContent = "Đang huấn luyện AI...";
            tutDesc.textContent = "Vui lòng đợi trong giây lát...";
            tutIcon.textContent = "🚀";
            tutStatus.textContent = "Training...";
            tutProgressBar.style.width = "100%";
            setTimeout(trainMLModel, 100);
        }
    }
};

async function trainMLModel() {
    try {
        const inputs = [];
        const labels = [];
        
        // Data Augmentation: Rotate features around Z axis by a given angle (in degrees)
        const augmentFeature = (feat, angleDeg) => {
            const rad = angleDeg * Math.PI / 180;
            const cosA = Math.cos(rad);
            const sinA = Math.sin(rad);
            const newFeat = new Array(63);
            for (let i = 0; i < 21; i++) {
                const x = feat[i * 3];
                const y = feat[i * 3 + 1];
                const z = feat[i * 3 + 2];
                newFeat[i * 3] = x * cosA - y * sinA;
                newFeat[i * 3 + 1] = x * sinA + y * cosA;
                newFeat[i * 3 + 2] = z;
            }
            return newFeat;
        };

        for (const label of [0, 2, 5]) {
            for (const feat of window.mlSamples[label]) {
                let oneHot = [0, 0, 0];
                if (label === 0) oneHot[0] = 1;
                else if (label === 2) oneHot[1] = 1;
                else if (label === 5) oneHot[2] = 1;

                // Original
                inputs.push(feat);
                labels.push(oneHot);

                // Augmented: ±10°, ±20°
                const angles = [-20, -10, 10, 20];
                for (const a of angles) {
                    inputs.push(augmentFeature(feat, a));
                    labels.push(oneHot);
                }
            }
        }

        const xs = tf.tensor2d(inputs);
        const ys = tf.tensor2d(labels);

        window.mlModel = tf.sequential();
        window.mlModel.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [63] }));
        window.mlModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        window.mlModel.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

        window.mlModel.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        await window.mlModel.fit(xs, ys, { epochs: 40, batchSize: 16 });
        xs.dispose();
        ys.dispose();
        console.log("[ML] Training complete.");

        // Run Stress Test automatically after training
        runStressTest();
        console.log("[ML] Training completed successfully!");
        finishTutorial(false);
    } catch (e) {
        console.error("[ML] Error during training:", e);
        finishTutorial(true);
    }
}

async function runStressTest() {
    console.log("[ML] Starting Overfitting Stress Test (±20° variation)...");
    let totalSamples = 0;
    let correctPredictions = 0;

    const augmentFeature = (feat, angleDeg) => {
        const rad = angleDeg * Math.PI / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const newFeat = new Array(63);
        for (let i = 0; i < 21; i++) {
            const x = feat[i * 3];
            const y = feat[i * 3 + 1];
            const z = feat[i * 3 + 2];
            newFeat[i * 3] = x * cosA - y * sinA;
            newFeat[i * 3 + 1] = x * sinA + y * cosA;
            newFeat[i * 3 + 2] = z;
        }
        return newFeat;
    };

    const anglesToTest = [-20, -15, 15, 20];
    const testInputs = [];
    const expectedLabels = [];

    for (const label of [0, 2, 5]) {
        for (const feat of window.mlSamples[label]) {
            for (const a of anglesToTest) {
                testInputs.push(augmentFeature(feat, a));
                expectedLabels.push(label);
            }
        }
    }

    totalSamples = testInputs.length;
    if (totalSamples === 0) return;

    const xs = tf.tensor2d(testInputs);
    const preds = window.mlModel.predict(xs);
    const argMaxes = preds.argMax(-1).dataSync();

    for (let i = 0; i < totalSamples; i++) {
        let expected = expectedLabels[i];
        let predictedRaw = argMaxes[i];
        let predicted = -1;
        if (predictedRaw === 0) predicted = 0;
        if (predictedRaw === 1) predicted = 2;
        if (predictedRaw === 2) predicted = 5;

        if (predicted === expected) {
            correctPredictions++;
        }
    }

    xs.dispose();
    preds.dispose();

    const finalAccuracy = (correctPredictions / totalSamples) * 100;
    console.log(`[ML] Stress Test Results: ${correctPredictions}/${totalSamples} correct (${finalAccuracy.toFixed(1)}%)`);
    
    // Auto-Log to main process
    if (typeof require !== 'undefined') {
        const { ipcRenderer } = require('electron');
        window.stressTestCount = (window.stressTestCount || 0) + 1;
        ipcRenderer.send('log-stresstest', {
            iteration: window.stressTestCount,
            accuracy: finalAccuracy.toFixed(1)
        });
    }

    if (finalAccuracy >= 90) {
        console.log("[ML] Go/No-Go Check: PASSED! (Accuracy >= 90%)");
        exportToOpenVINO();
    } else {
        console.warn("[ML] Go/No-Go Check: FAILED! (Accuracy < 90%)");
    }
}

async function exportToOpenVINO() {
    console.log("[ML] Exporting model to OpenVINO...");
    if (typeof require === 'undefined') return;
    const { ipcRenderer } = require('electron');
    
    // Model layers: Dense(32), Dense(16), Dense(3)
    let totalLength = 0;
    const weightsList = [];
    for (const layer of window.mlModel.layers) {
        const weights = layer.getWeights();
        if (weights.length > 0) {
            const transposedKernel = tf.tidy(() => tf.transpose(weights[0]));
            const kernel = transposedKernel.dataSync();
            transposedKernel.dispose();
            
            const bias = weights[1].dataSync();
            totalLength += kernel.length + bias.length;
            weightsList.push(kernel);
            weightsList.push(bias);
        }
    }
    
    // Convert to Float32Array
    const buffer = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of weightsList) {
        buffer.set(arr, offset);
        offset += arr.length;
    }
    
    const success = await ipcRenderer.invoke('ov-init', buffer.buffer);
    if (success) {
        console.log("[ML] OpenVINO model initialized on backend.");
        window.useOpenVINO = true;
        const hudEngine = document.getElementById('hud-engine');
        if (hudEngine) {
            hudEngine.textContent = "OpenVINO";
            hudEngine.style.color = "#00c3ff";
        }
    } else {
        console.error("[ML] Failed to initialize OpenVINO backend.");
    }
}

function finishTutorial(fallback) {
    clearTimeout(tutorialTimer);
    window.isMlCalibrating = false;
    window.mlTutorialStep = -1;
    document.body.classList.remove('ml-calibrating');
    if (fallback) {
        window.useFallbackRuleBased = true;
    } else {
        window.useFallbackRuleBased = false;
    }
    if (tutOverlay) tutOverlay.classList.add('hidden');
}

window.predictMLGestureSync = function(landmarks, isRight) {
    if (window.useFallbackRuleBased) {
        return "fallback";
    }
    const features = extractFeatures(landmarks, isRight);
    if (!features) return "fallback";
    
    if (window.useOpenVINO && typeof require !== 'undefined') {
        const { ipcRenderer } = require('electron');
        const startTime = performance.now();
        const probs = ipcRenderer.sendSync('ov-infer-sync', features);
        console.log("[ML-OV] probs:", probs);
        
        window.mlLatency = (performance.now() - startTime).toFixed(1);
        const hudLatency = document.getElementById('hud-latency');
        if (hudLatency) hudLatency.textContent = window.mlLatency + " ms";
        
        if (probs) {
            // Find argmax
            let maxProb = -1;
            let maxIdx = -1;
            for (let i = 0; i < probs.length; i++) {
                if (probs[i] > maxProb) { maxProb = probs[i]; maxIdx = i; }
            }
            if (maxIdx === 0) return 0;
            if (maxIdx === 1) return 2;
            if (maxIdx === 2) return 5;
            return "fallback";
        }
    }

    if (!window.mlModel) return "fallback";

    return tf.tidy(() => {
        const startTime = performance.now();
        const inputTensor = tf.tensor2d([features]);
        const prediction = window.mlModel.predict(inputTensor);
        const argMax = prediction.argMax(-1).dataSync()[0];
        
        window.mlLatency = (performance.now() - startTime).toFixed(1);
        const hudLatency = document.getElementById('hud-latency');
        if (hudLatency) hudLatency.textContent = window.mlLatency + " ms";
        
        if (argMax === 0) return 0;
        if (argMax === 1) return 2;
        if (argMax === 2) return 5;
        return "fallback";
    });
};

function extractFeatures(landmarks, isRight) {
    if (!landmarks || landmarks.length !== 21) return null;

    // Center at wrist
    const wrist = landmarks[0];
    let normalized = landmarks.map(lm => ({
        x: (lm.x - wrist.x) * (isRight === false ? -1 : 1), // Phản chiếu tay trái thành tay phải
        y: lm.y - wrist.y,
        z: lm.z - wrist.z
    }));
    const midMCP = normalized[9];
    const scale = Math.hypot(midMCP.x, midMCP.y, midMCP.z) || 1;
    let features = [];
    normalized.forEach(lm => {
        features.push(lm.x / scale);
        features.push(lm.y / scale);
        features.push(lm.z / scale);
    });
    return features;
}

// Reset Calibration for Session-based privacy
window.resetMLCalibration = function() {
    window.mlSamples = { 0: [], 2: [], 5: [] };
    if (window.mlModel) {
        window.mlModel.dispose();
        window.mlModel = null;
    }
    initMLTutorial();
};
