import { tokenTypes } from './tokenizer.js';

/**
 * Handles Āytham resolution and Grantha sequence post-processing.
 * 
 * @param {Array<Object>} resolvedTokens - Tokens mapped by Layer 4 (contains 'romanized' and 'base')
 * @param {string} schemeName - 'practical', 'iso15919', 'alaLc'
 * @returns {string} Final romanized string
 */
export function handleSpecialTokens(resolvedTokens, schemeName = 'practical') {
    if (!Array.isArray(resolvedTokens)) return '';

    const isPractical = schemeName === 'practical';

    // 1. Āytham resolution and assemble string
    let outputString = '';

    for (let i = 0; i < resolvedTokens.length; i++) {
        const token = resolvedTokens[i];

        if (token.text === 'ஃ') {
            const nextToken = resolvedTokens[i + 1];

            if (isPractical) {
                // In practical scheme, the Āytham token itself is dropped silently.
                // The subsequent base ('ப' or 'ஜ') has already been mutated by Layer 3 + Layer 4 to 'f' or 'z'.
                // So we do nothing to outputString here.
            } else {
                // ISO 15919
                outputString += 'ḵ';
            }
        } else {
            outputString += token.romanized || token.text;
        }
    }

    // 2. Grantha Post-processing
    // The state machine outputs multi-clusters compositionally. 
    // We clean up specific sequences in practical scheme.
    if (isPractical) {
        outputString = outputString.replace(/kṣ/g, 'ksh');
        outputString = outputString.replace(/sree/g, 'sri');
    }

    return outputString;
}
