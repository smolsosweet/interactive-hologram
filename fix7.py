import os
import re

with open('src/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_keydown = '''    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'escape') {
            closeApp();
        } else if (['t', 'c', 'h'].includes(key)) {
            window.dispatchEvent(new CustomEvent('app-hotkey', {detail: key}));
        }
    });
</script>'''

content = re.sub(r"window\.addEventListener\('keydown', \(e\) => \{.*?</script>", new_keydown, content, flags=re.DOTALL)

with open('src/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fix7")
