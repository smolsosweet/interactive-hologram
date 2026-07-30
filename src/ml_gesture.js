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
let tutorialTimer = null;
let currentSampleCount = 0;
const SAMPLES_NEEDED = 10;
const TIMEOUT_MS = 10000;

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
    updateTutorialUI();
    tutOverlay.classList.remove('hidden');

    // Cài đặt Timeout (Fallback to Rule-based)
    clearTimeout(tutorialTimer);
    tutorialTimer = setTimeout(() => {
        console.warn("[ML] Tutorial timeout! Fallback to rule-based.");
        finishTutorial(true); // force fallback
    }, TIMEOUT_MS);
}

window.startCurrentSample = function() {
    window.isMlSamplingActive = true;
    document.getElementById('tut-start-btn').style.display = 'none';
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
        tutIcon.textContent = "🖐";
    } else if (window.mlTutorialStep === 2) {
        tutTitle.textContent = "Bước 3: Chụm tay (Pinch)";
        tutDesc.textContent = "Chụm 2 ĐẦU NGÓN TAY (Cái & Trỏ) vào nhau để Zoom.";
        tutIcon.textContent = "✌️";
    }
    
    tutStatus.textContent = `Đang lấy mẫu... (${currentSampleCount}/${SAMPLES_NEEDED})`;
    tutProgressBar.style.width = `${(currentSampleCount / SAMPLES_NEEDED) * 100}%`;

    const startBtn = document.getElementById('tut-start-btn');
    const progCont = document.getElementById('tut-progress-container');
    const tutStat = document.getElementById('tut-status');
    if (startBtn && progCont && tutStat) {
        startBtn.style.display = 'inline-block';
        progCont.style.display = 'none';
        tutStat.style.display = 'none';
    }
}

// Hàm này được gọi từ renderer.js mỗi frame khi isMlCalibrating = true
window.processMLCalibration = function(landmarks) {
    if (!window.isMlCalibrating || window.mlTutorialStep < 0 || !window.isMlSamplingActive) return;

    const features = extractFeatures(landmarks);
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
        clearTimeout(tutorialTimer);
        
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
        
        for (const label of [0, 2, 5]) {
            for (const feat of window.mlSamples[label]) {
                inputs.push(feat);
                let oneHot = [0, 0, 0];
                if (label === 0) oneHot[0] = 1;
                else if (label === 2) oneHot[1] = 1;
                else if (label === 5) oneHot[2] = 1;
                labels.push(oneHot);
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

        console.log("[ML] Training completed successfully!");
        finishTutorial(false);
    } catch (e) {
        console.error("[ML] Training failed:", e);
        finishTutorial(true);
    }
}

function finishTutorial(fallback) {
    window.isMlCalibrating = false;
    window.mlTutorialStep = -1;
    if (fallback) {
        window.useFallbackRuleBased = true;
    } else {
        window.useFallbackRuleBased = false;
    }
    if (tutOverlay) tutOverlay.classList.add('hidden');
}

window.predictMLGestureSync = function(landmarks) {
    if (window.useFallbackRuleBased || !window.mlModel) {
        return "fallback";
    }
    const features = extractFeatures(landmarks);
    if (!features) return "fallback";
    
    return tf.tidy(() => {
        const inputTensor = tf.tensor2d([features]);
        const prediction = window.mlModel.predict(inputTensor);
        const argMax = prediction.argMax(-1).dataSync()[0];
        
        if (argMax === 0) return 0;
        if (argMax === 1) return 2;
        if (argMax === 2) return 5;
        return "fallback";
    });
};

function extractFeatures(landmarks) {
    if (!landmarks || landmarks.length < 21) return null;
    const wrist = landmarks[0];
    let normalized = landmarks.map(lm => ({
        x: lm.x - wrist.x,
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
