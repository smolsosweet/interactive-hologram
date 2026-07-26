import os
import re

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the old H hotkey
content = re.sub(r"    // H HOTKEY to toggle text inversion for presentation\n    if \(e\.key === 'h' \|\| e\.key === 'H'\) \{.*?return;\n    \}", "", content, flags=re.DOTALL)

# 2. Add executeHotkey and app-hotkey listener at the end of the file
hotkey_logic = '''
// Global Hotkey Sync
window.executeHotkey = function(key) {
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
    window.executeHotkey(key);
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('sync-action', { hotkey: key });
});
'''

if 'window.executeHotkey = function(key)' not in content:
    content += hotkey_logic

# 3. Add hotkey receiving logic to sync-action receiver
old_receiver = '''        if (typeof data.unflipText !== "undefined") {
            window.unflipText = data.unflipText;
            if (window.unflipText) {
                document.body.classList.add('unflip-text');
            } else {
                document.body.classList.remove('unflip-text');
            }
        }'''

new_receiver = old_receiver + '''
        if (data.hotkey) {
            window.executeHotkey(data.hotkey);
        }'''

if 'window.executeHotkey(data.hotkey);' not in content:
    content = content.replace(old_receiver, new_receiver)

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fix8")
