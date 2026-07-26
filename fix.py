import os

with open('src/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

css_to_remove = '''        /* ---- Exit button ---- */
        #exit-app-btn {
            position: absolute;
            top: 24px; left: 24px;
            width: 48px; height: 48px;
            background: rgba(255,0,50,0.1);
            border: 1px solid rgba(255,0,50,0.3);
            border-radius: 50%;
            color: rgba(255,100,100,0.8);
            font-size: 1.2rem; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 100;
            transition: all 0.3s;
            backdrop-filter: blur(5px);
        }
        #exit-app-btn:hover {
            background: rgba(255,0,50,0.3);
            color: white;
            box-shadow: 0 0 15px rgba(255,0,50,0.5);
            transform: scale(1.1);
        }'''

content = content.replace(css_to_remove, '')
content = content.replace(',\n        body.hologram-mode.unflip-text #exit-app-btn', '')
content = content.replace(',\n        body.hologram-mode #exit-app-btn', '')
content = content.replace('<button id="exit-app-btn" title="Thoát ứng dụng (Phím ESC)">✕</button>', '')
content = content.replace("document.getElementById('exit-app-btn').addEventListener('click', closeApp);", '')

with open('src/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    rcontent = f.read()

rcontent = rcontent.replace('await videoElement.play();', '''try {
            await videoElement.play();
        } catch (playErr) {
            console.warn('Ignored interrupted play():', playErr.message);
        }''')

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(rcontent)
print('Done!')
