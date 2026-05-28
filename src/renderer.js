import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

const path = require('path');

// ============================================================
// 1. SCENE & RENDERER SETUP
// ============================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);

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
const overviewBasePos = new THREE.Vector3(0, 62.5, 42.5);
const overviewLook = new THREE.Vector3(9, 10.5, 0);

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

// Hologram physical center calibration offsets (in pixels)
let focusOffsetXClosed = -195;
let focusOffsetYClosed = 100;
let focusOffsetXOpen = -580;
let focusOffsetYOpen = 105;

// Current interpolated offsets for rendering
let currentFocusOffsetX = focusOffsetXClosed;
let currentFocusOffsetY = focusOffsetYClosed;

// Calibration via Arrow Keys (updates the active state)
window.addEventListener('keydown', (e) => {
    if (!inPlanetFocus) return;
    const step = 5; // 5 pixels per tap
    
    // Update the state that is currently active
    if (isInfoPanelVisible) {
        if (e.key === 'ArrowLeft') focusOffsetXOpen -= step;
        if (e.key === 'ArrowRight') focusOffsetXOpen += step;
        if (e.key === 'ArrowUp') focusOffsetYOpen -= step;
        if (e.key === 'ArrowDown') focusOffsetYOpen += step;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            console.log(`[CALIBRATION OPEN] offsetX: ${focusOffsetXOpen}px | offsetY: ${focusOffsetYOpen}px`);
        }
    } else {
        if (e.key === 'ArrowLeft') focusOffsetXClosed -= step;
        if (e.key === 'ArrowRight') focusOffsetXClosed += step;
        if (e.key === 'ArrowUp') focusOffsetYClosed -= step;
        if (e.key === 'ArrowDown') focusOffsetYClosed += step;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            console.log(`[CALIBRATION CLOSED] offsetX: ${focusOffsetXClosed}px | offsetY: ${focusOffsetYClosed}px`);
        }
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

// Focus features will be implemented here...

// ============================================================
// 8. GLB LOADING (Solar System)
// ============================================================
function getDepth(obj, root) {
    let depth = 0, cur = obj.parent;
    while (cur && cur !== root && depth < 20) { depth++; cur = cur.parent; }
    return depth;
}

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

// MediaPipe Gesture System will be implemented here...

// ============================================================
// 12. MEDIAPIPE SETUP
// ============================================================
const hands = new Hands({ locateFile: f => path.join(__dirname, '../node_modules/@mediapipe/hands', f) });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.75 });
hands.onResults(onResults);
new Camera(videoElement, { onFrame: async () => await hands.send({ image: videoElement }), width: 640, height: 480 }).start();

// ============================================================
// 13. ANIMATION LOOP
// ============================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(delta);
    // updateOrbits(delta); // Orbit logic will be added later

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

    // Zoom logic will be implemented here
    // Multiply panOffset by zoomFactor to perfectly maintain perspective angle
    const currentPan = panOffset.clone().multiplyScalar(overviewZoomFactor);
    
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
        focusCamDist = baseDist * focusZoomFactor;
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
    const W = threeRenderer.domElement.width;
    const H = threeRenderer.domElement.height;

    if (transitionProgress < 0.02) {
        // Pure overview
        overviewCam.aspect = W / H;
        overviewCam.updateProjectionMatrix();
        scene.background = new THREE.Color(0x000008);
        threeRenderer.setScissorTest(false);
        threeRenderer.setViewport(0, 0, W, H);
        threeRenderer.render(scene, overviewCam);
        return;
    }

    // Interpolate offsets smoothly
    const targetOffsetX = isInfoPanelVisible ? focusOffsetXOpen : focusOffsetXClosed;
    const targetOffsetY = isInfoPanelVisible ? focusOffsetYOpen : focusOffsetYClosed;
    currentFocusOffsetX = THREE.MathUtils.lerp(currentFocusOffsetX, targetOffsetX, 0.1);
    currentFocusOffsetY = THREE.MathUtils.lerp(currentFocusOffsetY, targetOffsetY, 0.1);

    if (transitionProgress > 0.98) {
        // Pure focus: always full screen, position based on interpolated offset
        focusCam.aspect = W / H;
        focusCam.setViewOffset(W, H, -currentFocusOffsetX, -currentFocusOffsetY, W, H);
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
    overviewCam.updateProjectionMatrix();
    scene.background = new THREE.Color(0x000008);
    threeRenderer.setScissorTest(false);
    threeRenderer.setViewport(0, 0, W, H);
    threeRenderer.render(scene, overviewCam);

    // Overlay planet view with a wipe effect from left to right based on transitionProgress
    if (transitionProgress > 0.05) {
        // Wipe width
        const wipeW = Math.round(W * transitionProgress);
        
        threeRenderer.setScissorTest(true);
        threeRenderer.setScissor(0, 0, wipeW, H);
        threeRenderer.setViewport(0, 0, W, H);
        
        focusCam.aspect = W / H;
        focusCam.setViewOffset(W, H, -currentFocusOffsetX, -currentFocusOffsetY, W, H);
        focusCam.updateProjectionMatrix();
        
        scene.background = new THREE.Color(0x000000);
        threeRenderer.render(scene, focusCam);

        threeRenderer.setScissorTest(false);
        scene.background = new THREE.Color(0x000008); // restore
    }
}

// ============================================================
// 15. BOOTSTRAP
// ============================================================
loadSolarSystem();
preloadPlanetModels();
animate();

window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    threeRenderer.setSize(w, h);
    overviewCam.aspect = w / h;
    overviewCam.updateProjectionMatrix();
});