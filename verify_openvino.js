const tf = require('@tensorflow/tfjs-node');
const { addon: ov } = require('openvino-node');
const fs = require('fs');
const path = require('path');

async function verify() {
    console.log("=== VERIFYING TF.JS vs OPENVINO ===");
    
    // 1. Build the same TFJS model
    const mlModel = tf.sequential();
    mlModel.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [63] }));
    mlModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    mlModel.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    
    // Just compile it with arbitrary optimizer so it's ready
    mlModel.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy' });
    
    // 2. Extract weights to write to BIN
    let totalLength = 0;
    const weightsList = [];
    for (const layer of mlModel.layers) {
        const weights = layer.getWeights();
        if (weights.length > 0) {
            const kernel = weights[0].dataSync();
            const bias = weights[1].dataSync();
            totalLength += kernel.length + bias.length;
            weightsList.push(kernel);
            weightsList.push(bias);
        }
    }
    
    const buffer = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of weightsList) {
        buffer.set(arr, offset);
        offset += arr.length;
    }
    
    // Overwrite the BIN file
    const binPath = path.join(__dirname, 'src', 'vendor', 'gesture_mlp_base.bin');
    const xmlPath = path.join(__dirname, 'src', 'vendor', 'gesture_mlp_base.xml');
    fs.writeFileSync(binPath, Buffer.from(buffer.buffer));
    
    // 3. Load OpenVINO model
    const core = new ov.Core();
    const model = core.readModel(xmlPath);
    const compiledModel = core.compileModel(model, 'AUTO');
    const inferRequest = compiledModel.createInferRequest();
    
    // 4. Generate random input features
    const testFeatures = [];
    for (let i = 0; i < 63; i++) {
        testFeatures.push(Math.random());
    }
    const floatData = new Float32Array(testFeatures);
    
    // 5. Run TF.JS Inference
    const tfResult = tf.tidy(() => {
        const inputTensor = tf.tensor2d([testFeatures]);
        return mlModel.predict(inputTensor).dataSync();
    });
    
    // 6. Run OpenVINO Inference
    const tensor = new ov.Tensor(ov.element.f32, [1, 63], floatData);
    inferRequest.setInputTensor(tensor);
    inferRequest.infer();
    const ovResult = inferRequest.getOutputTensor().data;
    
    // 7. Compare
    console.log("TF.JS Output:   ", Array.from(tfResult));
    console.log("OpenVINO Output:", Array.from(ovResult));
    
    let maxDiff = 0;
    for (let i = 0; i < 3; i++) {
        const diff = Math.abs(tfResult[i] - ovResult[i]);
        if (diff > maxDiff) maxDiff = diff;
    }
    
    console.log(`Max Difference: ${maxDiff.toExponential(4)}`);
    if (maxDiff < 1e-4) {
        console.log("✅ VERIFICATION PASSED! OpenVINO accurately replicates TF.JS.");
    } else {
        console.error("❌ VERIFICATION FAILED! Outputs mismatch.");
    }
}

verify().catch(console.error);
