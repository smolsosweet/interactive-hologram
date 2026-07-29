const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

let trainingData = [];
let model = null;
let currentLandmarks = null;

// ==========================================
// FEATURE EXTRACTION (Tiền xử lý)
// ==========================================
// Mục tiêu: Bất biến với vị trí (Translation Invariant) và kích thước (Scale Invariant)
function extractFeatures(landmarks) {
    if (!landmarks || landmarks.length < 21) return null;
    
    // 1. Dịch chuyển mốc 0 (Wrist) về gốc tọa độ (0,0,0)
    const wrist = landmarks[0];
    let normalized = landmarks.map(lm => ({
        x: lm.x - wrist.x,
        y: lm.y - wrist.y,
        z: lm.z - wrist.z
    }));

    // 2. Chia tỷ lệ (Scale) dựa trên kích thước bàn tay 
    // (Khoảng cách từ Wrist đến Middle Finger MCP)
    const midMCP = normalized[9];
    const scale = Math.hypot(midMCP.x, midMCP.y, midMCP.z) || 1;

    let features = [];
    normalized.forEach(lm => {
        features.push(lm.x / scale);
        features.push(lm.y / scale);
        features.push(lm.z / scale);
    });

    return features; // Trả về vector 63 chiều (21 x 3)
}

// ==========================================
// RULE-BASED LOGIC (Logic Cũ để so sánh)
// ==========================================
function isThumbExtended(lm) {
    if (!lm || lm.length < 21 || !lm[4] || !lm[5] || !lm[0] || !lm[9]) return false;
    return Math.hypot(lm[4].x - lm[5].x, lm[4].y - lm[5].y)
        > Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) * 0.55;
}
function countFingersAll(lm) {
    if (!lm || lm.length < 21) return -1;
    let n = 0;
    if (isThumbExtended(lm)) n++;
    if (lm[8].y < lm[6].y) n++;
    if (lm[12].y < lm[10].y) n++;
    if (lm[16].y < lm[14].y) n++;
    if (lm[20].y < lm[18].y) n++;
    return n;
}

// ==========================================
// DATA COLLECTION
// ==========================================
function recordSample(label) {
    if (!currentLandmarks) {
        alert("Chưa nhận diện được bàn tay!");
        return;
    }
    const features = extractFeatures(currentLandmarks);
    if (features) {
        trainingData.push({ features, label });
        document.getElementById(`count-${label}`).textContent = 
            `${trainingData.filter(d => d.label === label).length} mẫu`;
    }
}

function resetData() {
    trainingData = [];
    document.getElementById('count-0').textContent = "0 mẫu";
    document.getElementById('count-2').textContent = "0 mẫu";
    document.getElementById('count-5').textContent = "0 mẫu";
    document.getElementById('train-status').textContent = "Đã xóa dữ liệu.";
    document.getElementById('train-status').style.color = "#ffdd57";
    model = null;
}

// ==========================================
// TENSORFLOW.JS MLP MODEL
// ==========================================
async function trainModel() {
    if (trainingData.length < 10) {
        alert("Cần thu thập ít nhất 10 mẫu tổng cộng!");
        return;
    }
    document.getElementById('train-status').textContent = "Đang huấn luyện...";
    document.getElementById('train-status').style.color = "#00FF88";

    // Chuẩn bị dữ liệu
    const inputs = [];
    const labels = [];
    trainingData.forEach(d => {
        inputs.push(d.features);
        let oneHot = [0, 0, 0];
        if (d.label === 0) oneHot[0] = 1; // Nắm tay
        else if (d.label === 2) oneHot[1] = 1; // Pinch
        else if (d.label === 5) oneHot[2] = 1; // Xòe tay
        labels.push(oneHot);
    });

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels);

    // Xây dựng mạng MLP nhỏ (Tối ưu cho Edge AI)
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [63] }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 16,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                if(epoch % 10 === 0) console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}`);
            }
        }
    });

    document.getElementById('train-status').textContent = "✅ Đã huấn luyện xong!";
    xs.dispose();
    ys.dispose();
}

async function predictML(landmarks) {
    if (!model) return "-";
    const features = extractFeatures(landmarks);
    if (!features) return "-";
    
    return tf.tidy(() => {
        const inputTensor = tf.tensor2d([features]);
        const prediction = model.predict(inputTensor);
        const argMax = prediction.argMax(-1).dataSync()[0];
        
        if (argMax === 0) return 0; // Nắm tay
        if (argMax === 1) return 2; // Pinch
        if (argMax === 2) return 5; // Xòe tay
        return "-";
    });
}

// ==========================================
// MEDIAPIPE INITIALIZATION
// ==========================================
const hands = new Hands({ locateFile: (file) => `../node_modules/@mediapipe/hands/${file}` });
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75
});

hands.onResults(async (results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        currentLandmarks = results.multiHandLandmarks[0];
        drawConnectors(canvasCtx, currentLandmarks, HAND_CONNECTIONS, { color: '#00FF88', lineWidth: 2 });
        drawLandmarks(canvasCtx, currentLandmarks, { color: '#FF0000', lineWidth: 1 });

        // Evaluate Rule-based
        const ruleFingers = countFingersAll(currentLandmarks);
        let ruleText = ruleFingers + " ngón";
        if (ruleFingers === 0) ruleText = "👊 Nắm tay (0)";
        else if (ruleFingers === 5) ruleText = "🖐 Xòe tay (5)";
        
        // Evaluate ML Personalized
        const mlFingers = await predictML(currentLandmarks);
        let mlText = mlFingers === "-" ? "Chưa có model" : mlFingers + " ngón";
        if (mlFingers === 0) mlText = "👊 Nắm tay (ML)";
        else if (mlFingers === 2) mlText = "✌️ Pinch (ML)";
        else if (mlFingers === 5) mlText = "🖐 Xòe tay (ML)";

        document.getElementById('pred-rule').textContent = ruleText;
        document.getElementById('pred-ml').textContent = mlText;
    } else {
        currentLandmarks = null;
        document.getElementById('pred-rule').textContent = "Không thấy tay";
        document.getElementById('pred-ml').textContent = "Không thấy tay";
    }
    canvasCtx.restore();
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();
