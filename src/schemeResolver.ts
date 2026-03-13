/**
 * Layer 4 — Scheme Resolver
 *
 * Maps each decorated (context-tagged, decomposed) token to a romanized string
 * by combining a consonant string (scheme-aware, context-sensitive) with a
 * vowel string (derived from the modifier diacritic).
 *
 * v2 changes:
 *  - Replaced functional Array.map() with an imperative while-loop supporting
 *    i += 2 (consuming two tokens as one unit for GRANTHA_CONJUNCT_HEAD).
 *  - GRANTHA_CONJUNCT_TABLE: per-scheme romanization of full conjunct pairs.
 *  - Removed the 'practical' alias from the scheme registry; the resolver
 *    normalizes it to 'practical/standard' internally.
 *  - Types imported from types.ts.
 */
import type {
    ContextToken, ResolvedToken, SchemeName, ContextTag, ConsonantMap
} from './types.js';
import { ISO15919 } from './schemes/iso15919.js';
import { PRACTICAL_STANDARD, PRACTICAL_PHONETIC } from './schemes/practical.js';
import { ALA_LC } from './schemes/alaLc.js';
import { ITRANS } from './schemes/itrans.js';
import { tokenTypes } from './tokenizer.js';
import { modifierTypes } from './decomposer.js';
import { _customSchemes } from './api.js';

// ── Scheme registry ───────────────────────────────────────────────────────────
const SCHEMES: Record<string, typeof ISO15919> = {
    'practical': PRACTICAL_STANDARD,  // legacy alias
    'practical/standard': PRACTICAL_STANDARD,
    'practical/phonetic': PRACTICAL_PHONETIC,
    'iso15919': ISO15919,
    'ala-lc': ALA_LC,
    'alalc': ALA_LC,
    'itrans': ITRANS,
};

// ── Grantha conjunct resolution table ────────────────────────────────────────
// Key format: 'head_base+tail_base' → full conjunct romanization (consonant portion only;
// the vowel from the tail token is appended separately by resolveVowel).
const GRANTHA_CONJUNCT_TABLE: Partial<Record<string, Record<string, string>>> = {
    'practical': { 'க+ஷ': 'ksh', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'sth' },
    'practical/standard': { 'க+ஷ': 'ksh', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'sth' },
    'practical/phonetic': { 'க+ஷ': 'ksh', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'sth' },
    'iso15919': { 'க+ஷ': 'kṣ', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'st' },
    'ala-lc': { 'க+ஷ': 'kṣ', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'st' },
    'alalc': { 'க+ஷ': 'kṣ', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'st' },
    'itrans': { 'க+ஷ': 'ksh', 'க+ஸ': 'ks', 'ஸ+ர': 'sr', 'ஸ+த': 'sth' },
};

// ── Vowel sign → canonical base vowel ────────────────────────────────────────
export const vowelSignToBase: Record<string, string> = {
    '\u0BBE': 'ஆ',  // ா → ā
    '\u0BBF': 'இ',  // ி → i
    '\u0BC0': 'ஈ',  // ீ → ī
    '\u0BC1': 'உ',  // ு → u
    '\u0BC2': 'ஊ',  // ூ → ū
    '\u0BC6': 'எ',  // ெ → e
    '\u0BC7': 'ஏ',  // ே → ē
    '\u0BC8': 'ஐ',  // ை → ai
    '\u0BCA': 'ஒ',  // ொ → o
    '\u0BCB': 'ஓ',  // ோ → ō
    '\u0BCC': 'ஔ',  // ௌ → au
    '\u0BD7': 'ஔ',  // ௗ → au (length mark, rare)
};

// ── Vowel resolution helper ───────────────────────────────────────────────────
function resolveVowel(token: ContextToken, scheme: typeof ISO15919): string {
    if (token.modifierType === 'null') {
        return scheme.vowels['அ'] ?? 'a';  // inherent vowel
    }
    if (token.modifierType === 'vowel_sign') {
        const baseVowel = vowelSignToBase[token.modifier];
        if (!baseVowel) return '';

        // Practical Tanglish vowel sign overrides:
        // ஆ sign (ா U+0BBE) → 'a' everywhere EXCEPT WORD_INITIAL syllables.
        //   WORD_INITIAL keeps 'aa': paartheenee (ப+ா WORD_INITIAL), maarudham, kaanthaazhi.
        //   All others shorten: soodana (ட INTERVOCALIC+ா), mannarellam (ல GEMINATE+ா),
        //   mavanda (ட POST_NASAL wordFinal), yamanda (ட WORD_FINAL).
        if (token.modifier === '\u0BBE' && token.contextTag !== 'WORD_INITIAL') {
            const full = scheme.vowels[baseVowel] ?? '';
            return full === 'aa' ? 'a' : full;
        }

        // ஏ sign (ே U+0BC7):
        //   WORD_INITIAL → 'ae': kaelu (கேளு), paechu (பேச்சு) — full long Ē sound at word start.
        //   Other positions → 'e': paarthenee, medu, kekkuriye — Tanglish short mid-word form.
        if (token.modifier === '\u0BC7') {
            return token.contextTag === 'WORD_INITIAL' ? 'ae' : 'e';
        }

        return scheme.vowels[baseVowel] ?? '';
    }
    // virama → no vowel; none → OTHER, shouldn't reach here
    return '';
}

