import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

const path = require('path');

// ============================================================
// 1. SCENE & RENDERER SETUP
// ============================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);


// ── Overview camera ──
const overviewCam = new THREE.PerspectiveCamera(
    60, container.clientWidth / container.clientHeight, 0.1, 8000
);
overviewCam.position.set(0, 62.5, 42.5);

// ── Focus camera (for single planet view) ──
const focusCam = new THREE.PerspectiveCamera(50, 1, 0.01, 5000);

const threeRenderer = new THREE.WebGLRenderer({ antialias: true });
threeRenderer.setSize(container.clientWidth, container.clientHeight);
threeRenderer.setPixelRatio(window.devicePixelRatio);
threeRenderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(threeRenderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sunLight = new THREE.PointLight(0xfff0cc, 3.5, 6000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

let mixer = null;

// ============================================================
// 2. PLANET DATA
// ============================================================
const PLANET_NAMES = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
const ORBITAL_PERIODS = [Infinity, 88, 225, 365, 687, 4333, 10759, 30687, 60190];
const PLANET_EMOJI = ['☀️', '🔴', '🟡', '🔵', '🟠', '🟤', '💛', '🩵', '🔵'];
const TIME_SCALE = 365 * 0.5;

const NAME_TO_IDX = {
    sun: 0, mercury: 1, venus: 2, erath: 3, earth: 3,
    mars: 4, jupiter: 5, saturn: 6, uranus: 7, neptune: 8
};

const PLANET_MODEL_FILES = ['sun.glb', 'mercury.glb', 'venus.glb', 'earth.glb', 'mars.glb', 'jupiter.glb', 'saturn.glb', 'uranus.glb', 'neptune.glb'];

const PLANET_INFO = [
    {
        nameVi: 'Mặt Trời', nameEn: 'Sun', emoji: '☀️', color: '#FDB813',
        type: 'Ngôi sao (Lùn vàng G2V)',
        stats: [
            { label: 'Đường kính', value: '1,392,700 km' },
            { label: 'Khối lượng', value: '333,000× Trái Đất' },
            { label: 'Nhiệt độ bề mặt', value: '~5,500°C' },
            { label: 'Nhiệt độ lõi', value: '~15,000,000°C' },
            { label: 'Tuổi', value: '4.6 tỷ năm' },
            { label: 'Thành phần', value: 'Hydro & Heli' },
        ],
        desc: 'Mặt Trời là ngôi sao trung tâm hệ mặt trời, cách Trái Đất 150 triệu km. Năng lượng từ phản ứng nhiệt hạch — hợp nhất hydro thành heli. Mặt Trời chiếm 99,86% khối lượng hệ và giữ tất cả hành tinh trên quỹ đạo bằng lực hấp dẫn.',
    },
    {
        nameVi: 'Sao Thủy', nameEn: 'Mercury', emoji: '🔴', color: '#B0B0B0',
        type: 'Hành tinh đất đá',
        stats: [
            { label: 'Đường kính', value: '4,879 km' },
            { label: 'Cách Mặt Trời', value: '57.9 triệu km' },
            { label: 'Chu kỳ quỹ đạo', value: '88 ngày Trái Đất' },
            { label: 'Ngày trên hành tinh', value: '59 ngày Trái Đất' },
            { label: 'Nhiệt độ', value: '-173°C đến 427°C' },
            { label: 'Số vệ tinh', value: '0' },
        ],
        desc: 'Sao Thủy là hành tinh nhỏ nhất, gần Mặt Trời nhất. Không có khí quyển đủ dày nên biên độ nhiệt cực lớn. Đặc biệt, một ngày trên Sao Thủy còn dài hơn một năm của nó!',
    },
    {
        nameVi: 'Sao Kim', nameEn: 'Venus', emoji: '🟡', color: '#E8C46A',
        type: 'Hành tinh đất đá',
        stats: [
            { label: 'Đường kính', value: '12,104 km' },
            { label: 'Cách Mặt Trời', value: '108.2 triệu km' },
            { label: 'Chu kỳ quỹ đạo', value: '225 ngày Trái Đất' },
            { label: 'Nhiệt độ TB', value: '~465°C (nóng nhất!)' },
            { label: 'Số vệ tinh', value: '0' },
            { label: 'Chiều tự quay', value: 'Ngược chiều (Đông→Tây)' },
        ],
        desc: 'Sao Kim nóng nhất hệ mặt trời dù không gần Mặt Trời nhất. Khí CO₂ dày đặc tạo hiệu ứng nhà kính cực mạnh. Trên Sao Kim, mặt trời mọc ở phía Tây vì nó quay ngược chiều!',
    },
    {
        nameVi: 'Trái Đất', nameEn: 'Earth', emoji: '🔵', color: '#3CA3E0',
        type: 'Hành tinh đất đá — Duy nhất có sự sống',
        stats: [
            { label: 'Đường kính', value: '12,742 km' },
            { label: 'Cách Mặt Trời', value: '149.6 triệu km (1 AU)' },
            { label: 'Chu kỳ quỹ đạo', value: '365.25 ngày' },
            { label: 'Nhiệt độ TB', value: '15°C' },
            { label: 'Số vệ tinh', value: '1 (Mặt Trăng)' },
            { label: 'Diện tích nước', value: '71% bề mặt' },
        ],
        desc: 'Trái Đất là hành tinh duy nhất có sự sống. 71% bề mặt là nước lỏng. Khí quyển bảo vệ chúng ta khỏi bức xạ tử ngoại và giữ nhiệt độ ổn định cho sinh vật phát triển.',
    },
    {
        nameVi: 'Sao Hỏa', nameEn: 'Mars', emoji: '🟠', color: '#CF6237',
        type: 'Hành tinh đất đá',
        stats: [
            { label: 'Đường kính', value: '6,779 km' },
            { label: 'Cách Mặt Trời', value: '227.9 triệu km' },
            { label: 'Chu kỳ quỹ đạo', value: '687 ngày (~1.9 năm)' },
            { label: 'Nhiệt độ', value: '-87°C đến -5°C' },
            { label: 'Số vệ tinh', value: '2 (Phobos, Deimos)' },
            { label: 'Núi cao nhất', value: 'Olympus Mons 21 km' },
        ],
        desc: 'Sao Hỏa — "Hành tinh Đỏ" — là mục tiêu thám hiểm hàng đầu. Olympus Mons là núi cao nhất hệ mặt trời (gấp 2.5× đỉnh Everest). Nhiều tàu thăm dò đã và đang hoạt động trên đó.',
    },
    {
        nameVi: 'Sao Mộc', nameEn: 'Jupiter', emoji: '🟤', color: '#C88B3A',
        type: 'Hành tinh khí khổng lồ',
        stats: [
            { label: 'Đường kính', value: '139,820 km' },
            { label: 'Cách Mặt Trời', value: '778.5 triệu km' },
            { label: 'Chu kỳ quỹ đạo', value: '~11.9 năm' },
            { label: 'Nhiệt độ đám mây', value: '-108°C' },
            { label: 'Số vệ tinh', value: '95 (Io, Europa...)' },
            { label: 'Vết Đỏ Lớn', value: 'Bão tồn tại 400+ năm' },
        ],
        desc: 'Sao Mộc lớn gấp 1,300 lần Trái Đất — hành tinh khổng lồ nhất hệ mặt trời. Đóng vai trò "lá chắn" cho Trái Đất, thu hút nhiều tiểu hành tinh nguy hiểm bằng lực hấp dẫn.',
    },
    {
        nameVi: 'Sao Thổ', nameEn: 'Saturn', emoji: '💛', color: '#D4B96A',
        type: 'Hành tinh khí khổng lồ (có vành đai)',
        stats: [
            { label: 'Đường kính', value: '116,460 km' },
            { label: 'Cách Mặt Trời', value: '1.43 tỷ km' },
            { label: 'Chu kỳ quỹ đạo', value: '~29.5 năm' },
            { label: 'Nhiệt độ đám mây', value: '-139°C' },
            { label: 'Số vệ tinh', value: '146+ (Titan...)' },
            { label: 'Rộng vành đai', value: '282,000 km' },
        ],
        desc: 'Sao Thổ nổi tiếng với vành đai tuyệt đẹp — rộng 282,000 km nhưng chỉ dày 20m đến 1km, chủ yếu là băng và đá. Thú vị: Sao Thổ đủ nhẹ để nổi trên nước!',
    },
    {
        nameVi: 'Sao Thiên Vương', nameEn: 'Uranus', emoji: '🩵', color: '#6DD8E8',
        type: 'Hành tinh băng khổng lồ',
        stats: [
            { label: 'Đường kính', value: '50,724 km' },
            { label: 'Cách Mặt Trời', value: '2.87 tỷ km' },
            { label: 'Chu kỳ quỹ đạo', value: '~84 năm' },
            { label: 'Nhiệt độ', value: '-197°C (lạnh nhất!)' },
            { label: 'Số vệ tinh', value: '28 (Miranda...)' },
            { label: 'Góc nghiêng', value: '97.7° (nằm ngang!)' },
        ],
        desc: 'Sao Thiên Vương có trục quay nghiêng 97.7° — gần như nằm ngang! Mỗi cực đón ánh sáng 42 năm liên tục rồi chìm vào bóng tối 42 năm. Đây là hành tinh lạnh nhất hệ mặt trời.',
    },
    {
        nameVi: 'Sao Hải Vương', nameEn: 'Neptune', emoji: '🔵', color: '#3E54B5',
        type: 'Hành tinh băng khổng lồ',
        stats: [
            { label: 'Đường kính', value: '49,244 km' },
            { label: 'Cách Mặt Trời', value: '4.5 tỷ km' },
            { label: 'Chu kỳ quỹ đạo', value: '~165 năm' },
            { label: 'Nhiệt độ', value: '-201°C' },
            { label: 'Số vệ tinh', value: '16 (Triton...)' },
            { label: 'Gió mạnh nhất', value: '2,100 km/h' },
        ],
        desc: 'Gió mạnh nhất hệ mặt trời — 2,100 km/h, nhanh hơn âm thanh! Sao Hải Vương được tìm thấy năm 1846 qua tính toán toán học trước khi nhìn thấy bằng kính thiên văn.',
    }
];

// ============================================================
// 3. STATE
// ============================================================
let orbitalPivots = [];
let solarSystemLoaded = false;
const modelGroup = new THREE.Group();
modelGroup.rotation.order = 'YXZ';
scene.add(modelGroup);

// Overview camera
let overviewZoomFactor = 1.0;
let targetOverviewZoomFactor = 1.0;
let overviewBasePos = new THREE.Vector3(0, 62.5, 42.5);
let overviewLook = new THREE.Vector3(9, 10.5, 0);

let moonPivot = null;
let moonOrbitLine = null;

// ── FOCUS STATE ──
let inPlanetFocus = false;
let focusIndex = -1;
let focusZoomFactor = 1.0;
let targetFocusZoomFactor = 1.0;
let debugTimer = 0;

// Two-layer structure: focusModelGroup (fixed, holds lights) → focusSpinner (rotates, holds model)
const focusModelGroup = new THREE.Group();
focusModelGroup.visible = false;
scene.add(focusModelGroup);
// ── AUTO-CENTERING SYSTEM ──
// Vị trí hành tinh và hệ mặt trời được TÍNH TOÁN TỰ ĐỘNG dựa trên kích thước màn hình thực tế.
// Không cần calibrate thủ công. Hoạt động chính xác trên MỌI loại laptop.
//
// Fine-tune offset & zoom (chỉ dùng cho hologram box bị đặt lệch vật lý):
let hologramCalib = {
    overview: { offsetX: 0.0260, offsetY: -0.0463, zoom: 1.0 },
    focusClosed: { offsetX: 0, offsetY: 0, zoom: 1.0 },
    focusOpen: { offsetX: -0.0618, offsetY: 0, zoom: 1.0 }
};

function getActiveStateKey() {
    if (inPlanetFocus) {
        return isInfoPanelVisible ? 'focusOpen' : 'focusClosed';
    }
    return 'overview';
}

// Current interpolated focus offset for smooth panel open/close animation
let currentAutoFocusPctX = 0;
let currentAutoFocusPctY = 0;
let currentFocusCalibZoom = 1.0;

// Idle Mode / Screensaver
let lastInteractionTime = Date.now();
const IDLE_TIMEOUT_MS = 30000; // 30 giây không có tay sẽ tự động reset


// Load saved hologram fine-tune from localStorage
// Key v3: Lưu state-based calibration riêng biệt
localStorage.removeItem('hologramCalibration');  // Xóa format cũ v1
localStorage.removeItem('hologramCalibration_v2');  // Xóa format cũ v2
const savedCalib = localStorage.getItem('hologramCalibration_v3');
if (savedCalib) {
    try {
        const parsed = JSON.parse(savedCalib);
        if (parsed.overview) hologramCalib.overview = parsed.overview;
        if (parsed.focusClosed) hologramCalib.focusClosed = parsed.focusClosed;
        if (parsed.focusOpen) hologramCalib.focusOpen = parsed.focusOpen;
        console.log(`📐 Loaded hologram states v3`, hologramCalib);
    } catch (e) {
        console.error("Failed to parse calibration", e);
        localStorage.removeItem('hologramCalibration_v3');
    }
}

// Fine-tune via Arrow Keys (Offset) and +/- (Zoom)
window.addEventListener('keydown', (e) => {
    const stateKey = getActiveStateKey();
    const state = hologramCalib[stateKey];

    // SAVE HOTKEY
    if (e.key === 's' || e.key === 'S') {
        localStorage.setItem('hologramCalibration_v3', JSON.stringify(hologramCalib));
        console.log("CALIBRATION SAVED!", hologramCalib);
        setGestureHUD(`ĐÃ LƯU VỊ TRÍ (${stateKey.toUpperCase()})`);
        return;
    }

    // RESET HOTKEY
    if (e.key === 'r' || e.key === 'R') {
        localStorage.removeItem('hologramCalibration_v3');
        hologramCalib = {
            overview: { offsetX: 0.0260, offsetY: -0.0463, zoom: 1.0 },
            focusClosed: { offsetX: 0, offsetY: 0, zoom: 1.0 },
            focusOpen: { offsetX: -0.0618, offsetY: 0, zoom: 1.0 }
        };
        console.log("CALIBRATION RESET!");
        setGestureHUD("ĐÃ RESET VỀ MẶC ĐỊNH!");
        return;
    }

    // Arrow keys: fine-tune offset (5px mỗi lần bấm)
    const stepX = 5 / window.innerWidth;
    const stepY = 5 / window.innerHeight;
    const stepZoom = 0.02;
    
    let changed = false;
    if (e.key === 'ArrowLeft')  { state.offsetX -= stepX; changed = true; }
    if (e.key === 'ArrowRight') { state.offsetX += stepX; changed = true; }
    if (e.key === 'ArrowUp')    { state.offsetY -= stepY; changed = true; }
    if (e.key === 'ArrowDown')  { state.offsetY += stepY; changed = true; }
    // Phím +/- (hoặc =/_) để zoom lớn/nhỏ
    if (e.key === '=' || e.key === '+') { state.zoom -= stepZoom; changed = true; } // Camera gần lại = hình to ra
    if (e.key === '-' || e.key === '_') { state.zoom += stepZoom; changed = true; } // Camera xa ra = hình nhỏ lại
    
    if (changed) {
        state.zoom = THREE.MathUtils.clamp(state.zoom, 0.3, 3.0);
        console.log(`[FINE-TUNE ${stateKey.toUpperCase()}] offsetX: ${(state.offsetX*100).toFixed(2)}% | offsetY: ${(state.offsetY*100).toFixed(2)}% | zoom: ${state.zoom.toFixed(2)}`);
    }
});

const focusSpinner = new THREE.Group();  // model goes here, this group rotates
focusSpinner.rotation.order = 'YXZ';
focusModelGroup.add(focusSpinner);

// Focus lighting — optimized for hologram projection (High Contrast for 3D depth)
const focusKey = new THREE.DirectionalLight(0xffffff, 3.5);
focusKey.position.set(5, 3, 5);

// Add a sharp PointLight near the front to create a bright specular "dot" on the sphere, making it look round
const focusSpecular = new THREE.PointLight(0xffffff, 1.5, 20);
focusSpecular.position.set(2, 2, 6);

const focusFill = new THREE.DirectionalLight(0x446699, 0.4); // Darker fill for deeper shadows
focusFill.position.set(-6, -2, -2);

// Strong Rim light from behind — creates a glowing edge to separate planet from black background
const focusRim = new THREE.DirectionalLight(0x55bbff, 2.5);
focusRim.position.set(-2, 3, -8);

// Low ambient — keep it almost black to maximize 3D contrast
const focusAmbient = new THREE.AmbientLight(0x111122, 0.2);

focusModelGroup.add(focusKey);
focusModelGroup.add(focusSpecular);
focusModelGroup.add(focusFill);
focusModelGroup.add(focusRim);
focusModelGroup.add(focusAmbient);

// Visual debug axes helper at (0,0,0) inside spinner
const focusAxesHelper = new THREE.AxesHelper(3.5);
focusAxesHelper.visible = true; // FORCE ON
focusSpinner.add(focusAxesHelper);

const centerDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false })
);
centerDot.visible = true;
focusSpinner.add(centerDot);

