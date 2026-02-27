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
                if (nextToken && nextToken.base === 'ப') {
                    // Replace 'p' or 'b' with 'f' in the next token's romanization
                    nextToken.romanized = nextToken.romanized.replace(/^[pb]/i, 'f');
                } else if (nextToken && nextToken.base === 'ஜ') {
                    // Replace 'j' with 'z' in the next token's romanization
                    nextToken.romanized = nextToken.romanized.replace(/^j/i, 'z');
                }
                // For other cases or standalone 'ஃ', it's omitted in practical scheme, so nothing is added to outputString here.
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
