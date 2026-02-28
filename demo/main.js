import { romanize } from 'tamil-romanizer';

document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('input-text');
    const outputEl = document.getElementById('output-text');
    const schemeEl = document.getElementById('scheme-select');
    const capitalizeEl = document.getElementById('capitalize-select');
    const exceptionsEl = document.getElementById('exceptions-check');

    function renderOutput() {
        const text = inputEl.value;
        if (!text.trim()) {
            outputEl.value = '';
            return;
        }

        try {
            const result = romanize(text, {
                scheme: schemeEl.value,
                capitalize: capitalizeEl.value,
                exceptions: exceptionsEl.checked
            });
            outputEl.value = result;
        } catch (err) {
            outputEl.value = `Error: ${err.message}`;
        }
    }

    // Event Listeners for real-time translation
    inputEl.addEventListener('input', renderOutput);
    schemeEl.addEventListener('change', renderOutput);
    capitalizeEl.addEventListener('change', renderOutput);
    exceptionsEl.addEventListener('change', renderOutput);
});
