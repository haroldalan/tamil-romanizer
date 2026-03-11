import { handleSpecialTokens } from '../../src/specialTokens.js';
import { resolveScheme } from '../../src/schemeResolver.js';
import { analyzeContext } from '../../src/contextAnalyzer.js';
import { decompose } from '../../src/decomposer.js';
import { tokenize } from '../../src/tokenizer.js';

const pipeline = (text: string, scheme: string) => {
    const resolved = resolveScheme(analyzeContext(decompose(tokenize(text))), scheme as any, null);
    return handleSpecialTokens(resolved, scheme);
};

describe('Layer 5: Special Token Handler', () => {

    // ── Āytham resolution ─────────────────────────────────────────────────────
    test('Āytham + ப → "f" in Practical (ஃபேன் → faen)', () => {
        expect(pipeline('ஃபேன்', 'practical')).toBe('faen');
    });

    test('Āytham + ஜ → "z" in Practical (ஃஜ → za)', () => {
        expect(pipeline('ஃஜ', 'practical')).toBe('za');
    });

    test('Standalone Āytham → empty string in Practical', () => {
        expect(pipeline('ஃ', 'practical')).toBe('');
    });

    test('Āytham → ḵ in ISO 15919 (எஃகு → eḵku)', () => {
        expect(pipeline('எஃகு', 'iso15919')).toBe('eḵku');
    });

    // ── Grantha conjunct — in-pipeline (NO regex in Layer 5 anymore) ──────────
    test('க்ஷ → ksh in Practical (via conjunct table, not regex)', () => {
        // பக்ஷி → pakshi
        expect(pipeline('பக்ஷி', 'practical')).toBe('pakshi');
    });

    test('ஸ்ரீரங்கம் → sreeranggam in Practical (algorithmic)', () => {
        // Algorithmic: ஸ்+ர conjunct → 'sr', ீ=ee → 'sree'. Then ர=r, ங்=ng coda, க POST_NASAL=g, ம்=m.
        // → 'sreeranggam'. Use exception entry for 'Srirangam' in production.
        expect(pipeline('ஸ்ரீரங்கம்', 'practical')).toBe('sreeranggam');
    });

    test('க்ஷ → kṣ in ISO 15919 (no cleanup applied)', () => {
        expect(pipeline('பக்ஷி', 'iso15919')).toBe('pakṣi');
    });

    test('ஸ்ரீரங்கம் → srīraṅkam in ISO 15919', () => {
        expect(pipeline('ஸ்ரீரங்கம்', 'iso15919')).toBe('srīraṅkam');
    });

    // ── ஸ்த conjunct (sthala) ─────────────────────────────────────────────────
    test('ஸ்தலம் → sthalam in Practical (ஸ்+த conjunct)', () => {
        expect(pipeline('ஸ்தலம்', 'practical')).toBe('sthalam');
    });

    test('ஸ்தலம் → stalam in ISO 15919', () => {
        expect(pipeline('ஸ்தலம்', 'iso15919')).toBe('stalam');
    });
});
