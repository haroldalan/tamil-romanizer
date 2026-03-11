/**
 * Layer 1 — Tokenizer
 *
 * Splits a sanitized Tamil string into grapheme clusters using Intl.Segmenter
 * and assigns a semantic token type to each cluster.
 *
 * Intl.Segmenter with 'ta-IN' locale and 'grapheme' granularity implements
 * UAX #29 correctly — Brahmic virama conjuncts, vowel signs, and combining
 * diacritics are treated as indivisible grapheme clusters.
 *
 * v2 addition: Segmenter injection via options object (for SSR / Web Workers
 * where a shared module-level singleton may cause issues).
 */
import type { RawToken, TokenType } from './types.js';

// ── Character classification predicates ───────────────────────────────────────

// Tamil pure vowels: U+0B85 (அ) through U+0B94 (ஔ), 12 code points
function isVowel(ch: string): boolean {
    const cp = ch.codePointAt(0)!;
    return cp >= 0x0B85 && cp <= 0x0B94;
}

// Tamil consonants: U+0B95 (க) through U+0BB9 (ஹ), 18 native + 4 Grantha
function isConsonant(ch: string): boolean {
    const cp = ch.codePointAt(0)!;
    return cp >= 0x0B95 && cp <= 0x0BB9;
}

// Virama (pulli / vowel killer): U+0BCD exactly
function isVirama(ch: string): boolean {
    return ch === '\u0BCD';
}

// Tamil vowel signs: U+0BBE through U+0BCC + U+0BD7 (au length mark)
// Excludes U+0BCD (virama) — although in the range, it is handled separately.
function isVowelSign(ch: string): boolean {
    const cp = ch.codePointAt(0)!;
    return (cp >= 0x0BBE && cp <= 0x0BCC) || cp === 0x0BD7;
}

// ── Token type constants ───────────────────────────────────────────────────────
export const tokenTypes: Record<string, TokenType> = {
    VOWEL: 'vowel',
    CONSONANT_VIRAMA: 'consonant_virama',
    CONSONANT_VOWEL_SIGN: 'consonant_vowel_sign',
    CONSONANT_BARE: 'consonant_bare',
    AYTHAM: 'aytham',
    WHITESPACE: 'whitespace',
    NUMERAL: 'numeral',
    PUNCTUATION: 'punctuation',
    OTHER: 'other',
} as const;

// ── Segmenter singleton (module-level default) ─────────────────────────────────
const _defaultSegmenter = new Intl.Segmenter('ta-IN', { granularity: 'grapheme' });

// ── Main tokenize function ─────────────────────────────────────────────────────
export function tokenize(
    text: string,
    opts: { segmenter?: Intl.Segmenter; locale?: string } = {}
): RawToken[] {
    const segmenter =
        opts.segmenter ??
        (opts.locale
            ? new Intl.Segmenter(opts.locale, { granularity: 'grapheme' })
            : _defaultSegmenter);

    const tokens: RawToken[] = [];

    for (const { segment } of segmenter.segment(text)) {
        tokens.push({ text: segment, type: classifySegment(segment) });
    }

    return tokens;
}

function classifySegment(segment: string): TokenType {
    const first = segment[0];

    // Āytham (ஃ, U+0B83) — must be checked before the consonant range
    if (first === '\u0B83') return 'aytham';

    // Structural / non-linguistic
    if (/^\s+$/.test(segment)) return 'whitespace';
    if (/^\d+$/.test(segment)) return 'numeral';
    if (/^[.,/#!$%^&*;:{}=\-_`~()"'""'']+$/.test(segment)) return 'punctuation';

    if (segment.length === 1) {
        if (isVowel(first)) return 'vowel';
        if (isConsonant(first)) return 'consonant_bare';
    }

    if (segment.length >= 2) {
        const base = segment[0];
        const modifier = segment[1];
        if (isConsonant(base)) {
            if (isVirama(modifier)) return 'consonant_virama';
            if (isVowelSign(modifier)) return 'consonant_vowel_sign';
        }
    }

    return 'other';
}