// Force overlay on load (handles both early and late script execution)
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('debug-overlay');
    if (overlay) overlay.style.display = 'block';
});
setTimeout(() => {
    const overlay = document.getElementById('debug-overlay');
    if (overlay) overlay.style.display = 'block';
}, 1000);

// Key listener for visual debug (keep just in case)
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'd') {
        const overlay = document.getElementById('debug-overlay');
        if (overlay) {
            const isVisible = overlay.style.display === 'block';
            overlay.style.display = isVisible ? 'none' : 'block';
            focusAxesHelper.visible = !isVisible;
            centerDot.visible = !isVisible;
            console.log(isVisible ? 'Visual Debug: OFF' : 'Visual Debug: ON');
        }
    }
});

// Cached loaded models (preloaded at startup)
const planetModelCache = new Array(9).fill(null);  // THREE.Group per planet
const planetModelScales = new Array(9).fill(1);    // auto-computed scale
let modelsPreloaded = false;

// Transition animation
let transitionProgress = 0;   // 0 = overview, 1 = focus
let transitionTarget = 0;
let focusAutoRotateSpeed = 0.15; // gentle auto-rotate in focus mode
let focusCamDist = 3;         // distance from center

// ============================================================
// 4. HUD
// ============================================================
function updateHUD() {
    const t = document.getElementById('hud-title');
    const s = document.getElementById('hud-subtitle');
    if (!t) return;
    if (!inPlanetFocus) {
        t.textContent = '🌌 Solar System';
        s.textContent = 'All planets orbiting';
    } else {
        const info = PLANET_INFO[focusIndex];
        t.textContent = `${info.emoji} ${info.nameVi}`;
        s.textContent = info.nameEn;
    }
}
function setGestureHUD(text) { const el = document.getElementById('hud-gesture'); if (el) el.textContent = text; }
function setProgressHUD(pct) {
    const bar = document.getElementById('hud-progress-fill');
    const wrap = document.getElementById('hud-progress');
    if (!bar || !wrap) return;
    wrap.style.opacity = pct > 0 ? '1' : '0';
    bar.style.width = `${Math.min(pct * 100, 100)}%`;
}
function setLoadingProgress(text) {
    const el = document.getElementById('loading-progress');
    if (el) el.textContent = text;
}

