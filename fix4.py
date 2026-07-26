import os
import re

with open('src/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update hotkeys in index.html to dispatch an event
hotkey_old = '''    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        if (key === 'escape') {
            closeApp();
        } 
        else if (key === 't') {
            // T: Bật/tắt Tab thông tin CHỈ khi đang ở trong chế độ Focus (có class in-focus)
            if (document.body.classList.contains('in-focus')) {
                const infoBtn = document.getElementById('info-toggle-btn');
                if (infoBtn) infoBtn.click();
            }
        } 
        else if (key === 'c') {
            // C: Bật/tắt Camera
            camBtn.click();
        } 
        else if (key === 'h') {
        }
    });'''

hotkey_new = '''    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'escape') {
            closeApp();
        } else if (['t', 'c', 'h'].includes(key)) {
            window.dispatchEvent(new CustomEvent('app-hotkey', {detail: key}));
        }
    });'''

content = content.replace(hotkey_old, hotkey_new)

with open('src/index.html', 'w', encoding='utf-8') as f:
    f.write(content)


# 2. Update renderer.js for setGestureHUD translation and app-hotkey logic
with open('src/renderer.js', 'r', encoding='utf-8') as f:
    rcontent = f.read()

# Add translation dictionary and logic for setGestureHUD
hud_logic = '''const HUD_TRANSLATIONS = {
    'en': {
        'ĐÃ LƯU VỊ TRÍ': 'POSITION SAVED',
        'ĐÃ RESET VỀ MẶC ĐỊNH!': 'RESET TO DEFAULT!',
        'DI CHUYỂN (2 NẮM TAY)': 'MOVE (2 FISTS)',
        'ĐANG XOAY...': 'ROTATING...',
        'GIỮ ĐỂ QUAY VỀ...': 'HOLD TO RETURN...',
        'GIỮ ĐỂ RESET...': 'HOLD TO RESET...',
        'GIỮ NẮM TAY ĐỂ QUAY VỀ': 'HOLD FIST TO RETURN',
        'GIỮ NẮM TAY ĐỂ RESET': 'HOLD FIST TO RESET',
        'TAY PHẢI': 'RIGHT HAND',
        'TAY TRÁI': 'LEFT HAND',
        'NGÓN': 'FINGERS',
        'ĐANG TẢI MODEL...': 'LOADING MODEL...',
        'SẴN SÀNG': 'READY',
        'CAMERA:': 'CAMERA:',
        'ĐÃ CHUYỂN SANG CAMERA RỜI!': 'SWITCHED TO EXTERNAL CAMERA!',
        'ĐANG DÙNG CAMERA LAPTOP': 'USING LAPTOP CAMERA',
        'LỖI:': 'ERROR:',
        'ĐANG QUÉT CAMERA MỚI...': 'SCANNING FOR NEW CAMERA...'
    },
    'zh': {
        'ĐÃ LƯU VỊ TRÍ': '已保存位置',
        'ĐÃ RESET VỀ MẶC ĐỊNH!': '已重置为默认！',
        'DI CHUYỂN (2 NẮM TAY)': '移动（双拳）',
        'ĐANG XOAY...': '旋转中...',
        'GIỮ ĐỂ QUAY VỀ...': '长按返回...',
        'GIỮ ĐỂ RESET...': '长按重置...',
        'GIỮ NẮM TAY ĐỂ QUAY VỀ': '保持握拳返回',
        'GIỮ NẮM TAY ĐỂ RESET': '保持握拳重置',
        'TAY PHẢI': '右手',
        'TAY TRÁI': '左手',
        'NGÓN': '指',
        'ĐANG TẢI MODEL...': '正在加载模型...',
        'SẴN SÀNG': '准备就绪',
        'CAMERA:': '相机:',
        'ĐÃ CHUYỂN SANG CAMERA RỜI!': '已切换到外接相机！',
        'ĐANG DÙNG CAMERA LAPTOP': '正在使用笔记本电脑相机',
        'LỖI:': '错误:',
        'ĐANG QUÉT CAMERA MỚI...': '正在扫描新相机...'
    }
};

function translateHUD(text) {
    if (!text || text === 'undefined') return '';
    let t = text;
    if (window.currentAppLang && window.currentAppLang !== 'vi') {
        const lang = window.currentAppLang;
        const dict = HUD_TRANSLATIONS[lang];
        if (dict) {
            if (typeof PLANET_INFO !== 'undefined') {
                for (let info of PLANET_INFO) {
                    if (t.includes(info.vi.name)) {
                        t = t.replace(info.vi.name, info[lang].name);
                    }
                }
            }
            for (let [viStr, transStr] of Object.entries(dict)) {
                t = t.replace(viStr, transStr);
            }
        }
    }
    return t;
}

function setGestureHUD(text) {
    if (text === 'undefined') return;
    const el = document.getElementById('hud-gesture');
    if (el) el.textContent = translateHUD(text);
}'''

rcontent = rcontent.replace("function setGestureHUD(text) { const el = document.getElementById('hud-gesture'); if (el) el.textContent = text; }", hud_logic)

# Fix pName issue when name is in vi
rcontent = rcontent.replace("const pName = PLANET_INFO[targetIndex]?.name;", "const pName = PLANET_INFO[targetIndex]?.vi?.name;")


# Add app-hotkey event listener
hotkey_listener = '''
// Global Hotkey Sync
function executeHotkey(key) {
    if (key === 't') {
        const infoBtn = document.getElementById('info-toggle-btn');
        if (infoBtn) infoBtn.click();
    } else if (key === 'c') {
        const camBtn = document.getElementById('cam-toggle-btn');
        if (camBtn) camBtn.click();
    } else if (key === 'h') {
        window.unflipText = !window.unflipText;
        if (window.unflipText) {
            document.body.classList.add('unflip-text');
        } else {
            document.body.classList.remove('unflip-text');
        }
    }
}

window.addEventListener('app-hotkey', (e) => {
    const key = e.detail;
    executeHotkey(key);
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('sync-action', { hotkey: key });
});
'''

# Remove old 'H' hotkey in renderer.js
old_h_listener = '''window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') {
        window.unflipText = !window.unflipText;
        if (window.unflipText) {
            document.body.classList.add('unflip-text');
        } else {
            document.body.classList.remove('unflip-text');
        }
        if (APP_MODE === 'control') {
            ipcRenderer.send('sync-action', { unflipText: window.unflipText });
        }
    }
});'''
rcontent = rcontent.replace(old_h_listener, hotkey_listener)

# Add to sync-action receiver
old_sync_receiver = '''        if (typeof data.unflipText !== "undefined") {
            window.unflipText = data.unflipText;
            if (window.unflipText) {
                document.body.classList.add('unflip-text');
            } else {
                document.body.classList.remove('unflip-text');
            }
        }'''
new_sync_receiver = old_sync_receiver + '''
        if (data.hotkey) {
            executeHotkey(data.hotkey);
        }'''
rcontent = rcontent.replace(old_sync_receiver, new_sync_receiver)

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(rcontent)

print("Done fix4")
