import iso15919 from './schemes/iso15919.js';
import practical from './schemes/practical.js';
import alaLc from './schemes/alaLc.js';
import { tokenTypes } from './tokenizer.js';
import { modifierTypes } from './decomposer.js';

const schemes = {
    iso15919,
    practical,
    alaLc,
    'ala-lc': alaLc
};

// Maps vowel signs (modifier part of cluster) to their pure vowel equivalent
export const vowelSignToBase = {
    '\u0BBE': 'ஆ', // ா
    '\u0BBF': 'இ', // ி
    '\u0BC0': 'ஈ', // ீ
    '\u0BC1': 'உ', // ு
    '\u0BC2': 'ஊ', // ூ
    '\u0BC6': 'எ', // ெ
    '\u0BC7': 'ஏ', // ே
    '\u0BC8': 'ஐ', // ை
    '\u0BCA': 'ஒ', // ொ
    '\u0BCB': 'ஓ', // ோ
    '\u0BCC': 'ஔ', // ௌ
    '\u0BD7': 'ஔ'  // ௗ (Length mark, functionally part of au modifier sequence)
};

/**
 * Maps fully decorated tokens into romanized structures via the selected scheme.
 * 
 * @param {Array<Object>} tokens - Analyzed tokens from Layer 3
 * @param {string} schemeName - 'practical', 'iso15919', 'ala-lc'
 * @param {Object} customTable - User overrides
 */
export function resolveScheme(tokens, schemeName = 'practical', customTable = null) {
    const scheme = schemes[schemeName] || practical;

    return tokens.map(token => {
        // Pass non-tamil strings / numerals directly
        if (token.type === tokenTypes.OTHER) {
            return { ...token, romanized: token.text };
        }

        let romanized = '';

        if (token.type === tokenTypes.VOWEL) {
            romanized = scheme.vowels[token.base] || token.base;
        } else {
            // It's a consonant base
            let consStr = token.base;

            // Override or scheme check
            const customCons = customTable && customTable[token.base];
            const consMap = customCons || scheme.consonants[token.base];

            if (typeof consMap === 'string') {
                consStr = consMap; // ISO style maps all contexts identically
            } else if (consMap && typeof consMap === 'object') {
                // Practical style (context-aware)
                if (token.contextTag === 'GEMINATE' && consMap['GEMINATE']) {
                    const gm = consMap['GEMINATE'];
                    if (token.modifierType === modifierTypes.VIRAMA) {
                        consStr = gm.charAt(0); // Take first character (e.g. 't' from 'tch')
                    } else {
                        consStr = gm.slice(1); // Take the rest (e.g. 'ch' from 'tch')
                    }
                } else {
                    consStr = consMap[token.contextTag] || consMap['DEFAULT'] || token.base;
                }
            } else {
                // Fallback missing mappings
                consStr = token.base;
            }

            // Add modifying vowel
            let vowelStr = '';
            if (token.modifierType === modifierTypes.NULL) {
                vowelStr = scheme.vowels['அ'] || 'a';
            } else if (token.modifierType === modifierTypes.VOWEL_SIGN) {
                // Map modifier string to base vowel string
                const baseVowel = vowelSignToBase[token.modifier];
                if (baseVowel) {
                    vowelStr = scheme.vowels[baseVowel] || '';
                }
            }
            // VIRAMA translates to no vowel.

            romanized = consStr + vowelStr;
        }

        return { ...token, romanized };
    });
}
