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
            return { ...token, contextTag: 'DEFAULT' as ContextTag };
        }

        const prev = tokens[i - 1] as DecomposedToken | undefined;
        const next = tokens[i + 1] as DecomposedToken | undefined;

        // ── Priority order (descending) ────────────────────────────────────────

        // 0. GRANTHA_CONJUNCT_HEAD — MUST be checked before WORD_INITIAL because
        //    a word-initial conjunct (e.g. ஸ்ரீரங்கம், க்ஷண்டம்) is simultaneously
        //    word-initial AND a conjunct head. GRANTHA_CONJUNCT_HEAD takes priority
        //    so that Layer 4 can consume both tokens as a combined unit.
        //    Only fires for the HEAD — the partner token receives DEFAULT (consumed by Layer 4).
        const isConjunctHead =
            token.modifierType === 'virama' &&
            next !== undefined &&
            (next.type === tokenTypes.CONSONANT_BARE ||
                next.type === tokenTypes.CONSONANT_VOWEL_SIGN) &&
            (GRANTHA_CONJUNCT_PAIRS.get(token.base)?.has(next.base) ?? false);
        if (isConjunctHead) {
            return { ...token, contextTag: 'GRANTHA_CONJUNCT_HEAD' as ContextTag };
        }

        // 1. WORD_INITIAL: first token, or immediately follows a separator
        const isWordInitial = i === 0 || isSeparator(prev);
        if (isWordInitial) {
            return { ...token, contextTag: 'WORD_INITIAL' as ContextTag };
        }

        // Word-final: last token, or immediately precedes a separator
        const isWordFinal = isSeparator(next);

        // 2. GEMINATE — virama half AND base half
        //    Pattern: [C + virama] followed by same [C + vowel/bare]
        const isViramaHalf =
            token.modifierType === 'virama' &&
            next !== undefined &&
            next.base === token.base;
        const isBaseHalf =
            prev !== undefined &&
            prev.modifierType === 'virama' &&
            prev.base === token.base;
        if (isViramaHalf || isBaseHalf) {
            return { ...token, contextTag: 'GEMINATE' as ContextTag };
        }

        // 3. POST_NASAL — preceded by a nasal in virama form
        const isPostNasal =
            prev !== undefined &&
            prev.modifierType === 'virama' &&
            NASALS.has(prev.base);
        if (isPostNasal) {
            return { ...token, contextTag: 'POST_NASAL' as ContextTag };
        }

        // 4. FRICATIVE_MUTATED — ப or ஜ immediately following an Āytham (ஃ)
        const isFricativeMutated =
            prev !== undefined &&
            prev.type === tokenTypes.AYTHAM &&
            (token.base === 'ப' || token.base === 'ஜ');
        if (isFricativeMutated) {
            return { ...token, contextTag: 'FRICATIVE_MUTATED' as ContextTag };
        }

        // 5. INTERVOCALIC — preceded by a vowel-carrying token AND own modifier ≠ virama
        //    (The following token is irrelevant — see 2nd professor feedback correction)
        const isIntervocalic =
            carriesVowel(prev) &&
            token.modifierType !== 'virama';
        if (isIntervocalic) {
            return { ...token, contextTag: 'INTERVOCALIC' as ContextTag };
        }

        // 6. WORD_FINAL
        if (isWordFinal) {
            return { ...token, contextTag: 'WORD_FINAL' as ContextTag };
        }

        // 7. DEFAULT fallback
        return { ...token, contextTag: 'DEFAULT' as ContextTag };
    });
}
