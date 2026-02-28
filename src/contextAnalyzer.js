import { tokenTypes } from './tokenizer.js';
import { modifierTypes } from './decomposer.js';

export const contextTags = {
    WORD_INITIAL: 'WORD_INITIAL',
    GEMINATE: 'GEMINATE',
    POST_NASAL: 'POST_NASAL',
    INTERVOCALIC: 'INTERVOCALIC',
    FRICATIVE_MUTATED: 'FRICATIVE_MUTATED',
    WORD_FINAL: 'WORD_FINAL',
    DEFAULT: 'DEFAULT'
};

const nasals = ['ங', 'ன', 'ண', 'ந', 'ம', 'ஞ'];

/**
 * Checks if a token acts as a vowel-carrying unit for intervocalic purposes.
 */
function carriesVowel(token) {
    if (!token) return false;
    if (token.type === tokenTypes.VOWEL) return true;
    // Consonants with a vowel sign or inherent vowel act as vowels for flanking
    if (token.type === tokenTypes.CONSONANT_VOWEL_SIGN || token.type === tokenTypes.CONSONANT_BARE) {
        return true;
    }
    return false;
}

/**
 * Analyzes context for decomposed tokens and assigns a context tag.
 * 
 * @param {Array<Object>} tokens - Array of decomposed tokens
 * @returns {Array<Object>} Tokens mapped with contextTag property
 */
export function analyzeContext(tokens) {
    if (!Array.isArray(tokens)) return [];

    let wordInitialIndex = 0;

    return tokens.map((token, index) => {
        let tag = contextTags.DEFAULT;

        // We only tag consonants for allophony resolution.
        // Pure vowels and OTHER tokens don't need positional allophone tags.
        if ([tokenTypes.CONSONANT_BARE, tokenTypes.CONSONANT_VIRAMA, tokenTypes.CONSONANT_VOWEL_SIGN].includes(token.type)) {

            const prevToken = index > 0 ? tokens[index - 1] : null;
            const nextToken = index < tokens.length - 1 ? tokens[index + 1] : null;

            // Determine word boundaries.
            // A token is word initial if it's the very first token in the string, 
            // OR if the previous token was a space/punctuation
            const isWordInitial = index === 0 ||
                (prevToken && (prevToken.type === tokenTypes.WHITESPACE || prevToken.type === tokenTypes.PUNCTUATION || prevToken.type === tokenTypes.OTHER));

            const isWordFinal = index === tokens.length - 1 ||
                (nextToken && (nextToken.type === tokenTypes.WHITESPACE || nextToken.type === tokenTypes.PUNCTUATION || nextToken.type === tokenTypes.OTHER));

            if (isWordInitial) {
                tag = contextTags.WORD_INITIAL;
                wordInitialIndex = index;
            } else {
                // Tagging rules in priority order.

                // 1. GEMINATE: Either the virama half or base half of a geminate pair
                if (token.modifierType === modifierTypes.VIRAMA && nextToken && nextToken.base === token.base) {
                    tag = contextTags.GEMINATE; // First half (virama)
                } else if (prevToken && prevToken.modifierType === modifierTypes.VIRAMA && prevToken.base === token.base) {
                    tag = contextTags.GEMINATE; // Second half (vowel-carrying)
                }
                // 2. POST_NASAL: Immediately preceded by ங், ன், ண், ந், or ம் (virama form)
                else if (prevToken && prevToken.modifierType === modifierTypes.VIRAMA && nasals.includes(prevToken.base)) {
                    tag = contextTags.POST_NASAL;
                }
                // 3. FRICATIVE_MUTATED: Immediately preceded by an AYTHAM token (ஃ) AND current base is ப or ஜ
                else if (prevToken && prevToken.type === tokenTypes.AYTHAM && (token.base === 'ப' || token.base === 'ஜ')) {
                    tag = contextTags.FRICATIVE_MUTATED;
                }
                // 4. INTERVOCALIC: Preceding cluster holds a vowel AND current cluster's modifier is not VIRAMA
                else if (carriesVowel(prevToken) && token.modifierType !== modifierTypes.VIRAMA) {
                    tag = contextTags.INTERVOCALIC;
                }
                // 5. WORD_FINAL: Last cluster in a word
                else if (isWordFinal) {
                    tag = contextTags.WORD_FINAL;
                }
            }
        }

        return { ...token, contextTag: tag };
    });
}
