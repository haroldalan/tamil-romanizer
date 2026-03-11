/**
 * Practical Scheme — Tamil phonemic Tanglish romanization
 *
 * Produces natural, readable romanized Tamil ("Tanglish") by applying
 * context-sensitive allophone selection. Consonant maps are objects whose
 * keys are the ContextTag names from Layer 3.
 *
 * Two variants are exported:
 *
 *  PRACTICAL_STANDARD  (default / 'practical' alias)
 *    The canonical phonemic scheme for broad readability.
 *    ட POST_NASAL → 'd' (simpler, widely understood)
 *    த INTERVOCALIC → 'd' (lighter notation)
 *
 *  PRACTICAL_PHONETIC  ('practical/phonetic')
 *    Optimized for Aksharantar WER benchmarking.
 *    ட POST_NASAL → 'nd' (more phonetically accurate for ண்ட clusters)
 *    த INTERVOCALIC → 'dh' (marks aspirate distinction)
 *
 * GEMINATE encoding: a single string where [0] = virama-half, [1:] = base-half.
 *   Example: 'chch' → virama outputs 'c', base outputs 'hch' → combined 'chch'.
 *
 * WORD_FINAL is now explicitly defined for all consonants (previously missing,
 * causing DEFAULT fallback which could mismatch in some edge cases).
 */
import type { SchemeTable } from '../types.js';

// Shared vowel table — identical in both practical variants
const PRACTICAL_VOWELS: Record<string, string> = {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee',
    'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'ae',
    'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oa', 'ஔ': 'au',
};

export const PRACTICAL_STANDARD: SchemeTable = {
    vowels: PRACTICAL_VOWELS,
    consonants: {

        // ── Stop consonants with full allophone tables ──────────────────────
        'க': { DEFAULT: 'k', WORD_INITIAL: 'k', INTERVOCALIC: 'g', POST_NASAL: 'g', GEMINATE: 'kk', WORD_FINAL: 'k' },
        'ச': { DEFAULT: 's', WORD_INITIAL: 'ch', INTERVOCALIC: 's', POST_NASAL: 'j', GEMINATE: 'chch', WORD_FINAL: 'ch' },
        'ட': { DEFAULT: 't', WORD_INITIAL: 't', INTERVOCALIC: 'd', POST_NASAL: 'd', GEMINATE: 'tt', WORD_FINAL: 't' },
        'த': { DEFAULT: 'th', WORD_INITIAL: 'th', INTERVOCALIC: 'd', POST_NASAL: 'dh', GEMINATE: 'tth', WORD_FINAL: 'th' },
        'ப': { DEFAULT: 'p', WORD_INITIAL: 'p', INTERVOCALIC: 'b', POST_NASAL: 'b', GEMINATE: 'pp', WORD_FINAL: 'p', FRICATIVE_MUTATED: 'f' },
        'ற': { DEFAULT: 'r', WORD_INITIAL: 'r', INTERVOCALIC: 'r', POST_NASAL: 'dr', GEMINATE: 'tr', WORD_FINAL: 'r' },

        // ── Nasal consonants ────────────────────────────────────────────────
        'ங': { DEFAULT: 'ng', WORD_INITIAL: 'ng', WORD_FINAL: 'ng' },
        'ஞ': { DEFAULT: 'nj', WORD_INITIAL: 'gn', WORD_FINAL: 'n', GEMINATE: 'nn' },
        'ண': { DEFAULT: 'n', WORD_INITIAL: 'n', WORD_FINAL: 'n' },
        'ந': { DEFAULT: 'n', WORD_INITIAL: 'n', WORD_FINAL: 'n' },
        'ன': { DEFAULT: 'n', WORD_INITIAL: 'n', WORD_FINAL: 'n' },
        'ம': { DEFAULT: 'm', WORD_INITIAL: 'm', WORD_FINAL: 'm' },

        // ── Sonorants, laterals, sibilants ──────────────────────────────────
        'ய': { DEFAULT: 'y', WORD_INITIAL: 'y', WORD_FINAL: 'y' },
        'ர': { DEFAULT: 'r', WORD_INITIAL: 'r', WORD_FINAL: 'r' },
        'ல': { DEFAULT: 'l', WORD_INITIAL: 'l', WORD_FINAL: 'l' },
        'வ': { DEFAULT: 'v', WORD_INITIAL: 'v', WORD_FINAL: 'v' },
        'ழ': { DEFAULT: 'zh', WORD_INITIAL: 'zh', WORD_FINAL: 'zh' },
        'ள': { DEFAULT: 'l', WORD_INITIAL: 'l', WORD_FINAL: 'l' },

        // ── Grantha consonants ───────────────────────────────────────────────
        'ஜ': { DEFAULT: 'j', WORD_INITIAL: 'j', WORD_FINAL: 'j', FRICATIVE_MUTATED: 'z' },
        'ஷ': { DEFAULT: 'sh', WORD_INITIAL: 'sh', WORD_FINAL: 'sh' },
        'ஸ': { DEFAULT: 's', WORD_INITIAL: 's', WORD_FINAL: 's' },
        'ஹ': { DEFAULT: 'h', WORD_INITIAL: 'h', WORD_FINAL: 'h' },
    },
};

export const PRACTICAL_PHONETIC: SchemeTable = {
    vowels: PRACTICAL_VOWELS,
    consonants: {
        ...PRACTICAL_STANDARD.consonants,
        // Phonetic divergences for better WER on Aksharantar corpus
        'ட': { DEFAULT: 't', WORD_INITIAL: 't', INTERVOCALIC: 'd', POST_NASAL: 'nd', GEMINATE: 'tt', WORD_FINAL: 't' },
        'த': { DEFAULT: 'th', WORD_INITIAL: 'th', INTERVOCALIC: 'dh', POST_NASAL: 'dh', GEMINATE: 'tth', WORD_FINAL: 'th' },
    },
};

export default PRACTICAL_STANDARD;
