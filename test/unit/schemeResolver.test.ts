import { resolveScheme } from '../../src/schemeResolver.js';
import { analyzeContext } from '../../src/contextAnalyzer.js';
import { decompose } from '../../src/decomposer.js';
import { tokenize } from '../../src/tokenizer.js';
import { handleSpecialTokens } from '../../src/specialTokens.js';

// Full Layer 1–5 pipeline helper
const pipeline = (text: string, scheme: string, exceptions = false) => {
    const tokens = tokenize(text);
    const decomp = decompose(tokens);
    const ctx = analyzeContext(decomp);
    const resolved = resolveScheme(ctx, scheme as any, null);
    return handleSpecialTokens(resolved, scheme);
};

describe('Layer 4: Scheme Resolver', () => {

    // ── ISO 15919 ──────────────────────────────────────────────────────────────
    describe('ISO 15919', () => {
        test('all 12 vowels map correctly', () => {
            expect(pipeline('அஆஇஈஉஊஎஏஐஒஓஔ', 'iso15919'))
                .toBe('aāiīuūeēaioōau');
        });

        test('சட்டம் → caṭṭam (no allophony)', () => {
            expect(pipeline('சட்டம்', 'iso15919')).toBe('caṭṭam');
        });

        test('படம் → paṭam', () => {
            expect(pipeline('படம்', 'iso15919')).toBe('paṭam');
        });

        test('அறம் → aṟam', () => {
            expect(pipeline('அறம்', 'iso15919')).toBe('aṟam');
        });

        test('Grantha conjunct க்ஷ → kṣ + tail vowel (ISO)', () => {
            expect(pipeline('பக்ஷி', 'iso15919')).toBe('pakṣi');
        });

        test('ஸ்ரீரங்கம் → srīraṅkam (ISO)', () => {
            expect(pipeline('ஸ்ரீரங்கம்', 'iso15919')).toBe('srīraṅkam');
        });
    });

    // ── Practical / Standard ──────────────────────────────────────────────────
    describe('Practical/Standard', () => {
        test('சட்டம் → sattam (s=WORD_INITIAL, tt=GEMINATE ட)', () => {
            // ச WORD_INITIAL → 's' (Tanglish practical convention). ட்ட GEMINATE → 'tt'.
            // 'chattam' is available via custom table: { 'ச': 'ch' } — see romanizer.test.ts.
            expect(pipeline('சட்டம்', 'practical')).toBe('sattam');
        });

        test('படம் → padam (intervocalic ட → d)', () => {
            expect(pipeline('படம்', 'practical')).toBe('padam');
        });

        test('அறம் → aram (intervocalic ற → r)', () => {
            expect(pipeline('அறம்', 'practical')).toBe('aram');
        });

        test('நன்றி → nanri (post-nasal ற → r, Tanglish convention)', () => {
            expect(pipeline('நன்றி', 'practical')).toBe('nanri');
        });

        test('பஞ்சம் → panjam (ஞ் coda=n, ச POST_NASAL=j)', () => {
            // ஞ் in virama/coda position → 'n' (WORD_FINAL coda form, not onset 'nj').
            // ச after ஞ் nasal → POST_NASAL → 'j'. Combined: pa+n+j+am = 'panjam'.
            expect(pipeline('பஞ்சம்', 'practical')).toBe('panjam');
        });

        test('அதனால் → adhanal (த INTERVOCALIC→dh; ஆ non-WORD_INITIAL sign→a)', () => {
            expect(pipeline('அதனால்', 'practical')).toBe('adhanal');
        });

        test('பம்பரம் → pambaram (initial p, post-nasal b)', () => {
            expect(pipeline('பம்பரம்', 'practical')).toBe('pambaram');
        });

        test('Grantha க்ஷ → ksh (practical)', () => {
            expect(pipeline('பக்ஷி', 'practical')).toBe('pakshi');
        });

        test('ஸ்ரீரங்கம் → sreerangam (practical, algorithmic ஸ்ரீ=sree, ங்=n coda, க POST_NASAL=g)', () => {
            // Algorithmic: ஸ்+ர conjunct → 'sr', ீ=ee → 'sree'. Then ர=r, ங் DEFAULT(virama)='n';
            // க POST_NASAL='g', ம்='m'. → sree+r+an+g+am = 'sreerangam'.
            expect(pipeline('ஸ்ரீரங்கம்', 'practical')).toBe('sreerangam');
        });

        test('Other / numeral / English passes through', () => {
            expect(pipeline('100% pure', 'practical')).toBe('100% pure');
        });
    });

    // ── Practical / Phonetic ──────────────────────────────────────────────────
    describe('Practical/Phonetic', () => {
        test('வண்டு → vanndu (ட POST_NASAL → nd)', () => {
            expect(pipeline('வண்டு', 'practical/phonetic')).toBe('vanndu');
        });

        test('வண்டு → vandu in standard (ட POST_NASAL → d)', () => {
            expect(pipeline('வண்டு', 'practical/standard')).toBe('vandu');
        });

        test('அதனால் → adhanal (த INTERVOCALIC → dh; ஆ non-WORD_INITIAL → a)', () => {
            expect(pipeline('அதனால்', 'practical/phonetic')).toBe('adhanal');
        });
    });

    // ── ITRANS ─────────────────────────────────────────────────────────────────
    describe('ITRANS', () => {
        test('ஆ → aa, ஈ → ii, ஊ → uu', () => {
            expect(pipeline('ஆ', 'itrans')).toBe('aa');
            expect(pipeline('ஈ', 'itrans')).toBe('ii');
            expect(pipeline('ஊ', 'itrans')).toBe('uu');
        });

        test('ஏ → E (uppercase long e)', () => {
            expect(pipeline('ஏ', 'itrans')).toBe('E');
        });

        test('ஓ → O (uppercase long o)', () => {
            expect(pipeline('ஓ', 'itrans')).toBe('O');
        });

        test('ழ → zh', () => {
            expect(pipeline('ழ', 'itrans')).toBe('zha'); // bare consonant + inherent a
        });
    });

    // ── ALA-LC ────────────────────────────────────────────────────────────────
    describe('ALA-LC', () => {
        test('ழ → ḷ (ALA-LC delta from ISO)', () => {
            expect(pipeline('ழ', 'ala-lc')).toBe('ḷa');  // bare + inherent a
        });

        test('ழ → ḻ (ISO 15919 reference)', () => {
            expect(pipeline('ழ', 'iso15919')).toBe('ḻa');
        });
    });
});
