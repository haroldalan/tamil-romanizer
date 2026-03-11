/**
 * Layer 2 — Decomposer
 *
 * Splits each grapheme cluster token into its constituent parts:
 *   base       — the base consonant or vowel character
 *   modifier   — the diacritic (vowel sign, virama, or empty)
 *   modifierType — semantic category of the modifier
 *
 * This enriches each token for downstream context analysis and scheme resolution.
 */
import type { RawToken, DecomposedToken, ModifierType } from './types.js';
import { tokenTypes } from './tokenizer.js';

export const modifierTypes: Record<string, ModifierType> = {
    VOWEL_SIGN: 'vowel_sign', // Cluster carries an explicit vowel diacritic
    VIRAMA: 'virama',     // Cluster carries a virama → pure consonant, no vowel
    NULL: 'null',       // No modifier → carries the inherent vowel 'a'
    NONE: 'none',       // Non-Tamil cluster — passes through verbatim
} as const;

export function decompose(tokens: RawToken[]): DecomposedToken[] {
    return tokens.map(token => {
        switch (token.type) {
            case tokenTypes.VOWEL:
                return {
                    ...token,
                    base: token.text[0],
                    modifier: '',
                    modifierType: 'null' as ModifierType,
                };
            case tokenTypes.CONSONANT_BARE:
                return {
                    ...token,
                    base: token.text[0],
                    modifier: '',
                    modifierType: 'null' as ModifierType,
                };
            case tokenTypes.CONSONANT_VIRAMA:
                return {
                    ...token,
                    base: token.text[0],
                    modifier: token.text.slice(1),
                    modifierType: 'virama' as ModifierType,
                };
            case tokenTypes.CONSONANT_VOWEL_SIGN:
                return {
                    ...token,
                    base: token.text[0],
                    modifier: token.text.slice(1),
                    modifierType: 'vowel_sign' as ModifierType,
                };
            default:
                // OTHER, WHITESPACE, NUMERAL, PUNCTUATION, AYTHAM
                return {
                    ...token,
                    base: token.text,
                    modifier: '',
                    modifierType: 'none' as ModifierType,
                };
        }
    });
}
