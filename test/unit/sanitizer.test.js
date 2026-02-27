import { sanitize } from '../../src/sanitizer.js';

describe('Layer 0: Sanitizer', () => {
    test('handles null/undefined gracefully', () => {
        expect(sanitize(null)).toBe('');
        expect(sanitize(undefined)).toBe('');
        expect(sanitize(123)).toBe('');
    });

    test('strips ZWJ and ZWNJ characters', () => {
        // Word with ZWNJ (used to prevent rendering as ligature)
        const withZwnj = 'க\u200Cல';
        expect(sanitize(withZwnj)).toBe('கல');

        // Word with ZWJ
        const withZwj = 'க்\u200Dர';
        expect(sanitize(withZwj)).toBe('க்ர');
    });

    test('canonicalizes ஸ்ரீ (Sri)', () => {
        const canonical = '\u0BB8\u0BCD\u0BB0\u0BC0'; // ஸ + ் + ர + ீ
        const variant = '\u0BB6\u0BCD\u0BB0\u0BC0';   // ஶ + ் + ர + ீ

        expect(sanitize(variant)).toBe(canonical);
        expect(sanitize(canonical)).toBe(canonical);
        expect(sanitize('ஜெய் ' + variant)).toBe('ஜெய் ' + canonical);
    });

    test('converts Tamil numerals ௦-௯ to Indo-Arabic 0-9', () => {
        const tamilZeroToNine = '௦௧௨௩௪௫௬௭௮௯';
        expect(sanitize(tamilZeroToNine)).toBe('0123456789');

        const mixed = 'வருடம் ௨௦௨௪';
        expect(sanitize(mixed)).toBe('வருடம் 2024');
    });

    test('performs NFC normalization on split vowel signs', () => {
        // ொ is composed of ெ (U+0BC6) and ா (U+0BBE)
        const decomposedO = '\u0BC6\u0BBE';
        const composedO = '\u0BCA';

        // க + ெ + ா
        const decomposedKo = 'க' + decomposedO;
        const composedKo = 'க' + composedO;

        expect(sanitize(decomposedKo)).toBe(composedKo);
        // Sanity check that length becomes 2 (க + ொ) rather than 3 (க + ெ + ா)
        expect(sanitize(decomposedKo).length).toBe(2);
    });
});
