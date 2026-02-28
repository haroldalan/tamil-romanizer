import { tokenize, tokenTypes } from '../../src/tokenizer.js';

const vowels = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'];
const consonants = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];
const virama = '்';
const vowelSigns = ['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'];

describe('Layer 1: Tokenizer Exhaustive 247 Output', () => {

    test('handles all 12 pure vowels', () => {
        const tokens = tokenize(vowels.join(''));
        expect(tokens.length).toBe(12);
        tokens.forEach((t, i) => {
            expect(t.text).toBe(vowels[i]);
            expect(t.type).toBe(tokenTypes.VOWEL);
        });
    });

    test('handles all 18 bare consonants', () => {
        const tokens = tokenize(consonants.join(''));
        expect(tokens.length).toBe(18);
        tokens.forEach((t, i) => {
            expect(t.text).toBe(consonants[i]);
            expect(t.type).toBe(tokenTypes.CONSONANT_BARE);
        });
    });

    test('handles all 18 consonants with virama', () => {
        const string = consonants.map(c => c + virama).join('');
        const tokens = tokenize(string);
        expect(tokens.length).toBe(18);
        tokens.forEach((t, i) => {
            expect(t.text).toBe(consonants[i] + virama);
            expect(t.type).toBe(tokenTypes.CONSONANT_VIRAMA);
        });
    });

    test('handles all 198 consonant + vowel sign combinations', () => {
        // 18 consonants * 11 vowel signs = 198 clusters
        for (const c of consonants) {
            for (const v of vowelSigns) {
                const cluster = c + v;
                const tokens = tokenize(cluster);
                expect(tokens.length).toBe(1);
                expect(tokens[0].text).toBe(cluster);
                expect(tokens[0].type).toBe(tokenTypes.CONSONANT_VOWEL_SIGN);
            }
        }
    });

    test('handles Āytham', () => {
        const tokens = tokenize('ஃ');
        expect(tokens.length).toBe(1);
        expect(tokens[0].text).toBe('ஃ');
        expect(tokens[0].type).toBe(tokenTypes.AYTHAM);
    });

    test('handles spaces, numerals, and English characters gracefully', () => {
        const tokens = tokenize('தமிழ் Tamil 123');
        const expectedTypes = [
            tokenTypes.CONSONANT_BARE,
            tokenTypes.CONSONANT_VOWEL_SIGN,
            tokenTypes.CONSONANT_VIRAMA,
            tokenTypes.WHITESPACE,
            tokenTypes.OTHER, tokenTypes.OTHER, tokenTypes.OTHER, tokenTypes.OTHER, tokenTypes.OTHER, // Tamil
            tokenTypes.WHITESPACE,
            tokenTypes.NUMERAL, tokenTypes.NUMERAL, tokenTypes.NUMERAL // 123
        ];

        expect(tokens.length).toBe(expectedTypes.length);
        tokens.forEach((t, i) => expect(t.type).toBe(expectedTypes[i]));
    });
});

