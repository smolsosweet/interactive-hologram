const fs = require('fs');

let content = fs.readFileSync('src/renderer.js', 'utf8');

const targetCheckFist = `function checkFist(lm) {
    if (!lm) return false;
    if (typeof window.predictMLGestureSync === 'function') {
        let pred = window.predictMLGestureSync(lm);
        if (pred !== "fallback") return pred === 0;
    }
    return countFingersAll(lm) === 0;
}`;

const replaceCheckFist = `function checkFist(lm) {
    if (!lm) return false;
    let hasStraightFinger = (lm[8].y < lm[6].y) || (lm[12].y < lm[10].y) || (lm[16].y < lm[14].y) || (lm[20].y < lm[18].y);

    if (typeof window.predictMLGestureSync === 'function') {
        let pred = window.predictMLGestureSync(lm);
        if (pred !== "fallback") {
            if (pred === 0) {
                if (hasStraightFinger) return false;
                return true;
            }
            return false;
        }
    }
    return countFingersAll(lm) === 0;
}`;

const targetCheckPinch = `function checkPinch(lm) {
    if (!lm) return false;
    if (typeof window.predictMLGestureSync === 'function') {
        let pred = window.predictMLGestureSync(lm);
        if (pred !== "fallback") return pred === 2;
    }
    return countFingersAll(lm) > 0; // Fallback cũ: Miễn không phải nắm tay thì coi là Zoom
}`;

const replaceCheckPinch = `function checkPinch(lm) {
    if (!lm) return false;
    let hasOtherStraightFingers = (lm[12].y < lm[10].y) || (lm[16].y < lm[14].y) || (lm[20].y < lm[18].y);

    if (typeof window.predictMLGestureSync === 'function') {
        let pred = window.predictMLGestureSync(lm);
        if (pred !== "fallback") {
            if (pred === 2) {
                if (hasOtherStraightFingers) return false;
                return true;
            }
            return false;
        }
    }
    return countFingersAll(lm) > 0; // Fallback cũ: Miễn không phải nắm tay thì coi là Zoom
}`;

content = content.replace(targetCheckFist, replaceCheckFist);
content = content.replace(targetCheckPinch, replaceCheckPinch);

fs.writeFileSync('src/renderer.js', content, 'utf8');
console.log('Fixed ML hijacking logic');
