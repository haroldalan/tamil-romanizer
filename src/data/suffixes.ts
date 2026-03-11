import type { SuffixEntry } from '../types.js';

// Sorted longest-to-shortest within each group to guarantee greedy matching.
// SOURCE: Tolkāppiyam case system + professor feedback sariyai entries.
// A SUFFIX_MAP is derived at module load for O(1) remainder lookup.

export const SUFFIX_TABLE: SuffixEntry[] = [

    // ── Sariyai / Inflectional Increments (highest priority — full sandhi forms) ──
    // These are the "glue" phonemes between an oblique stem and a case suffix.
    // Always listed before the bare suffixes they subsume.
    { tamil: 'த்திலிருந்து', roman: 'tthilirundhu' }, // -m word + ablative
    { tamil: 'த்தோடு', roman: 'tthodu' }, // -m word + sociative
    { tamil: 'த்திற்கு', roman: 'tthirkku' }, // -m word + dative
    { tamil: 'த்துடன்', roman: 'tthudan' }, // -m word + comitative
    { tamil: 'த்தின்', roman: 'tthin' }, // -m word + genitive
    { tamil: 'த்தில்', roman: 'tthill' }, // -m word + locative
    { tamil: 'த்தை', roman: 'tthai' }, // -m word + accusative
    { tamil: 'வற்றிலிருந்து', roman: 'vattrililirundhu' }, // avattru class + ablative
    { tamil: 'வற்றோடு', roman: 'vattrodu' }, // avattru class + sociative
    { tamil: 'வற்றில்', roman: 'vattril' }, // avattru class + locative
    { tamil: 'வற்றை', roman: 'vattrai' }, // avattru class + accusative
    { tamil: 'யோடு', roman: 'yodu' }, // glide sociative (vowel stem)
    { tamil: 'வோடு', roman: 'vodu' }, // glide sociative (variant)

    // ── Ablative (source / from) ──────────────────────────────────────────────
    { tamil: 'களிலிருந்து', roman: 'kalilirundhu' },
    { tamil: 'யிலிருந்து', roman: 'yilirundhu' },
    { tamil: 'இலிருந்து', roman: 'ilirundhu' },
    { tamil: 'இடமிருந்து', roman: 'idamirundhu' },
    { tamil: 'யிடமிருந்து', roman: 'yidamirundhu' },

    // ── Dative ────────────────────────────────────────────────────────────────
    { tamil: 'களுக்கு', roman: 'kalukku' },
    { tamil: 'க்கிடையே', roman: 'kkidaiyae' },
    { tamil: 'யிடம்', roman: 'yidam' },
    { tamil: 'இடம்', roman: 'idam' },
    { tamil: 'உக்கு', roman: 'ukku' }, // sandhi variant
    { tamil: 'க்கு', roman: 'kku' },

    // ── Locative ──────────────────────────────────────────────────────────────
    { tamil: 'களில்', roman: 'kalil' },
    { tamil: 'யில்', roman: 'yil' }, // vowel-final stem
    { tamil: 'இல்', roman: 'il' }, // consonant-final stem
    { tamil: 'ல்', roman: 'l' }, // reduced / compound context

    // ── Accusative ────────────────────────────────────────────────────────────
    { tamil: 'களை', roman: 'kalai' },
    { tamil: 'யை', roman: 'yai' },
    { tamil: 'ஐ', roman: 'ai' },

    // ── Genitive ──────────────────────────────────────────────────────────────
    { tamil: 'களின்', roman: 'kalin' },
    { tamil: 'யின்', roman: 'yin' },
    { tamil: 'இன்', roman: 'in' },
    { tamil: 'உடைய', roman: 'udaiya' },

    // ── Instrumental / Sociative ──────────────────────────────────────────────
    { tamil: 'யினால்', roman: 'yinaal' },
    { tamil: 'ஆல்', roman: 'aal' },
    { tamil: 'உடன்', roman: 'udan' },
    { tamil: 'ஓடு', roman: 'odu' },

    // ── Plural marker ─────────────────────────────────────────────────────────
    { tamil: 'கள்', roman: 'kal' },

    // ── Nominal / Enclitic ────────────────────────────────────────────────────
    { tamil: 'தான்', roman: 'thaan' }, // emphatic
    { tamil: 'ம்', roman: 'm' }, // conjunctive / "and"
    { tamil: 'ஓ', roman: 'o' }, // question / disjunction
];

// O(1) lookup: remainder string → romanized suffix.
// Derived from SUFFIX_TABLE at module load — no runtime overhead per-call.
export const SUFFIX_MAP: Map<string, string> = new Map(
    SUFFIX_TABLE.map(e => [e.tamil, e.roman])
);
