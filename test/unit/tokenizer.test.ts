import { tokenize, tokenTypes } from '../../src/tokenizer.js';

describe('Layer 1: Tokenizer — Exhaustive Classification', () => {

    const PURE_VOWELS = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'];
    const NATIVE_CONSONANTS = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];
    const VOWEL_SIGNS = ['\u0BBE', '\u0BBF', '\u0BC0', '\u0BC1', '\u0BC2', '\u0BC6', '\u0BC7', '\u0BC8', '\u0BCA', '\u0BCB', '\u0BCC'];
    const VIRAMA = '\u0BCD';

    test('classifies all 12 pure vowels as VOWEL', () => {
        for (const v of PURE_VOWELS) {
            const result = tokenize(v);
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(tokenTypes.VOWEL);
        }
    });

    test('classifies all 18 bare native consonants as CONSONANT_BARE', () => {
        for (const c of NATIVE_CONSONANTS) {
            const result = tokenize(c);
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(tokenTypes.CONSONANT_BARE);
        }
    });

    test('classifies all 18 consonants + virama as CONSONANT_VIRAMA', () => {
        for (const c of NATIVE_CONSONANTS) {
            const result = tokenize(c + VIRAMA);
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(tokenTypes.CONSONANT_VIRAMA);
        }
    });

    test('classifies all 18 × 11 consonant+vowel sign combos as CONSONANT_VOWEL_SIGN', () => {
        for (const c of NATIVE_CONSONANTS) {
            for (const vs of VOWEL_SIGNS) {
                const result = tokenize(c + vs);
                expect(result).toHaveLength(1);
                expect(result[0].type).toBe(tokenTypes.CONSONANT_VOWEL_SIGN);
            }
        }
    });

    test('classifies Āytham (ஃ) as AYTHAM', () => {
        const result = tokenize('ஃ');
        expect(result[0].type).toBe(tokenTypes.AYTHAM);
    });

    test('classifies whitespace as WHITESPACE', () => {
        const result = tokenize(' ');
        expect(result[0].type).toBe(tokenTypes.WHITESPACE);
    });

    test('classifies Indo-Arabic digits as NUMERAL', () => {
        // Intl.Segmenter with grapheme granularity gives one grapheme per digit character.
        // '1', '2', '3' are 3 separate grapheme clusters, each classified as NUMERAL.
        const result = tokenize('123');
        expect(result).toHaveLength(3);
        result.forEach(t => expect(t.type).toBe(tokenTypes.NUMERAL));
    });

    test('classifies punctuation correctly', () => {
        const result = tokenize('.,!');
        expect(result).toHaveLength(3);
        result.forEach(t => expect(t.type).toBe(tokenTypes.PUNCTUATION));
    });

    test('classifies Grantha consonants correctly', () => {
        expect(tokenize('ஜ')[0].type).toBe(tokenTypes.CONSONANT_BARE);
        expect(tokenize('ஷ')[0].type).toBe(tokenTypes.CONSONANT_BARE);
        expect(tokenize('ஸ')[0].type).toBe(tokenTypes.CONSONANT_BARE);
        expect(tokenize('ஹ')[0].type).toBe(tokenTypes.CONSONANT_BARE);
    });

    test('classifies English characters as OTHER', () => {
        const result = tokenize('Tamil');
        result.forEach(t => expect(t.type).toBe(tokenTypes.OTHER));
    });

    test('handles mixed Tamil + English + number string', () => {
        const result = tokenize('தமிழ் Tamil 123');
        const types = result.map(t => t.type);
        // Tamil tokens, whitespace, English OTHER tokens, whitespace, numeral
        expect(types).toContain(tokenTypes.WHITESPACE);
        expect(types).toContain(tokenTypes.OTHER);
        expect(types).toContain(tokenTypes.NUMERAL);
    });

    test('accepts injected Intl.Segmenter', () => {
        const customSegmenter = new Intl.Segmenter('ta-IN', { granularity: 'grapheme' });
        const result = tokenize('தமிழ்', { segmenter: customSegmenter });
        expect(result.length).toBeGreaterThan(0);
    });
});
