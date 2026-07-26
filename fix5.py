import os

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''if (APP_MODE === "hologram") {
    ipcRenderer.on("sync-action", (e, data) => {'''

new_block = '''if (APP_MODE === "hologram") {
    // Hologram specific logic if needed
}

ipcRenderer.on("sync-action", (e, data) => {'''

content = content.replace(old_block, new_block)

# Since we moved it out, we must make sure we close the `ipcRenderer.on` block correctly. 
# But wait, the closing brace is at the end of the file. So moving the opening brace out of the `if` is fine, 
# but the `if` block was wrapping the whole `ipcRenderer.on` block. 
# Wait, let's look at the end of renderer.js.