// ============================================================
// 5. PLANET INFO PANEL
// ============================================================
function updatePlanetInfoPanel(idx) {
    const info = PLANET_INFO[idx];
    if (!info) return;
    const panel = document.getElementById('planet-panel');
    panel.style.setProperty('--planet-color', info.color);
    document.getElementById('pp-emoji').textContent = info.emoji;
    document.getElementById('pp-name-vi').textContent = info.nameVi;
    document.getElementById('pp-name-en').textContent = info.nameEn;
    document.getElementById('pp-type').textContent = info.type;
    document.getElementById('pp-stats').innerHTML = info.stats.map(s =>
        `<div class="pp-stat"><div class="pp-stat-label">${s.label}</div><div class="pp-stat-value">${s.value}</div></div>`
    ).join('');
    document.getElementById('pp-description').textContent = info.desc;
}

let isInfoPanelVisible = false;
let currentPanelFrac = 0; // For smooth viewport shifting

// Setup UI event listener for info toggle button
const infoBtn = document.getElementById('info-toggle-btn');
if (infoBtn) {
    infoBtn.addEventListener('click', () => {
        isInfoPanelVisible = !isInfoPanelVisible;
        const panel = document.getElementById('planet-panel');
        if (isInfoPanelVisible) {
            panel.classList.add('active');
            infoBtn.classList.add('active');
            document.body.classList.add('panel-active');
        } else {
            panel.classList.remove('active');
            infoBtn.classList.remove('active');
            document.body.classList.remove('panel-active');
        }
        
        // Auto-snap back to calibration center when toggling the panel
        if (typeof focusPanTarget !== 'undefined') {
            focusPanTarget.set(0, 0, 0);
        }
    });
}

function showPlanetPanel(idx) {
    updatePlanetInfoPanel(idx);
    document.body.classList.add('in-focus');
    if (isInfoPanelVisible) {
        document.getElementById('planet-panel').classList.add('active');
        document.body.classList.add('panel-active');
    }
}

function hidePlanetPanel() {
    document.body.classList.remove('in-focus');
    document.body.classList.remove('panel-active');
    document.getElementById('planet-panel').classList.remove('active');
}

// Slide panel content out/in for planet switching
function slidePanelSwitch(newIdx) {
    const scroll = document.querySelector('#planet-panel .pp-scroll');
    if (!scroll) { updatePlanetInfoPanel(newIdx); return; }

    const isHolo = document.body.classList.contains('hologram-mode');
    const scaleStr = isHolo ? 'scaleX(-1)' : 'scaleX(1)';

    scroll.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
    scroll.style.transform = `translateX(-40px) ${scaleStr}`;
    scroll.style.opacity = '0';

    setTimeout(() => {
        updatePlanetInfoPanel(newIdx);
        scroll.style.transition = 'none';
        scroll.style.transform = `translateX(40px) ${scaleStr}`;
        scroll.style.opacity = '0';
        void scroll.offsetWidth;
        scroll.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease';
        scroll.style.transform = `translateX(0) ${scaleStr}`;
        scroll.style.opacity = '1';
        
        // Dọn dẹp inline transform sau khi kết thúc animation để nhường chỗ cho CSS quản lý Hologram mode
        setTimeout(() => {
            scroll.style.transform = '';
        }, 360);
    }, 230);
}

function getDepth(obj, root) {
    let d = 0;
    while (obj !== root && obj.parent) { d++; obj = obj.parent; }
    return d;
}

function autoFitCamera() {
    // Calculate bounding box of the entire solar system
    const box = new THREE.Box3().setFromObject(modelGroup);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Solar system is on the XZ plane, get max width
    const maxDim = Math.max(size.x, size.z);

    // Calculate camera distance to fit scene with current FOV
    const W = threeRenderer.domElement.width;
    const H = threeRenderer.domElement.height;
    const aspect = W / H;
    const fovRad = overviewCam.fov * (Math.PI / 180);
    // Adjust for aspect ratio
    const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
    const minFov = Math.min(fovRad, hFovRad);
    const fitDist = (maxDim / 2) / Math.tan(minFov / 2) * 1.15; // 1.15 = padding

    // 60 degree elevation angle
    const elevAngle = Math.PI / 3;
    
    // The Sun's actual geometric position in the GLTF file is (9, 10.5, 0)
    const sunPos = new THREE.Vector3(9, 10.5, 0);

    const camY = sunPos.y + fitDist * Math.sin(elevAngle);
    const camZ = sunPos.z + fitDist * Math.cos(elevAngle);
    const camX = sunPos.x; // Align camera X with Sun X

    // Update base target pos
    overviewBasePos.set(camX, camY, camZ);
    overviewLook.copy(sunPos); // Always look exactly at the Sun

    console.log(`🎥 Auto-fit: pos=(${camX.toFixed(1)}, ${camY.toFixed(1)}, ${camZ.toFixed(1)}) | scene maxDim=${maxDim.toFixed(1)} | fitDist=${fitDist.toFixed(1)}`);
}

