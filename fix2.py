import os

with open('src/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the duplicate loading-overlay block at line 656
dup_overlay = '''<div id="loading-overlay">
    <div class="loading-spinner"></div>
    <div class="loading-text" id="loading-text">KHỞI ĐỘNG HỆ THỐNG...</div>
    <div id="loading-progress">0%</div>
</div>

'''
content = content.replace(dup_overlay, '')

# 2. Make camera visible by default on control mode
cam_script_old = '''    // Camera feed toggle (default: hidden)
    const camBtn    = document.getElementById('cam-toggle-btn');
    const camCanvas = document.querySelector('canvas.output_canvas');
    let camVisible  = false;

    camBtn.addEventListener('click', () => {
        camVisible = !camVisible;
        camCanvas.style.display = camVisible ? 'block' : 'none';
        camBtn.classList.toggle('cam-on', camVisible);
        camBtn.textContent = camVisible ? '🎥' : '📷';
        camBtn.title = camVisible ? 'Tắt camera' : 'Bật camera nhận dạng cử chỉ';
    });'''

cam_script_new = '''    // Camera feed toggle
    const camBtn    = document.getElementById('cam-toggle-btn');
    const camCanvas = document.querySelector('canvas.output_canvas');
    const isControlMode = new URLSearchParams(window.location.search).get("mode") === "control";
    let camVisible  = isControlMode;
    
    if (camVisible) {
        camCanvas.style.display = 'block';
        camBtn.classList.add('cam-on');
        camBtn.textContent = '🎥';
        camBtn.title = 'Tắt camera';
    }

    camBtn.addEventListener('click', () => {
        camVisible = !camVisible;
        camCanvas.style.display = camVisible ? 'block' : 'none';
        camBtn.classList.toggle('cam-on', camVisible);
        camBtn.textContent = camVisible ? '🎥' : '📷';
        camBtn.title = camVisible ? 'Tắt camera' : 'Bật camera nhận dạng cử chỉ';
    });'''

content = content.replace(cam_script_old, cam_script_new)

with open('src/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done index!')
