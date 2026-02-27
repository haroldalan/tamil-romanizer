import { decompose, modifierTypes } from '../../src/decomposer.js';
import { tokenTypes } from '../../src/tokenizer.js';

describe('Layer 2: Cluster Decomposer', () => {
    test('handles bare consonants', () => {
        const tokens = [{ text: 'க', type: tokenTypes.CONSONANT_BARE }];
        const result = decompose(tokens);
        expect(result[0].base).toBe('க');
        expect(result[0].modifier).toBe('');
        expect(result[0].modifierType).toBe(modifierTypes.NULL);
    });

    test('handles consonants with virama', () => {
        const tokens = [{ text: 'க்', type: tokenTypes.CONSONANT_VIRAMA }];
        const result = decompose(tokens);
        expect(result[0].base).toBe('க');
        expect(result[0].modifier).toBe('\u0BCD'); // ்
        expect(result[0].modifierType).toBe(modifierTypes.VIRAMA);
    });

    test('handles consonants with vowel signs', () => {
        const tokens = [{ text: 'கா', type: tokenTypes.CONSONANT_VOWEL_SIGN }];
        const result = decompose(tokens);
        expect(result[0].base).toBe('க');
        expect(result[0].modifier).toBe('\u0BBE'); // ா
        expect(result[0].modifierType).toBe(modifierTypes.VOWEL_SIGN);
    });

    test('handles pure vowels', () => {
        const tokens = [{ text: 'அ', type: tokenTypes.VOWEL }];
        const result = decompose(tokens);
        expect(result[0].base).toBe('அ');
        expect(result[0].modifier).toBe('');
        expect(result[0].modifierType).toBe(modifierTypes.NULL);
    });

    test('handles other characters seamlessly', () => {
        const tokens = [{ text: 'a', type: tokenTypes.OTHER }, { text: ' ', type: tokenTypes.OTHER }];
        const result = decompose(tokens);
        expect(result[0].base).toBe('a');
        expect(result[0].modifierType).toBe(modifierTypes.NONE);
        expect(result[1].base).toBe(' ');
        expect(result[1].modifierType).toBe(modifierTypes.NONE);
    });
});