// ============================================================
// 6. PRELOAD ALL PLANET MODELS
// ============================================================
function preloadPlanetModels() {
    const loader = new GLTFLoader();
    let loaded = 0;
    const total = PLANET_MODEL_FILES.length;

    PLANET_MODEL_FILES.forEach((file, idx) => {
        const modelPath = path.join(__dirname, '../models', file);
        loader.load(modelPath, (gltf) => {
            const root = gltf.scene;

            // Auto-center using bounding box
            const box = new THREE.Box3().setFromObject(root);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Auto-scale to fit a unit sphere of radius ~2
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 2.5;
            const scale = targetSize / maxDim;
            
            root.scale.setScalar(scale);
            // Center mathematically using -center * scale (since T is applied after S in matrix)
            root.position.copy(center).multiplyScalar(-scale);
            
            planetModelScales[idx] = scale;

            // Play animations if any
            if (gltf.animations?.length > 0) {
                const m = new THREE.AnimationMixer(root);
                gltf.animations.forEach(clip => {
                    const a = m.clipAction(clip);
                    a.setLoop(THREE.LoopRepeat, Infinity);
                    a.play();
                });
                root.userData.mixer = m;
            }

            planetModelCache[idx] = root;
            loaded++;
            setLoadingProgress(`Đã tải ${loaded}/${total} model hành tinh...`);
            console.log(`✅ Preloaded [${idx}] ${PLANET_NAMES[idx]} (${file}) — scale=${scale.toFixed(3)}`);

            if (loaded === total) {
                modelsPreloaded = true;
                console.log('🎉 All planet models preloaded!');
            }
        }, undefined, err => {
            console.error(`❌ Failed to load ${file}:`, err);
            loaded++;
            if (loaded === total) modelsPreloaded = true;
        });
    });
}

