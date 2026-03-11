import { sanitize } from '../../src/sanitizer.js';

describe('Layer 0: Sanitizer', () => {

    test('returns empty string for non-string inputs', () => {
        expect(sanitize(null)).toBe('');
        expect(sanitize(undefined)).toBe('');
        expect(sanitize(42)).toBe('');
        expect(sanitize({})).toBe('');
    });

    test('strips ZWNJ (\u200C) adjacent to Tamil characters', () => {
        // க + ZWNJ + ல → கல
        expect(sanitize('க\u200Cல')).toBe('கல');
    });

    test('strips ZWJ (\u200D) adjacent to Tamil characters', () => {
        // க் + ZWJ + ர → க்ர (raw; Intl.Segmenter handles the cluster)
        expect(sanitize('க்\u200Dர')).toBe('க்ர');
    });

    test('does NOT strip ZWJ between non-Tamil characters', () => {
        // English ZWJ sequences must be preserved
        expect(sanitize('a\u200Db')).toBe('a\u200Db');
    });

    test('canonicalizes ஸ்ரீ variant (SHA → SA)', () => {
        // Variant: U+0BB6 (ஶ/SHA) + virama + ர + ீ
        const variant = '\u0BB6\u0BCD\u0BB0\u0BC0';
        const canonical = '\u0BB8\u0BCD\u0BB0\u0BC0'; // ஸ்ரீ
        expect(sanitize(variant)).toBe(canonical);
    });

    test('converts Tamil numerals to Indo-Arabic digits', () => {
        // ௦௧௨௩௪௫௬௭௮௯ → 0123456789
        expect(sanitize('௦௧௨௩௪௫௬௭௮௯')).toBe('0123456789');
    });

    test('converts individual Tamil numerals correctly', () => {
        expect(sanitize('௨௦௨௪')).toBe('2024');
    });

    test('applies NFC normalization — composes decomposed ொ', () => {
        // ெ (U+0BC6) + ா (U+0BBE) → NFC composes to ொ (U+0BCA)
        const decomposed = '\u0BC6\u0BBE';
        const composed = '\u0BCA';
        const result = sanitize('க' + decomposed);
        expect(result.length).toBe(2); // க + ொ (2 code units)
        expect(result[1]).toBe(composed);
    });

    test('processes regular Tamil text without alteration', () => {
        expect(sanitize('தமிழ்')).toBe('தமிழ்');
    });

    test('passes through English, digits, and punctuation', () => {
        expect(sanitize('Hello 2024!')).toBe('Hello 2024!');
    });
});
