const fs = require('fs');

let content = fs.readFileSync('src/renderer.js', 'utf8');

// 1. Top of file
content = content.replace(
    /const path = require\('path'\);\r?\nconst \{ ipcRenderer \} = require\('electron'\);/g,
    `let path = null;\nlet ipcRenderer = null;\nif (typeof require !== 'undefined') {\n    path = require('path');\n    ipcRenderer = require('electron').ipcRenderer;\n}`
);

// 2. Line 564: sync-action lang
content = content.replace(
    /const \{ ipcRenderer \} = require\('electron'\);\r?\n\s*ipcRenderer\.send\('sync-action', \{ lang: lang \}\);/g,
    `if (ipcRenderer) {\n            ipcRenderer.send('sync-action', { lang: lang });\n        }`
);

// 3. Line 1712: sync-action state
content = content.replace(
    /ipcRenderer\.send\("sync-action", \{/g,
    `if (ipcRenderer) ipcRenderer.send("sync-action", {`
);

// 4. Line 1850: ipcRenderer.on
content = content.replace(
    /ipcRenderer\.on\("sync-action",/g,
    `if (ipcRenderer) ipcRenderer.on("sync-action",`
);

// 5. Line 1927: sync-action hotkey
content = content.replace(
    /const \{ ipcRenderer \} = require\('electron'\);\r?\n\s*ipcRenderer\.send\('sync-action', \{ hotkey: key \}\);/g,
    `if (ipcRenderer) ipcRenderer.send('sync-action', { hotkey: key });`
);

fs.writeFileSync('src/renderer.js', content, 'utf8');
console.log('Fixed renderer.js');