// ============================================================
// 7. FOCUS ENTER / EXIT / SWITCH
// ============================================================
function enterPlanetFocus(idx) {
    if (idx < 0 || idx >= 9 || !planetModelCache[idx]) return;

    const wasInFocus = inPlanetFocus;
    const wasSameIdx = focusIndex === idx;
    if (wasInFocus && wasSameIdx) return; // already viewing this planet

    // If switching planets while already in focus
    if (wasInFocus && !wasSameIdx) {
        switchPlanetModel(idx);
        slidePanelSwitch(idx);
        focusIndex = idx;
        updateHUD();
        return;
    }

    // Fresh entry from overview
    focusIndex = idx;
    inPlanetFocus = true;
    transitionTarget = 1;

    // Reset focus rotation and zoom
    focusModelGroup.position.set(0, 0, 0);
    focusSpinner.quaternion.identity();
    focusSpinner.rotation.set(0, 0, 0);
    focusZoomFactor = 1.0;
    targetFocusZoomFactor = 1.0;
    focusRotVelX = 0;
    focusRotVelY = 0;

    // Set camera position immediately
    const baseDist = 5.0;
    focusCamDist = baseDist * focusZoomFactor;
    focusCam.position.set(0, 0, focusCamDist);
    focusCam.lookAt(0, 0, 0);
    focusCam.clearViewOffset();  // Xóa sạch mọi offset cũ từ overview mode
    focusCam.updateProjectionMatrix();

    // Reset pan
    focusPanTarget.set(0, 0, 0);
    focusPanOffset.set(0, 0, 0);
    focusModelGroup.position.set(0, 0, 0);

    // Hide solar system sunLight to prevent illumination from inside model
    sunLight.visible = false;

    // Place model in focus spinner
    setFocusModel(idx);

    // Show panel
    showPlanetPanel(idx);
    updateHUD();

    // ── DEBUG: Focus mode entry ──
    const model = planetModelCache[idx];
    if (model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        console.log(`\n🔍 ══ FOCUS DEBUG [${PLANET_NAMES[idx]}] ══`);
        console.log(`  Model BBox center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
        console.log(`  Model BBox size:   (${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)})`);
        console.log(`  Model scale:       ${planetModelScales[idx].toFixed(4)}`);
        console.log(`  FocusGroup pos:    (${focusModelGroup.position.x}, ${focusModelGroup.position.y}, ${focusModelGroup.position.z})`);
        console.log(`  FocusCam pos:      (${focusCam.position.x.toFixed(2)}, ${focusCam.position.y.toFixed(2)}, ${focusCam.position.z.toFixed(2)})`);
        console.log(`  FocusCamDist:      ${focusCamDist.toFixed(2)}`);
        console.log(`  FocusZoom:         ${focusZoomFactor}`);
        console.log(`  calib (closed):    (${hologramCalib.focusClosed.offsetX.toFixed(4)}, ${hologramCalib.focusClosed.offsetY.toFixed(4)})`);
        console.log(`  autoFocusPct:      (${currentAutoFocusPctX.toFixed(4)}, ${currentAutoFocusPctY.toFixed(4)})`);
        const W = threeRenderer.domElement.width, H = threeRenderer.domElement.height;
        console.log(`  Canvas:            ${W} x ${H} (DPR=${window.devicePixelRatio})`);
        console.log(`══════════════════════════════════\n`);
    }
}

function exitPlanetFocus() {
    if (!inPlanetFocus) return;
    inPlanetFocus = false;
    transitionTarget = 0;
    focusIndex = -1;

    // Restore solar system sunLight
    sunLight.visible = true;

    hidePlanetPanel();
    updateHUD();

    // Clear model after transition (delayed)
    setTimeout(() => {
        if (!inPlanetFocus) {
            clearFocusModel();
        }
    }, 800);
}

function setFocusModel(idx) {
    clearFocusModel();
    const model = planetModelCache[idx];
    if (!model) return;
    focusSpinner.add(model);     // model goes in spinner, not directly in focusModelGroup
    focusModelGroup.visible = true;
}

function clearFocusModel() {
    // Remove all children from focusSpinner (models only)
    const toRemove = [];
    focusSpinner.children.forEach(c => toRemove.push(c));
    toRemove.forEach(c => focusSpinner.remove(c));
}

function switchPlanetModel(newIdx) {
    const oldModel = planetModelCache[focusIndex];
    const newModel = planetModelCache[newIdx];
    if (!newModel) return;

    // Swap model in focusSpinner
    if (oldModel && focusSpinner.children.includes(oldModel)) {
        focusSpinner.remove(oldModel);
    }
    focusSpinner.add(newModel);

    // Reset spinner rotation for fresh view
    focusSpinner.quaternion.identity();
    focusSpinner.rotation.set(0, 0, 0);
    focusZoomFactor = 1.0;
    focusRotVelX = 0;
    focusRotVelY = 0;
    focusPanTarget.set(0, 0, 0);
    focusPanOffset.set(0, 0, 0);
    focusModelGroup.position.set(0, 0, 0);
}

// ============================================================
// 8. GLB LOADING (Solar System)
// ============================================================
function loadSolarSystem() {
    const loader = new GLTFLoader();
    const modelPath = path.join(__dirname, '../models', 'solar_system.glb');

    loader.load(modelPath, (gltf) => {
        const root = gltf.scene;

        // Debug logs
        console.log('╔══ ANIMATION CLIPS ══╗');
        if (gltf.animations?.length > 0) {
            gltf.animations.forEach((clip, i) => {
                console.log(`║ Clip[${i}]: "${clip.name}" | ${clip.duration.toFixed(2)}s | ${clip.tracks.length} tracks`);
            });
        }
        console.log('╚══════════════════════╝');

        console.log('╔══ SCENE OBJECTS ══╗');
        root.traverse(obj => {
            const indent = '  '.repeat(getDepth(obj, root));
            const meshTag = obj.isMesh ? ' [MESH]' : '';
            if (obj.name) console.log(`║ ${indent}${obj.type}${meshTag}: "${obj.name}"`);
        });
        console.log('╚═══════════════════╝');

        // Pivot detection
        const animatedNames = new Map();
        if (gltf.animations?.length > 0) {
            gltf.animations[0].tracks.forEach(track => {
                const lastDot = track.name.lastIndexOf('.');
                const objName = track.name.substring(0, lastDot);
                const propName = track.name.substring(lastDot + 1);
                if (propName !== 'quaternion' && propName !== 'rotation') return;
                if (track.times.length < 2) return;
                let angVel = 0;
                if (propName === 'quaternion') {
                    const q0 = new THREE.Quaternion(track.values[0], track.values[1], track.values[2], track.values[3]);
                    const q1 = new THREE.Quaternion(track.values[4], track.values[5], track.values[6], track.values[7]);
                    const e0 = new THREE.Euler().setFromQuaternion(q0, 'YXZ');
                    const e1 = new THREE.Euler().setFromQuaternion(q1, 'YXZ');
                    const dt = track.times[1] - track.times[0];
                    if (dt > 1e-5) angVel = (e1.y - e0.y) / dt;
                }
                if (Math.abs(angVel) > 1e-4 && !animatedNames.has(objName))
                    animatedNames.set(objName, { angVel });
            });
        }

        const pivotMap = new Map();
        root.traverse(obj => {
            if (!animatedNames.has(obj.name)) return;
            const nl = obj.name.toLowerCase();
            if (nl.includes('beziercircle001')) return;
            if (nl.startsWith('moon')) return;

            let planetIdx = -1;
            for (const [prefix, idx] of Object.entries(NAME_TO_IDX)) {
                if (nl.startsWith(prefix)) { planetIdx = idx; break; }
            }
            if (planetIdx < 0) return;

            const { angVel } = animatedNames.get(obj.name);

            let planetGroup = null, planetMesh = null;
            let orbitRadius = 0, maxMeshR = 0;

            for (const child of obj.children) {
                const wp = new THREE.Vector3();
                child.getWorldPosition(wp);
                const xzD = Math.sqrt(wp.x * wp.x + wp.z * wp.z);
                if (xzD > orbitRadius) { orbitRadius = xzD; planetGroup = child; }
            }
            obj.traverse(child => {
                if (!child.isMesh) return;
                const box = new THREE.Box3().setFromObject(child);
                const size = new THREE.Vector3(); box.getSize(size);
                const minD = Math.min(size.x, size.y, size.z), maxD = Math.max(size.x, size.y, size.z);
                if (maxD > 0 && minD / maxD < 0.08) return;
                child.geometry.computeBoundingSphere();
                const r = child.geometry.boundingSphere?.radius || 0;
                if (r > maxMeshR) { maxMeshR = r; planetMesh = child; }
            });

            if (!pivotMap.has(planetIdx)) {
                pivotMap.set(planetIdx, {
                    name: PLANET_NAMES[planetIdx],
                    pivotObj: obj, planetGroup, planetMesh,
                    orbitRadius, angVel,
                    currentAngle: 0,
                    initQuat: obj.quaternion.clone(),
                });
            }
        });

        root.traverse(obj => {
            const nl = obj.name.toLowerCase();
            if (nl === 'moon_beziercircle_33') moonPivot = obj;
            if (nl === 'moon_beziercircle001_43') moonOrbitLine = obj;
            if (nl.includes('pluto')) obj.visible = false;
        });

        orbitalPivots = [];
        const maxIdx = Math.max(...pivotMap.keys(), 0);
        for (let i = 0; i <= maxIdx; i++) orbitalPivots.push(pivotMap.get(i) || null);
        while (orbitalPivots.length && !orbitalPivots[orbitalPivots.length - 1]) orbitalPivots.pop();

        console.log('========== PLANETS DETECTED ==========');
        for (let i = 0; i < orbitalPivots.length; i++) {
            const p = orbitalPivots[i];
            if (!p) continue;
            console.log(`[${i}] ${p.name.padEnd(8)} | R=${p.orbitRadius.toFixed(1)} | GLB angVel=${p.angVel.toFixed(5)}`);
        }
        console.log('======================================');

        modelGroup.add(root);

        if (gltf.animations?.length > 0) {
            mixer = new THREE.AnimationMixer(root);
            gltf.animations.forEach((clip, i) => {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.timeScale = 1.0;
                action.play();
            });
            mixer.update(0);
            for (let i = 0; i < orbitalPivots.length; i++) {
                if (orbitalPivots[i]) orbitalPivots[i].initQuat.copy(orbitalPivots[i].pivotObj.quaternion);
            }
        }

        autoFitCamera();

        solarSystemLoaded = true;
        window.__solarLoaded = true;
        updateHUD();

    }, undefined, err => console.error('GLB load error:', err));
}

// ============================================================
// 9. ORBIT UPDATE
// ============================================================
function updateOrbits(delta) {
    if (!solarSystemLoaded) return;
    for (let i = 0; i < orbitalPivots.length; i++) {
        const p = orbitalPivots[i];
        if (!p || p.angVel === 0) continue;
        p.currentAngle += p.angVel * delta;
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.currentAngle);
        p.pivotObj.quaternion.copy(p.initQuat).multiply(qY);
    }
}

// ============================================================
// 10. GESTURE SYSTEM
// ============================================================
function isThumbExtended(lm) {
    return Math.hypot(lm[4].x - lm[5].x, lm[4].y - lm[5].y)
        > Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) * 0.55;
}
function countFingersAll(lm) {
    let n = 0;
    if (isThumbExtended(lm)) n++;
    if (lm[8].y < lm[6].y) n++;
    if (lm[12].y < lm[10].y) n++;
    if (lm[16].y < lm[14].y) n++;
    if (lm[20].y < lm[18].y) n++;
    return n;
}
function isRightHand(handedness) {
    // In a raw front-facing webcam feed (unmirrored), a physical right hand looks structurally like a left hand.
    return handedness.label === 'Left';
}

// Stabilization buffer: require N consecutive identical readings before accepting a new finger count
// This prevents flickering between 3↔4 fingers etc.
const FINGER_STABLE_FRAMES = 3; // require 3 consecutive same readings
let stableFingerCount = -1;
let stableFingerCandidate = -1;
let stableFingerStreak = 0;

function getStableFingerCount(rawCount) {
    if (rawCount === stableFingerCandidate) {
        stableFingerStreak++;
        if (stableFingerStreak >= FINGER_STABLE_FRAMES) {
            stableFingerCount = rawCount;
        }
    } else {
        stableFingerCandidate = rawCount;
        stableFingerStreak = 1;
    }
    return stableFingerCount;
}

function fingersToPlanetIdx(fingers, isRight) {
    if (fingers <= 0) return -1;
    if (isRight) {
        return fingers - 1; // Right 1-5 → Sun(0)..Mars(4)
    } else {
        if (fingers > 4) return -1;
        return fingers + 4; // Left 1-4 → Jupiter(5)..Neptune(8)
    }
}

// Threshold for switching between "Rotating" and "Holding still to select"
const PALM_MOVE_THRESH = 0.008;
const HOLD_FRAMES = 22;
const FIST_RESET_FRAMES = 40;
const ROT_SENS_Y = 7;
const ROT_SENS_X = 4.5;

let prevPalmPos = null;
let lastPinchDist = null;
let prevPanPos = null;
let smoothedPanPos = null;
const panOffset = new THREE.Vector3();
const panTarget = new THREE.Vector3();
const focusPanOffset = new THREE.Vector3();
const focusPanTarget = new THREE.Vector3();
let fingerBuf = -1;
let fingerHoldN = 0;
let rotVelX = 0, rotVelY = 0;
let focusRotVelX = 0, focusRotVelY = 0;
let handRotating = false;

// ============================================================
// 11. MEDIAPIPE CALLBACK
// ============================================================
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks?.length > 0) {
        // Cập nhật thời gian tương tác (reset idle timer)
        lastInteractionTime = Date.now();
        const overlay = document.getElementById('idle-overlay');
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        }

        for (const lm of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, { color: '#00FF88', lineWidth: 2 });
            drawLandmarks(canvasCtx, lm, { color: '#FF4444', lineWidth: 1 });
        }
        if (!solarSystemLoaded) { canvasCtx.restore(); return; }

        let leftHandLm = null;
        let rightHandLm = null;
        results.multiHandLandmarks.forEach((lm, index) => {
            if (isRightHand(results.multiHandedness[index])) rightHandLm = lm;
            else leftHandLm = lm;
        });
        if (results.multiHandLandmarks.length === 2 && (!leftHandLm || !rightHandLm)) {
            // Fallback if MediaPipe hallucinates both hands as Left/Right
            leftHandLm = results.multiHandLandmarks[0];
            rightHandLm = results.multiHandLandmarks[1];
        }

        const isLeftFist = leftHandLm && countFingersAll(leftHandLm) === 0;

        // ══════════════════════════════════════════
        // MODE A: TWO HANDS — Left Fist modifier
        // ══════════════════════════════════════════
        if (leftHandLm && rightHandLm && isLeftFist) {
            fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0);

            const rightFingers = countFingersAll(rightHandLm);

            if (rightFingers === 0) {
                // PAN MODE: 2 Fists
                lastPinchDist = null;
                const pPosRaw = { x: rightHandLm[9].x, y: rightHandLm[9].y };

                if (!prevPanPos) {
                    prevPanPos = { ...pPosRaw };
                    smoothedPanPos = { ...pPosRaw };
                }

                // Smoothing on raw hand coordinates — higher factor = faster response, lower = smoother
                smoothedPanPos.x = THREE.MathUtils.lerp(smoothedPanPos.x, pPosRaw.x, 0.35);
                smoothedPanPos.y = THREE.MathUtils.lerp(smoothedPanPos.y, pPosRaw.y, 0.35);

                const dx = smoothedPanPos.x - prevPanPos.x;
                const dy = smoothedPanPos.y - prevPanPos.y;

                // Apply directly without deadzone for the absolute smoothest glide
                if (dx !== 0 || dy !== 0) {
                    if (inPlanetFocus) {
                        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(focusCam.quaternion).normalize();
                        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(focusCam.quaternion).normalize();
                        // panSpeed is relative to distance
                        const panSpeed = focusCamDist * 1.5;
                        // Invert dx and dy because we are moving the model directly, not the camera
                        focusPanTarget.add(camRight.multiplyScalar(-dx * panSpeed));
                        focusPanTarget.add(camUp.multiplyScalar(-dy * panSpeed));
                    } else {
                        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(overviewCam.quaternion).normalize();
                        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(overviewCam.quaternion).normalize();
                        // panSpeed is relative to base zoom, NOT current zoom, so panTarget becomes a normalized screen offset
                        const panSpeed = overviewBasePos.z * 2.2;
                        // Inverted dx to match hand physical direction
                        panTarget.add(camRight.multiplyScalar(dx * panSpeed));
                        panTarget.add(camUp.multiplyScalar(dy * panSpeed));
                    }
                } else {
                }

                prevPanPos = { ...smoothedPanPos };
                setGestureHUD('DI CHUYỂN (2 NẮM TAY)');
            } else if (rightFingers > 0) {
                // ZOOM MODE: Left Fist + Right Pinch
                prevPanPos = null;
                const tipIndex = rightHandLm[8];
                const tipThumb = rightHandLm[4];
                const pinchDist = Math.hypot(tipIndex.x - tipThumb.x, tipIndex.y - tipThumb.y);

                if (lastPinchDist !== null) {
                    const rawDelta = pinchDist - lastPinchDist;
                    // Lower deadzone threshold so zoom responds to tiny finger movements, reducing "stiffness"
                    const delta = Math.abs(rawDelta) > 0.001 ? rawDelta * 0.5 : 0;
                    if (inPlanetFocus) {
                        targetFocusZoomFactor = THREE.MathUtils.clamp(targetFocusZoomFactor * (1 - delta * 12), 0.3, 5.0);
                    } else {
                        targetOverviewZoomFactor = THREE.MathUtils.clamp(targetOverviewZoomFactor * (1 - delta * 15), 0.001, 100);
                    }
                } else {
                }
                lastPinchDist = pinchDist;
                if (inPlanetFocus) {
                    setGestureHUD(`ZOOM ${(targetFocusZoomFactor * 100).toFixed(0)}%`);
                } else {
                    setGestureHUD(`ZOOM x${(1 / targetOverviewZoomFactor).toFixed(1)}`);
                }
            } else {

                lastPinchDist = null; prevPanPos = null;
            }
        }
        // ══════════════════════════════════════════
        // MODE B: EXACTLY ONE HAND
        // ══════════════════════════════════════════
        else if (results.multiHandLandmarks.length === 1) {

            lastPinchDist = null; prevPanPos = null; smoothedPanPos = null;
            const lm = results.multiHandLandmarks[0];
            const pPos = { x: lm[9].x, y: lm[9].y };
            let velocity = prevPalmPos ? Math.hypot(pPos.x - prevPalmPos.x, pPos.y - prevPalmPos.y) : 0;
            const isRight = isRightHand(results.multiHandedness[0]);

            if (velocity > PALM_MOVE_THRESH) {
                // ROTATE - strictly Right Hand only
                fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0);
                if (isRight) {
                    if (prevPalmPos) {
                        const dx = pPos.x - prevPalmPos.x;
                        const dy = pPos.y - prevPalmPos.y;
                        if (inPlanetFocus) {
                            // Inverted dx so model rotates matching hand direction
                            focusRotVelY = -dx * ROT_SENS_Y * 30;
                            focusRotVelX = dy * ROT_SENS_X * 30;
                        } else {
                            rotVelY = -dx * ROT_SENS_Y * 30;
                            rotVelX = dy * ROT_SENS_X * 30;
                        }

                        handRotating = true;
                    }
                    setGestureHUD('ĐANG XOAY...');
                } else {

                    setGestureHUD(''); // Left hand moving, do nothing
                }
            } else {

                // STATIONARY — finger hold for planet selection or fist for reset
                const rawFingers = countFingersAll(lm);
                const fingers = getStableFingerCount(rawFingers);
                const isRight = isRightHand(results.multiHandedness[0]);

                if (fingers === 0) {
                    // FIST — reset/exit
                    if (fingerBuf === 0) {
                        fingerHoldN++;
                        const pct = fingerHoldN / FIST_RESET_FRAMES;
                        setProgressHUD(pct);
                        if (inPlanetFocus) {
                            setGestureHUD(`GIỮ ĐỂ QUAY VỀ... ${Math.round(pct * 100)}%`);
                            if (fingerHoldN >= FIST_RESET_FRAMES) {
                                exitPlanetFocus();
                                fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0);
                            }
                        } else {
                            setGestureHUD(`GIỮ ĐỂ RESET... ${Math.round(pct * 100)}%`);
                            if (fingerHoldN >= FIST_RESET_FRAMES) {
                                // Reset overview
                                rotVelX = 0; rotVelY = 0;
                                panOffset.set(0, 0, 0);
                                panTarget.set(0, 0, 0);
                                overviewZoomFactor = 1.0;
                                targetOverviewZoomFactor = 1.0;
                                modelGroup.quaternion.identity();
                                updateHUD();
                                fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0);
                            }
                        }
                    } else {
                        fingerBuf = 0; fingerHoldN = 0; setProgressHUD(0);
                        setGestureHUD(inPlanetFocus ? 'GIỮ NẮM TAY ĐỂ QUAY VỀ' : 'GIỮ NẮM TAY ĐỂ RESET');
                    }
                } else {
                    // FINGERS — select planet
                    const planetIdx = fingersToPlanetIdx(fingers, isRight);
                    if (planetIdx >= 0 && planetIdx < 9) {
                        const pName = PLANET_INFO[planetIdx].nameVi;
                        setGestureHUD(`TAY ${isRight ? 'PHẢI' : 'TRÁI'} - ${fingers} NGÓN (${pName})`);

                        if (fingers === fingerBuf) {
                            fingerHoldN++;
                            setProgressHUD(fingerHoldN / HOLD_FRAMES);
                            if (fingerHoldN === HOLD_FRAMES) {
                                if (modelsPreloaded) {
                                    enterPlanetFocus(planetIdx);
                                } else {
                                    setGestureHUD('ĐANG TẢI MODEL...');
                                }
                                fingerHoldN = HOLD_FRAMES + 1; // prevent re-trigger
                            }
                        } else {
                            fingerBuf = fingers; fingerHoldN = 0; setProgressHUD(0);
                        }
                    } else {
                        fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0);
                        setGestureHUD('SẴN SÀNG');
                    }
                }
            }
            prevPalmPos = { ...pPos };
        }
        // ══════════════════════════════════════════
        // IDLE: No hands or 2 hands not in Mode A
        // ══════════════════════════════════════════
        else {
            lastPinchDist = null; prevPanPos = null; smoothedPanPos = null;
            fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0);
            stableFingerCount = -1; stableFingerCandidate = -1; stableFingerStreak = 0;
            prevPalmPos = null;
            setGestureHUD('');
        }
    } else {
        prevPalmPos = null; lastPinchDist = null; prevPanPos = null; smoothedPanPos = null;
        fingerBuf = -1; fingerHoldN = 0; setProgressHUD(0); setGestureHUD('');
        stableFingerCount = -1; stableFingerCandidate = -1; stableFingerStreak = 0;
    }
    canvasCtx.restore();
}

// ============================================================
// 12. MEDIAPIPE SETUP
// ============================================================
const hands = new Hands({ locateFile: f => path.join(__dirname, '../node_modules/@mediapipe/hands', f) });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.75 });
hands.onResults(onResults);
let currentCameraStream = null;
let cameraLoopFrame = null;
let startupDeviceId = null; // deviceId của camera laptop (cái dùng lần đầu tiên)
let deviceChangeTimer = null; // Debounce cho devicechange

async function startSmartCamera() {
    try {
        // Hủy vòng lặp cũ NGAY LẬP TỨC
        if (cameraLoopFrame) { cancelAnimationFrame(cameraLoopFrame); cameraLoopFrame = null; }

        // TẮT ĐÈN CAMERA CŨ TẬN GỐC
        if (currentCameraStream) {
            currentCameraStream.getTracks().forEach(track => track.stop());
            currentCameraStream = null;
        }
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }

        // Đợi 1 nhịp để trình duyệt giải phóng camera cũ hoàn toàn
        await new Promise(r => setTimeout(r, 300));

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        // LOG TẤT CẢ CAMERA ĐỂ DEBUG
        console.log("📸 [SCAN] Tìm thấy", videoDevices.length, "camera:");
        videoDevices.forEach((d, i) => console.log(`   [${i}] id=${d.deviceId.substring(0,12)}... label="${d.label}"`));

        let selectedDeviceId = null;

        if (videoDevices.length === 0) {
            console.error("❌ Không tìm thấy camera nào!");
            return;
        }
        
        if (videoDevices.length > 1) {
            // CÓ NHIỀU CAMERA: Lấy cái KHÁC với camera laptop (cái đã dùng lúc khởi động)
            if (startupDeviceId) {
                const externalCam = videoDevices.find(d => d.deviceId !== startupDeviceId);
                if (externalCam) {
                    selectedDeviceId = externalCam.deviceId;
                    console.log("📸 [AUTO-CAMERA] Đã kết nối Camera Rời:", externalCam.label, "| id=" + externalCam.deviceId.substring(0,12));
                    setGestureHUD("📸 ĐÃ CHUYỂN SANG CAMERA RỜI!");
                } else {
                    // Fallback: Lấy cái cuối cùng
                    selectedDeviceId = videoDevices[videoDevices.length - 1].deviceId;
                }
            } else {
                // Lần đầu khởi động mà đã có 2 camera → lấy cái cuối
                selectedDeviceId = videoDevices[videoDevices.length - 1].deviceId;
                startupDeviceId = videoDevices[0].deviceId; // Ghi nhớ cái đầu tiên là laptop
                console.log("📸 [AUTO-CAMERA] Đã kết nối Camera Rời:", videoDevices[videoDevices.length - 1].label);
                setGestureHUD("📸 ĐÃ CHUYỂN SANG CAMERA RỜI!");
            }
        } else {
            // CHỈ CÓ 1 CAMERA: Đây chắc chắn là camera laptop
            selectedDeviceId = videoDevices[0].deviceId;
            if (!startupDeviceId) startupDeviceId = selectedDeviceId; // Ghi nhớ lần đầu
            console.log("📸 [AUTO-CAMERA] Dùng Camera Mặc Định:", videoDevices[0].label, "| id=" + videoDevices[0].deviceId.substring(0,12));
            setGestureHUD("📸 ĐANG DÙNG CAMERA LAPTOP");
        }

        // YÊU CẦU CHÍNH XÁC camera theo deviceId
        currentCameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, deviceId: { exact: selectedDeviceId } }
        });

        const actualLabel = currentCameraStream.getVideoTracks()[0].label;
        const actualId = currentCameraStream.getVideoTracks()[0].getSettings().deviceId;
        console.log("📸 [STREAM] Thực tế đang chạy:", actualLabel, "| id=" + (actualId || '').substring(0,12));

        videoElement.srcObject = currentCameraStream;
        await videoElement.play();

        let lastVideoTime = -1;
        const processFrame = async () => {
            if (videoElement.readyState >= 2 && videoElement.currentTime !== lastVideoTime) {
                lastVideoTime = videoElement.currentTime;
                await hands.send({ image: videoElement });
            }
            cameraLoopFrame = requestAnimationFrame(processFrame);
        };
        processFrame();

    } catch (err) {
        console.error("❌ Lỗi khởi tạo Camera:", err);
        setGestureHUD("❌ LỖI CAMERA!");
    }
}
startSmartCamera();

// TỰ ĐỘNG LẮNG NGHE KHI CÓ NGƯỜI CẮM/RÚT CAMERA (HOT-PLUG) — CÓ DEBOUNCE
navigator.mediaDevices.addEventListener('devicechange', () => {
    // Debounce: Windows bắn sự kiện này 2-3 lần liên tục khi cắm USB
    if (deviceChangeTimer) clearTimeout(deviceChangeTimer);
    deviceChangeTimer = setTimeout(() => {
        console.log("🔄 Phát hiện cắm/rút USB Camera! Đang quét lại...");
        setGestureHUD("🔄 ĐANG QUÉT CAMERA MỚI...");
        startSmartCamera();
    }, 2000); // Đợi 2 giây cho Windows nhận diện driver hoàn tất
});

// ============================================================
// 13. ANIMATION LOOP
// ============================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(delta);
    updateOrbits(delta);

    // Update planet model mixers (for models with built-in animations)
    if (inPlanetFocus && focusIndex >= 0) {
        const model = planetModelCache[focusIndex];
        if (model?.userData?.mixer) model.userData.mixer.update(delta);
    }

    // Moon tracking
    if (moonPivot && orbitalPivots[3]) {
        const earthP = orbitalPivots[3];
        const earthPos = new THREE.Vector3();
        if (earthP.planetGroup) {
            earthP.planetGroup.getWorldPosition(earthPos);
            const localPos = moonPivot.parent.worldToLocal(earthPos);
            moonPivot.position.copy(localPos);
            if (moonOrbitLine) moonOrbitLine.position.copy(localPos);
        }
    }

    // ── Transition animation ──
    transitionProgress = THREE.MathUtils.lerp(transitionProgress, transitionTarget, 0.08);
    if (Math.abs(transitionProgress - transitionTarget) < 0.003) transitionProgress = transitionTarget;

    // Show/hide based on transition
    const inFocusView = transitionProgress > 0.02;
    modelGroup.visible = transitionProgress < 0.98;
    focusModelGroup.visible = inFocusView;

    // ── OVERVIEW MODE ──
    const ROT_DAMP = 0.88;
    if (!handRotating) {
        rotVelX *= ROT_DAMP;
        rotVelY *= ROT_DAMP;
        focusRotVelX *= ROT_DAMP;
        focusRotVelY *= ROT_DAMP;
    }
    handRotating = false;

    // Pan smoothing (overview only) — single-stage lerp, fast convergence
    panOffset.lerp(panTarget, 0.18);

    // Overview camera rotation
    if (rotVelX !== 0 || rotVelY !== 0) {
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(overviewCam.quaternion).normalize();
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(overviewCam.quaternion).normalize();
        const qY = new THREE.Quaternion().setFromAxisAngle(camUp, rotVelY * delta);
        const qX = new THREE.Quaternion().setFromAxisAngle(camRight, rotVelX * delta);
        modelGroup.quaternion.premultiply(qX).premultiply(qY);
    }

    // ── IDLE MODE (SCREENSAVER) ──
    if (Date.now() - lastInteractionTime > IDLE_TIMEOUT_MS) {
        const overlay = document.getElementById('idle-overlay');
        if (overlay && !overlay.classList.contains('active')) {
            overlay.classList.add('active');
        }

        if (inPlanetFocus) {
            // Đang kẹt ở một hành tinh -> tự động thoát ra sảnh chính
            exitPlanetFocus();
        } else {
            // Đã ở sảnh chính -> tự động xoay hệ mặt trời vòng tròn cực mượt (Demo mode)
            // Tốc độ 0.1 rad/s (khoảng 1 phút 1 vòng)
            const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(overviewCam.quaternion).normalize();
            const idleQY = new THREE.Quaternion().setFromAxisAngle(camUp, 0.1 * delta);
            modelGroup.quaternion.premultiply(idleQY);
        }
    }

    // Smooth Zoom Lerping - reduced lerp factor for softer, less stiff feel
    overviewZoomFactor = THREE.MathUtils.lerp(overviewZoomFactor, targetOverviewZoomFactor, 0.08);
    focusZoomFactor = THREE.MathUtils.lerp(focusZoomFactor, targetFocusZoomFactor, 0.08);

    // Overview camera position
    const overviewTotalZoom = overviewZoomFactor * hologramCalib.overview.zoom;
    const currentOverviewPos = overviewLook.clone().lerp(overviewBasePos, overviewTotalZoom);
    // Multiply panOffset by zoomFactor to perfectly maintain perspective angle
    const currentPan = panOffset.clone().multiplyScalar(overviewTotalZoom);
    
    // Camera snaps directly to computed position (no extra lerp layer = less lag)
    overviewCam.position.copy(currentOverviewPos.clone().add(currentPan));
    overviewCam.lookAt(overviewLook.clone().add(currentPan));

    // ── FOCUS MODE ──
    if (inFocusView) {
        // Smooth Focus Panning
        focusPanOffset.lerp(focusPanTarget, 0.18);
        focusModelGroup.position.copy(focusPanOffset);

        // Auto-rotate the spinner (model only), lights stay fixed
        const autoRot = focusAutoRotateSpeed * delta;
        
        // Hand-gesture rotation also on spinner
        if (handRotating || Math.abs(focusRotVelX) > 0.005 || Math.abs(focusRotVelY) > 0.005) {
            // Hand is actively rotating (or has inertia), pause auto-rotation to prevent fighting/stuttering
            const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(focusCam.quaternion).normalize();
            const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(focusCam.quaternion).normalize();
            const qY = new THREE.Quaternion().setFromAxisAngle(camUp, focusRotVelY * delta);
            const qX = new THREE.Quaternion().setFromAxisAngle(camRight, focusRotVelX * delta);
            focusSpinner.quaternion.premultiply(qX).premultiply(qY);
        } else {
            // Auto rotate when idle
            focusSpinner.rotation.y += autoRot;
            
            // Apply any remaining micro-inertia
            const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(focusCam.quaternion).normalize();
            const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(focusCam.quaternion).normalize();
            const qY = new THREE.Quaternion().setFromAxisAngle(camUp, focusRotVelY * delta);
            const qX = new THREE.Quaternion().setFromAxisAngle(camRight, focusRotVelX * delta);
            focusSpinner.quaternion.premultiply(qX).premultiply(qY);
        }

        // Focus camera — zoom without shifting perspective
        const baseDist = 5.0;
        const targetFocusCalibZoom = isInfoPanelVisible ? hologramCalib.focusOpen.zoom : hologramCalib.focusClosed.zoom;
        currentFocusCalibZoom = THREE.MathUtils.lerp(currentFocusCalibZoom, targetFocusCalibZoom, 0.1);
        focusCamDist = baseDist * focusZoomFactor * currentFocusCalibZoom;
        focusCam.position.set(0, 0, focusCamDist);
        focusCam.lookAt(0, 0, 0);

        // Periodic debug log (every 3s)
        debugTimer += delta;
        if (debugTimer > 3) {
            debugTimer = 0;
            const worldPos = new THREE.Vector3();
            focusSpinner.getWorldPosition(worldPos);
            console.log(`[FOCUS] spinner world=(${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)}) | cam=(${focusCam.position.x.toFixed(2)},${focusCam.position.y.toFixed(2)},${focusCam.position.z.toFixed(2)}) | zoom=${focusZoomFactor.toFixed(2)}`);
        }
    }

    // ── Render ──
    renderFrame();
}

// ============================================================
// 14. RENDER
// ============================================================
function renderFrame() {
    // ── CRITICAL: Three.js setViewport/setScissor tự nhân input × DPR ──
    // → Phải truyền CSS pixels (container size), KHÔNG phải physical pixels (canvas size)
    // → setViewOffset/aspect dùng tỉ lệ nên dùng unit nào cũng được (dùng CSS cho nhất quán)
    const W = container.clientWidth;   // CSS pixels
    const H = container.clientHeight;  // CSS pixels



    // ── OVERVIEW: Manual offset only ──
    const overviewOffsetX = hologramCalib.overview.offsetX * W;
    const overviewOffsetY = hologramCalib.overview.offsetY * H;

    if (transitionProgress < 0.02) {
        // Pure overview
        overviewCam.aspect = W / H;
        overviewCam.setViewOffset(W, H, -overviewOffsetX, -overviewOffsetY, W, H);
        overviewCam.updateProjectionMatrix();
        scene.background = new THREE.Color(0x000000);
        threeRenderer.setScissorTest(false);
        threeRenderer.setViewport(0, 0, W, H);
        threeRenderer.render(scene, overviewCam);
        return;
    }

    // ── FOCUS: Auto-calculate offset based on Info Panel DOM width ──
    let targetFocusPctX = 0;
    let targetFocusPctY = 0;

    let targetCalibOffsetX = hologramCalib.focusClosed.offsetX;
    let targetCalibOffsetY = hologramCalib.focusClosed.offsetY;

    if (isInfoPanelVisible) {
        const panelEl = document.getElementById('planet-panel');
        if (panelEl) {
            const panelWidthPx = panelEl.offsetWidth; // CSS pixels
            targetFocusPctX = -(panelWidthPx / W) * 0.37;
        }
        targetCalibOffsetX = hologramCalib.focusOpen.offsetX;
        targetCalibOffsetY = hologramCalib.focusOpen.offsetY;
    }

    // Smooth interpolation for both opening/closing animation AND calibration states
    const targetTotalX = targetFocusPctX + targetCalibOffsetX;
    const targetTotalY = targetFocusPctY + targetCalibOffsetY;

    currentAutoFocusPctX = THREE.MathUtils.lerp(currentAutoFocusPctX, targetTotalX, 0.1);
    currentAutoFocusPctY = THREE.MathUtils.lerp(currentAutoFocusPctY, targetTotalY, 0.1);

    // Tổng hợp (đã được lerp mịn)
    const focusOffsetX = currentAutoFocusPctX * W;
    const focusOffsetY = currentAutoFocusPctY * H;

    if (transitionProgress > 0.98) {
        // Pure focus
        focusCam.aspect = W / H;
        focusCam.setViewOffset(W, H, -focusOffsetX, -focusOffsetY, W, H);
        focusCam.updateProjectionMatrix();

        scene.background = new THREE.Color(0x000000);
        threeRenderer.setScissorTest(false);
        threeRenderer.setViewport(0, 0, W, H);
        threeRenderer.clear();
        threeRenderer.render(scene, focusCam);
        return;
    }

    // Transitioning: Full-screen overview (background)
    overviewCam.aspect = W / H;
    overviewCam.setViewOffset(W, H, -overviewOffsetX, -overviewOffsetY, W, H);
    overviewCam.updateProjectionMatrix();
    scene.background = new THREE.Color(0x000000);
    threeRenderer.setScissorTest(false);
    threeRenderer.setViewport(0, 0, W, H);
    threeRenderer.render(scene, overviewCam);

    // Overlay planet view with a wipe effect
    if (transitionProgress > 0.05) {
        const wipeW = Math.round(W * transitionProgress);
        
        threeRenderer.setScissorTest(true);
        threeRenderer.setScissor(0, 0, wipeW, H);
        threeRenderer.setViewport(0, 0, W, H);
        
        focusCam.aspect = W / H;
        focusCam.setViewOffset(W, H, -focusOffsetX, -focusOffsetY, W, H);
        focusCam.updateProjectionMatrix();
        
        scene.background = new THREE.Color(0x000000);
        threeRenderer.render(scene, focusCam);

        threeRenderer.setScissorTest(false);
        scene.background = new THREE.Color(0x000000);
    }
}

// ============================================================
// 15. BOOTSTRAP
// ============================================================
loadSolarSystem();
preloadPlanetModels();
animate();

window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    threeRenderer.setSize(w, h);
    overviewCam.aspect = w / h;
    overviewCam.updateProjectionMatrix();
    focusCam.aspect = w / h;
    focusCam.updateProjectionMatrix();

    if (solarSystemLoaded) autoFitCamera();
});
