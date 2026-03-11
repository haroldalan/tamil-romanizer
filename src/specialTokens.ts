/**
 * Layer 5 — Special Token Handler
 *
 * Performs final string assembly over the resolved token array.
 * Handles the Āytham (ஃ) special character per scheme.
 *
 * v2 change:
 *  The Grantha post-processing regex block (kṣ→ksh, sree→sri) has been
 *  REMOVED. Those sequences are now resolved correctly inside Layer 3
 *  (GRANTHA_CONJUNCT_HEAD tagging) and Layer 4 (GRANTHA_CONJUNCT_TABLE
 *  lookup), making the regex both redundant and potentially dangerous for
 *  non-Tamil substrings. Layer 5 is now purely assembly + Āytham.
 *
 * Āytham (ஃ, U+0B83) resolution:
 *   Practical:   Silent drop. The mutation to 'f' or 'z' was already applied
 *                in Layer 3 (FRICATIVE_MUTATED tag) + Layer 4 (scheme lookup).
 *   ISO 15919:   Emit 'ḵ' (U+1E35, Latin small k with line below).
 */
import type { ResolvedToken } from './types.js';

export function handleSpecialTokens(
    resolvedTokens: ResolvedToken[],
    schemeName: string,
): string {
    const isPractical = schemeName.startsWith('practical') || schemeName === 'itrans';
    let outputString = '';

    for (const token of resolvedTokens) {
        if (token.text === '\u0B83') { // ஃ (Āytham)
            if (!isPractical) {
                outputString += 'ḵ'; // ISO 15919 standard transcription
            }
            // Practical: drop silently. The following consonant already carries 'f' or 'z'.
            continue;
        }

        outputString += token.romanized ?? token.text;
    }

    return outputString;
}
