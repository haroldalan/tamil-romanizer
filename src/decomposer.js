import { tokenTypes } from './tokenizer.js';

export const modifierTypes = {
    VOWEL_SIGN: 'vowel_sign',
    VIRAMA: 'virama',
    NULL: 'null', // Inherent 'a' or pure vowel
    NONE: 'none' // For OTHER types
};

/**
 * Mathematically splits each mapped cluster into { base, modifier }
 * based on the token type.
 * 
 * @param {Array<{text: string, type: string}>} tokens
 * @returns {Array<{text: string, type: string, base: string, modifier: string, modifierType: string}>}
 */
export function decompose(tokens) {
    if (!Array.isArray(tokens)) return [];

    return tokens.map(token => {
        let base = token.text;
        let modifier = '';
        let modifierType = modifierTypes.NONE;

        if (token.type === tokenTypes.VOWEL) {
            base = token.text[0]; // First code point
            modifierType = modifierTypes.NULL;
        } else if (token.type === tokenTypes.CONSONANT_BARE) {
            base = token.text[0];
            modifierType = modifierTypes.NULL;
        } else if (token.type === tokenTypes.CONSONANT_VIRAMA || token.type === tokenTypes.CONSONANT_VOWEL_SIGN) {
            base = token.text[0]; // U+0B95 etc.
            modifier = token.text.slice(1); // The rest of the code points in the grapheme cluster

            modifierType = token.type === tokenTypes.CONSONANT_VIRAMA
                ? modifierTypes.VIRAMA
                : modifierTypes.VOWEL_SIGN;
        } else {
            // OTHER tags passes through verbatim
            modifierType = modifierTypes.NONE;
        }

        return {
            ...token,
            base,
            modifier,
            modifierType
        };
    });
}
