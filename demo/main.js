import { romanize, debugRomanize } from 'tamil-romanizer';

// ── Context tag colour palette ────────────────────────────────────────────────
const TAG_COLORS = {
    WORD_INITIAL:          '#3b82f6',   // blue
    GEMINATE:              '#8b5cf6',   // purple
    POST_NASAL:            '#f59e0b',   // amber
    INTERVOCALIC:          '#10b981',   // emerald
    FRICATIVE_MUTATED:     '#ef4444',   // red
    GRANTHA_CONJUNCT_HEAD: '#ec4899',   // pink
    WORD_FINAL:            '#6b7280',   // grey
    DEFAULT:               '#d1d5db',   // light grey
    _text: {
        WORD_INITIAL:          '#fff',
        GEMINATE:              '#fff',
        POST_NASAL:            '#fff',
        INTERVOCALIC:          '#fff',
        FRICATIVE_MUTATED:     '#fff',
        GRANTHA_CONJUNCT_HEAD: '#fff',
        WORD_FINAL:            '#fff',
        DEFAULT:               '#374151',
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
}

function chip(top, bottom, color, textColor) {
    const c = el('div', 'dbg-chip');
    c.style.borderColor = color;
    const t = el('span', 'dbg-chip-top', escHtml(top));
    t.style.backgroundColor = color;
    t.style.color = textColor;
    const b = el('span', 'dbg-chip-bot', escHtml(bottom));
    c.append(t, b);
    return c;
}

function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function layerCard(num, title, description, contentEl) {
    const card = el('div', 'dbg-card');
    const header = el('div', 'dbg-card-header');
    const badge = el('span', 'dbg-layer-badge', `L${num}`);
    const titleEl = el('span', 'dbg-card-title', escHtml(title));
    const desc = el('span', 'dbg-card-desc', escHtml(description));
    header.append(badge, titleEl, desc);
    card.append(header, contentEl);
    return card;
}

function stringCard(num, title, description, text, highlight) {
    const wrap = el('div', 'dbg-string-wrap');
    const span = el('span', highlight ? 'dbg-string dbg-string--final' : 'dbg-string', escHtml(text));
    wrap.append(span);
    return layerCard(num, title, description, wrap);
}

function tokenRow(tokens, renderFn) {
    const row = el('div', 'dbg-chip-row');
    tokens.forEach(t => row.append(renderFn(t)));
    return row;
}

// ── Main debug renderer ───────────────────────────────────────────────────────
function renderDebug(word, options) {
    const container = document.getElementById('debug-content');
    container.innerHTML = '';

    const d = debugRomanize(word, options);

    // L0 — Sanitized
    container.append(stringCard(0, 'Sanitizer', 'ZWJ/ZWNJ strip · ஸ்ரீ canon · Tamil numerals · NFC', d.layer0_sanitized, false));

    // L1 — Tokens
    {
        const TYPE_COLORS = {
            vowel:                '#6366f1', consonant_virama: '#f59e0b',
            consonant_vowel_sign: '#10b981', consonant_bare:   '#3b82f6',
            aytham:               '#ec4899', whitespace:       '#d1d5db',
            numeral:              '#8b5cf6', punctuation:      '#9ca3af',
            other:                '#9ca3af',
        };
        const TYPE_TEXT = { whitespace: '#374151', punctuation: '#374151', other: '#374151' };
        const row = tokenRow(d.layer1_tokens, t => {
            const col = TYPE_COLORS[t.type] || '#9ca3af';
            const txc = TYPE_TEXT[t.type] || '#fff';
            return chip(t.text, t.type.replace('consonant_', 'c_'), col, txc);
        });
        container.append(layerCard(1, 'Tokenizer', 'Intl.Segmenter grapheme clusters + type classification', row));
    }

    // L2 — Decomposed
    {
        const row = tokenRow(d.layer2_decomposed, t => {
            const top = t.modifier ? `${t.base}+${t.modifier}` : t.base;
            const bot = t.modifierType;
            const col = t.modifierType === 'virama' ? '#f59e0b'
                      : t.modifierType === 'vowel_sign' ? '#10b981'
                      : t.modifierType === 'null' ? '#3b82f6'
                      : '#d1d5db';
            const txc = t.modifierType === 'none' ? '#374151' : '#fff';
            return chip(top, bot, col, txc);
        });
        container.append(layerCard(2, 'Decomposer', 'base / modifier / modifierType for each token', row));
    }

    // L3 — Context tags
    {
        const row = tokenRow(d.layer3_context, t => {
            const tag = t.contextTag;
            const color = TAG_COLORS[tag] || '#d1d5db';
            const txc = TAG_COLORS._text[tag] || '#374151';
            return chip(t.base, tag, color, txc);
        });
        container.append(layerCard(3, 'Context Analyzer', 'Phonological context tag per consonant token', row));
    }

    // L4 — Resolved
    {
        const row = tokenRow(d.layer4_resolved, t => {
            const roman = t.romanized || '∅';
            return chip(t.base, `"${roman}"`, '#1d4ed8', '#fff');
        });
        container.append(layerCard(4, 'Scheme Resolver', 'Allophone selection + Grantha conjunct consumption', row));
    }

    // L5 — Assembled
    container.append(stringCard(5, 'Assembly', 'Token concatenation + Āytham (ஃ) handling', d.layer5_assembled, false));

    // L6 — Exception + Final
    const finalWrap = el('div', 'dbg-final-wrap');
    const exBadge = el('span', d.exception_hit ? 'dbg-exc-badge dbg-exc-badge--hit' : 'dbg-exc-badge', d.exception_hit ? '⚡ Exception trie hit' : '○ No trie match');
    const finalStr = el('span', 'dbg-string dbg-string--final', escHtml(d.final));
    finalWrap.append(exBadge, finalStr);
    container.append(layerCard(6, 'Exception Trie', 'Prefix-forward lookup + suffix join', finalWrap));
}

// ── Main ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const inputEl      = document.getElementById('input-text');
    const outputEl     = document.getElementById('output-text');
    const schemeEl     = document.getElementById('scheme-select');
    const capitalizeEl = document.getElementById('capitalize-select');
    const exceptionsEl = document.getElementById('exceptions-check');
    const debugCheckEl = document.getElementById('debug-check');
    const debugPanel   = document.getElementById('debug-panel');
    const debugWordEl  = document.getElementById('debug-word-label');

    function getOptions() {
        return { scheme: schemeEl.value, capitalize: capitalizeEl.value, exceptions: exceptionsEl.checked };
    }

    function renderOutput() {
        const text = inputEl.value;
        if (!text.trim()) { outputEl.value = ''; return; }
        try {
            outputEl.value = romanize(text, getOptions());
            if (debugCheckEl.checked) updateDebug(text);
        } catch (err) {
            outputEl.value = `Error: ${err.message}`;
        }
    }

    function updateDebug(text) {
        const firstWord = text.trim().split(/\s+/)[0];
        debugWordEl.textContent = `"${firstWord}"`;
        renderDebug(firstWord, getOptions());
    }

    function toggleDebug() {
        debugPanel.style.display = debugCheckEl.checked ? 'block' : 'none';
        if (debugCheckEl.checked && inputEl.value.trim()) updateDebug(inputEl.value);
    }

    inputEl.addEventListener('input', renderOutput);
    schemeEl.addEventListener('change', renderOutput);
    capitalizeEl.addEventListener('change', renderOutput);
    exceptionsEl.addEventListener('change', renderOutput);
    debugCheckEl.addEventListener('change', toggleDebug);
});
