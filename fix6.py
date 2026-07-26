import os

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

if 'if (APP_MODE === "hologram") {' in lines[1786]:
    lines[1786] = ''
    if '}' in lines[1834]:
        lines[1834] = ''
        
with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Done fix6')
