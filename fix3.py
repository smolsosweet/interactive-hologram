import os

with open('src/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div class="idle-text">Đưa tay lên để bắt đầu khám phá</div>', '<div class="idle-text" id="idle-text">Đưa tay lên để bắt đầu khám phá</div>')
content = content.replace('<div class="pp-desc-label">📖 Giới thiệu</div>', '<div class="pp-desc-label" id="pp-desc-label">📖 Giới thiệu</div>')
content = content.replace('<span class="pp-footer-text">Nắm tay (giữ ~1.5s) để quay về hệ mặt trời</span>', '<span class="pp-footer-text" id="pp-footer-text">Nắm tay (giữ ~1.5s) để quay về hệ mặt trời</span>')

with open('src/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    rcontent = f.read()

# Update setAppLang
old_setAppLang = '''window.setAppLang = function(lang) {
    window.currentAppLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.lang-btn[onclick="setAppLang('${lang}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (APP_MODE === 'control') {'''

new_setAppLang = '''window.setAppLang = function(lang) {
    window.currentAppLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.lang-btn[onclick="setAppLang('${lang}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const idleText = document.getElementById('idle-text');
    if (idleText) {
        if (lang === 'vi') idleText.textContent = 'Đưa tay lên để bắt đầu khám phá';
        else if (lang === 'en') idleText.textContent = 'Raise your hand to start exploring';
        else if (lang === 'zh') idleText.textContent = '举手开始探索';
    }
    
    if (APP_MODE === 'control') {'''

rcontent = rcontent.replace(old_setAppLang, new_setAppLang)

# Update updatePlanetInfoPanel
old_updatePanel = '''    document.getElementById('pp-description').textContent = langData.desc;
}'''

new_updatePanel = '''    document.getElementById('pp-description').textContent = langData.desc;
    
    const descLabel = document.getElementById('pp-desc-label');
    const footerText = document.getElementById('pp-footer-text');
    if (window.currentAppLang === 'vi') {
        if(descLabel) descLabel.textContent = '📖 Giới thiệu';
        if(footerText) footerText.textContent = 'Nắm tay (giữ ~1.5s) để quay về hệ mặt trời';
    } else if (window.currentAppLang === 'en') {
        if(descLabel) descLabel.textContent = '📖 Overview';
        if(footerText) footerText.textContent = 'Clench fist (~1.5s) to return to solar system';
    } else if (window.currentAppLang === 'zh') {
        if(descLabel) descLabel.textContent = '📖 简介';
        if(footerText) footerText.textContent = '握拳（约1.5秒）返回太阳系';
    }
}'''

rcontent = rcontent.replace(old_updatePanel, new_updatePanel)

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(rcontent)
print("Done translating static labels")
