import { decompose, modifierTypes } from '../../src/decomposer.js';
import { tokenize, tokenTypes } from '../../src/tokenizer.js';

// Helper: tokenize then decompose
const process = (text: string) => decompose(tokenize(text));

describe('Layer 2: Cluster Decomposer', () => {

    test('bare consonant → base=consonant, modifier="", modifierType=NULL', () => {
        const [tok] = process('க');
        expect(tok.base).toBe('க');
        expect(tok.modifier).toBe('');
        expect(tok.modifierType).toBe(modifierTypes.NULL);
    });

    test('consonant + virama → base=consonant, modifier=virama, modifierType=VIRAMA', () => {
        const [tok] = process('க்');
        expect(tok.base).toBe('க');
        expect(tok.modifier).toBe('\u0BCD');
        expect(tok.modifierType).toBe(modifierTypes.VIRAMA);
    });

    test('consonant + vowel sign → base=consonant, modifier=sign, modifierType=VOWEL_SIGN', () => {
        const [tok] = process('கா');
        expect(tok.base).toBe('க');
        expect(tok.modifier).toBe('\u0BBE');
        expect(tok.modifierType).toBe(modifierTypes.VOWEL_SIGN);
    });

    test('pure vowel → base=vowel, modifier="", modifierType=NULL', () => {
        const [tok] = process('அ');
        expect(tok.base).toBe('அ');
        expect(tok.modifier).toBe('');
        expect(tok.modifierType).toBe(modifierTypes.NULL);
    });

    test('whitespace → modifierType=NONE', () => {
        const [tok] = process(' ');
        expect(tok.modifierType).toBe(modifierTypes.NONE);
        expect(tok.base).toBe(' ');
    });

    test('OTHER token → modifierType=NONE, base=text', () => {
        const [tok] = process('a');
        expect(tok.modifierType).toBe(modifierTypes.NONE);
        expect(tok.base).toBe('a');
    });

    test('AYTHAM → modifierType=NONE, base=ஃ', () => {
        const [tok] = process('ஃ');
        expect(tok.modifierType).toBe(modifierTypes.NONE);
        expect(tok.base).toBe('ஃ');
    });

    test('all 11 vowel signs decompose correctly', () => {
        const VOWEL_SIGNS = ['\u0BBE', '\u0BBF', '\u0BC0', '\u0BC1', '\u0BC2', '\u0BC6', '\u0BC7', '\u0BC8', '\u0BCA', '\u0BCB', '\u0BCC'];
        for (const vs of VOWEL_SIGNS) {
            const [tok] = process('க' + vs);
            expect(tok.modifierType).toBe(modifierTypes.VOWEL_SIGN);
            expect(tok.modifier).toBe(vs);
        }
    });

    test('preserves original text and type through decomposition', () => {
        const tokens = tokenize('தமிழ்');
        const decomposed = decompose(tokens);
        for (let i = 0; i < tokens.length; i++) {
            expect(decomposed[i].text).toBe(tokens[i].text);
            expect(decomposed[i].type).toBe(tokens[i].type);
        }
    });
});
