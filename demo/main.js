import { romanize, debugRomanize } from 'tamil-romanizer';

document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('input-text');
    const outputEl = document.getElementById('output-text');
    const schemeEl = document.getElementById('scheme-select');
    const capitalizeEl = document.getElementById('capitalize-select');
    const exceptionsEl = document.getElementById('exceptions-check');
    const debugCheckEl = document.getElementById('debug-check');
    const debugPanel = document.getElementById('debug-panel');
    const debugOutput = document.getElementById('debug-output');

    function renderOutput() {
        const text = inputEl.value;
        if (!text.trim()) {
            outputEl.value = '';
            debugOutput.textContent = '';
            return;
        }

        const options = {
            scheme: schemeEl.value,
            capitalize: capitalizeEl.value,
            exceptions: exceptionsEl.checked,
        };

        try {
            outputEl.value = romanize(text, options);

            if (debugCheckEl.checked) {
                // Debug the first non-empty line only (single-word focus)
                const firstWord = text.trim().split(/\s+/)[0];
                const d = debugRomanize(firstWord, options);
                debugOutput.textContent = [
                    `Input (first word): ${firstWord}`,
                    `Layer 0 — sanitized:   ${d.layer0_sanitized}`,
                    `Layer 1 — tokens:      ${d.layer1_tokens.map(t => `[${t.text}:${t.type}]`).join(' ')}`,
                    `Layer 2 — decomposed:  ${d.layer2_decomposed.map(t => `[${t.base}|${t.modifier || '∅'}|${t.modifierType}]`).join(' ')}`,
                    `Layer 3 — context:     ${d.layer3_context.map(t => `[${t.base}→${t.contextTag}]`).join(' ')}`,
                    `Layer 4 — resolved:    ${d.layer4_resolved.map(t => `[${t.base}→"${t.romanized}"]`).join(' ')}`,
                    `Layer 5 — assembled:   ${d.layer5_assembled}`,
                    `Exception hit:         ${d.exception_hit}`,
                    `Final:                 ${d.final}`,
                ].join('\n');
            }
        } catch (err) {
            outputEl.value = `Error: ${err.message}`;
        }
    }

    function toggleDebug() {
        debugPanel.style.display = debugCheckEl.checked ? 'block' : 'none';
        renderOutput();
    }

    inputEl.addEventListener('input', renderOutput);
    schemeEl.addEventListener('change', renderOutput);
    capitalizeEl.addEventListener('change', renderOutput);
    exceptionsEl.addEventListener('change', renderOutput);
    debugCheckEl.addEventListener('change', toggleDebug);
});
