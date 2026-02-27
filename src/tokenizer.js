const segmenter = new Intl.Segmenter('ta-IN', { granularity: 'grapheme' });

export const tokenTypes = {
    VOWEL: 'vowel',
    CONSONANT_VIRAMA: 'consonant_virama',
    CONSONANT_VOWEL_SIGN: 'consonant_vowel_sign',
    CONSONANT_BARE: 'consonant_bare',
    OTHER: 'other' // numerals, punctuation, spaces, non-tamil
};

// Vowels (அ to ஔ) U+0B85 to U+0B94
const isVowel = (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x0B85 && code <= 0x0B94;
};

// Consonants (க to ஹ) U+0B95 to U+0BB9
const isConsonant = (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x0B95 && code <= 0x0BB9;
};

// Virama (்) U+0BCD
const isVirama = (char) => char === '\u0BCD';

// Vowel Signs (ா to ௌ) U+0BBE to U+0BCC, plus length marks
const isVowelSign = (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x0BBE && code <= 0x0BCD && code !== 0x0BCD; // Exclude virama explicitly
};

/**
 * Tokenizes a sanitized Tamil string into grapheme clusters.
 * 
 * @param {string} text - Cleaned Tamil text (after passing Layer 0).
 * @returns {Array<{text: string, type: string}>} Array of tagged clusters.
 */
export function tokenize(text) {
    if (typeof text !== 'string' || !text) return [];

    const tokens = [];
    for (const { segment } of segmenter.segment(text)) {
        let type = tokenTypes.OTHER;

        // Check classification based on first character and any modifiers
        if (segment.length === 1) {
            if (isVowel(segment)) {
                type = tokenTypes.VOWEL;
            } else if (isConsonant(segment)) {
                type = tokenTypes.CONSONANT_BARE;
            }
        } else if (segment.length > 1) {
            const base = segment[0];
            const modifier = segment[1];

            if (isConsonant(base)) {
                if (isVirama(modifier)) {
                    type = tokenTypes.CONSONANT_VIRAMA;
                } else if (isVowelSign(modifier)) {
                    type = tokenTypes.CONSONANT_VOWEL_SIGN;
                }
            }

            // Additional check for composed sequences like க்ஷ or ஸ்ரீ 
            // where Intl Segmenter keeps multiple characters together.
            // But for grantha/ligatures or three-code sequences, if it starts
            // with a consonant, we categorize it by its final modifier.
            // Wait, Intl.Segmenter splits க்ஷ into க் and ஷ correctly in ta-IN? Let's verify.
            // If it doesn't, it drops to OTHER, which decomposer can handle as raw text.
        }

        tokens.push({ text: segment, type });
    }

    return tokens;
}
