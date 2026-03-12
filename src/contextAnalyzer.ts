/**
 * Layer 3 — Context Analyzer
 *
 * Performs a single forward pass over the decomposed token array and assigns
 * each consonant cluster a phonological context tag. This tag drives allophone
 * selection in Layer 4 (Scheme Resolver).
 *
 * v2 additions:
 *  - GRANTHA_CONJUNCT_HEAD tag: detects Sanskrit conjunct pairs (க்ஷ, ஸ்ர, ஸ்த, க்ஸ)
 *    and tags the first element. Layer 4 then consumes both tokens as a unit.
 *  - The GRANTHA_CONJUNCT_HEAD check replaces the old Layer 5 regex post-processing
 *    for kṣ→ksh and sree→sri. This is architecturally cleaner and scheme-aware.
 */
import type { DecomposedToken, ContextToken, ContextTag } from './types.js';
import { tokenTypes } from './tokenizer.js';

export const contextTags: Record<string, ContextTag> = {
    WORD_INITIAL: 'WORD_INITIAL',
    GEMINATE: 'GEMINATE',
    POST_NASAL: 'POST_NASAL',
    GRANTHA_CONJUNCT_HEAD: 'GRANTHA_CONJUNCT_HEAD',
    FRICATIVE_MUTATED: 'FRICATIVE_MUTATED',
    INTERVOCALIC: 'INTERVOCALIC',
    WORD_FINAL: 'WORD_FINAL',
    DEFAULT: 'DEFAULT',
} as const;

// ── Constants ─────────────────────────────────────────────────────────────────

// Tamil nasal consonant bases that, when in virama form, trigger POST_NASAL on
// the following consonant. ஞ MUST be included (பஞ்சம் → panjam, not pansam).
const NASALS = new Set(['ங', 'ன', 'ண', 'ந', 'ம', 'ஞ']);

// Grantha conjunct pairs: head base → set of valid following bases.
// After Layer 0 canonicalization, ஸ்ரீ always has ஸ (U+0BB8) as head.
const GRANTHA_CONJUNCT_PAIRS = new Map<string, Set<string>>([
    ['க', new Set(['ஷ', 'ஸ'])],  // க்ஷ (pakshi / moksha), க்ஸ (rare loans)
    ['ஸ', new Set(['ர', 'த'])],  // ஸ்ர (Sri / Sree), ஸ்த (sthalam / sthanam)
]);

// ── Helper: does this token carry a vowel sound? ──────────────────────────────
function carriesVowel(token: DecomposedToken | undefined): boolean {
    if (!token) return false;
    return (
        token.type === tokenTypes.VOWEL ||
        token.type === tokenTypes.CONSONANT_VOWEL_SIGN ||
        token.type === tokenTypes.CONSONANT_BARE
        // CONSONANT_VIRAMA deliberately excluded — virama suppresses the vowel
    );
}

// ── Helper: is this token a separator (word boundary marker)? ─────────────────
function isSeparator(token: DecomposedToken | undefined): boolean {
    if (!token) return true; // treat array boundary as separator
    return (
        token.type === tokenTypes.WHITESPACE ||
        token.type === tokenTypes.PUNCTUATION ||
        token.type === tokenTypes.OTHER
    );
}

// ── Main context analysis ─────────────────────────────────────────────────────
export function analyzeContext(tokens: DecomposedToken[]): ContextToken[] {
    return tokens.map((token, i) => {
        // Non-consonant tokens receive DEFAULT and are not analyzed further
        const isConsonantType =
            token.type === tokenTypes.CONSONANT_BARE ||
            token.type === tokenTypes.CONSONANT_VIRAMA ||
            token.type === tokenTypes.CONSONANT_VOWEL_SIGN;

        if (!isConsonantType) {
            return { ...token, contextTag: 'DEFAULT' as ContextTag, wordFinal: false };
        }

        const prev = tokens[i - 1] as DecomposedToken | undefined;
        const next = tokens[i + 1] as DecomposedToken | undefined;

        // ── Word-final flag (independent of contextTag) ───────────────────────
        const wordFinal = isSeparator(next);

        // ── Priority order (descending) ────────────────────────────────────────

        // 0. GRANTHA_CONJUNCT_HEAD
        const isConjunctHead =
            token.modifierType === 'virama' &&
            next !== undefined &&
            (next.type === tokenTypes.CONSONANT_BARE ||
                next.type === tokenTypes.CONSONANT_VOWEL_SIGN) &&
            (GRANTHA_CONJUNCT_PAIRS.get(token.base)?.has(next.base) ?? false);
        if (isConjunctHead) {
            return { ...token, contextTag: 'GRANTHA_CONJUNCT_HEAD' as ContextTag, wordFinal };
        }

        // 1. WORD_INITIAL
        const isWordInitial = i === 0 || isSeparator(prev);
        if (isWordInitial) {
            return { ...token, contextTag: 'WORD_INITIAL' as ContextTag, wordFinal };
        }

        // 2. GEMINATE
        const isViramaHalf =
            token.modifierType === 'virama' &&
            next !== undefined &&
            next.base === token.base;
        const isBaseHalf =
            prev !== undefined &&
            prev.modifierType === 'virama' &&
            prev.base === token.base;
        if (isViramaHalf || isBaseHalf) {
            return { ...token, contextTag: 'GEMINATE' as ContextTag, wordFinal };
        }

        // 3. POST_NASAL
        const isPostNasal =
            prev !== undefined &&
            prev.modifierType === 'virama' &&
            NASALS.has(prev.base);
        if (isPostNasal) {
            return { ...token, contextTag: 'POST_NASAL' as ContextTag, wordFinal };
        }

        // 4. FRICATIVE_MUTATED
        const isFricativeMutated =
            prev !== undefined &&
            prev.type === tokenTypes.AYTHAM &&
            (token.base === 'ப' || token.base === 'ஜ');
        if (isFricativeMutated) {
            return { ...token, contextTag: 'FRICATIVE_MUTATED' as ContextTag, wordFinal };
        }

        // 5. INTERVOCALIC
        const isIntervocalic =
            carriesVowel(prev) &&
            token.modifierType !== 'virama';
        if (isIntervocalic) {
            return { ...token, contextTag: 'INTERVOCALIC' as ContextTag, wordFinal };
        }

        // 6. WORD_FINAL
        if (wordFinal) {
            return { ...token, contextTag: 'WORD_FINAL' as ContextTag, wordFinal };
        }

        // 7. DEFAULT fallback
        return { ...token, contextTag: 'DEFAULT' as ContextTag, wordFinal };
    });
}