// Standalone vowel letter resolution (used in the main loop for VOWEL tokens).
// Practical: standalone ஏ letter → 'ae' (not 'e', which is the vowel sign form).
// Other schemes (itrans 'E', ISO 'ē') use their table value unchanged.
function resolveStandaloneVowel(base: string, scheme: typeof ISO15919): string {
    if (base === 'ஏ' && scheme.vowels['ஏ'] === 'ee') return 'ae';
    return scheme.vowels[base] ?? base;
}

// ── Consonant resolution helper ───────────────────────────────────────────────
function resolveConsonant(
    token: ContextToken,
    scheme: typeof ISO15919,
    customTable: Record<string, ConsonantMap> | null,
): string {
    const base = token.base;
    const contextTag = token.contextTag;

    // Custom table takes priority
    const consMap: ConsonantMap | undefined =
        customTable?.[base] ?? scheme.consonants[base];

    if (consMap === undefined) return base; // raw passthrough (unknown character)

    if (typeof consMap === 'string') {
        // ISO-style: context-blind plain string
        return consMap;
    }

    // Practical-style: context-aware object
    if (contextTag === 'GEMINATE') {
        const gemStr = consMap['GEMINATE'];
        if (gemStr) {
            // Virama half is silent (empty); base half carries the full geminate string.
            // Tanglish convention: doubled consonant written once — 'paartthaa' → 'paarthaa'.
            return token.modifierType === 'virama' ? '' : gemStr;
        }
    }

    // When a consonant is in virama (coda) position with DEFAULT context tag,
    // prefer the WORD_FINAL coda form over the DEFAULT onset form.
    // This gives ஞ் → 'n' (coda) instead of 'nj' (onset), correctly.
    // This check MUST come before looking up consMap[DEFAULT] to work.
    if (contextTag === 'DEFAULT' && token.modifierType === 'virama') {
        return (consMap['WORD_FINAL'] ?? consMap['DEFAULT']) ?? base;
    }

    return consMap[contextTag as ContextTag] ?? consMap['DEFAULT'] ?? base;
}

// ── Main resolver ─────────────────────────────────────────────────────────────
export function resolveScheme(
    tokens: ContextToken[],
    schemeName: SchemeName | string,
    customTable: Record<string, ConsonantMap> | null = null,
): ResolvedToken[] {
    // Resolve scheme: built-in registry first, then runtime-registered custom schemes
    const scheme = SCHEMES[schemeName] ?? _customSchemes.get(schemeName) ?? PRACTICAL_STANDARD;
    const conjTable = GRANTHA_CONJUNCT_TABLE[schemeName] ?? GRANTHA_CONJUNCT_TABLE['practical/standard']!;
    const resolved: ResolvedToken[] = [];

    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        // ── GRANTHA_CONJUNCT_HEAD: consume this + next token as one unit ──────
        if (token.contextTag === 'GRANTHA_CONJUNCT_HEAD') {
            const nextToken = tokens[i + 1];
            if (nextToken) {
                const key = `${token.base}+${nextToken.base}`;
                const conjRoman = conjTable[key] ?? resolveConsonant(token, scheme, customTable);
                const vowelStr = resolveVowel(nextToken, scheme);
                // Push only the head token (with the combined romanized value).
                // The tail token is consumed (skipped) — it is never pushed to resolved[].
                resolved.push({ ...token, romanized: conjRoman + vowelStr });
                i += 2;
                continue;
            }
        }

        // ── Standard token resolution ─────────────────────────────────────────
        if (token.type === tokenTypes.OTHER) {
            resolved.push({ ...token, romanized: token.text });
            i++;
            continue;
        }

        if (token.type === tokenTypes.VOWEL) {
            const vowelStr = resolveStandaloneVowel(token.base, scheme);
            resolved.push({ ...token, romanized: vowelStr });
            i++;
            continue;
        }

        // Consonant cluster (BARE, VIRAMA, VOWEL_SIGN, AYTHAM is handled in Layer 5)
        if (
            token.type === tokenTypes.CONSONANT_BARE ||
            token.type === tokenTypes.CONSONANT_VIRAMA ||
            token.type === tokenTypes.CONSONANT_VOWEL_SIGN
        ) {
            const consStr = resolveConsonant(token, scheme, customTable);
            const vowelStr = resolveVowel(token, scheme);
            resolved.push({ ...token, romanized: consStr + vowelStr });
            i++;
            continue;
        }

        // Pass-through: WHITESPACE, NUMERAL, PUNCTUATION, AYTHAM
        resolved.push({ ...token, romanized: token.text });
        i++;
    }

    return resolved;
}
