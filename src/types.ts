// ── Token types ───────────────────────────────────────────────────────────────
export type TokenType =
    | 'vowel'
    | 'consonant_virama'
    | 'consonant_vowel_sign'
    | 'consonant_bare'
    | 'aytham'
    | 'whitespace'
    | 'numeral'
    | 'punctuation'
    | 'other';

export type ModifierType = 'vowel_sign' | 'virama' | 'null' | 'none';

export type ContextTag =
    | 'WORD_INITIAL'
    | 'GEMINATE'
    | 'POST_NASAL'
    | 'INTERVOCALIC'
    | 'FRICATIVE_MUTATED'
    | 'GRANTHA_CONJUNCT_HEAD'
    | 'WORD_FINAL'
    | 'DEFAULT';

export type SchemeName =
    | 'practical'
    | 'practical/standard'
    | 'practical/phonetic'
    | 'iso15919'
    | 'ala-lc'
    | 'alalc'
    | 'itrans';

export type CapitalizeMode = 'none' | 'sentence' | 'words';

// ── Token pipeline stages ─────────────────────────────────────────────────────
export interface RawToken {
    text: string;
    type: TokenType;
}

export interface DecomposedToken extends RawToken {
    base: string;
    modifier: string;
    modifierType: ModifierType;
}

export interface ContextToken extends DecomposedToken {
    contextTag: ContextTag;
}

export interface ResolvedToken extends ContextToken {
    romanized: string;
}

// ── Public API types ──────────────────────────────────────────────────────────
export interface RomanizeOptions {
    scheme?: SchemeName;
    exceptions?: boolean;
    table?: Record<string, string | Partial<Record<ContextTag, string>>> | null;
    capitalize?: CapitalizeMode;
    segmenter?: Intl.Segmenter;
    locale?: string;
}

export interface DebugResult {
    layer0_sanitized: string;
    layer1_tokens: RawToken[];
    layer2_decomposed: DecomposedToken[];
    layer3_context: ContextToken[];
    layer4_resolved: ResolvedToken[];
    layer5_assembled: string;
    exception_hit: boolean;
    final: string;
}

// ── Exception schema ──────────────────────────────────────────────────────────
export interface ExceptionEntry {
    roman: string;          // Standard romanization (e.g. "Chennai")
    romanStem: string | null;   // Joining stem for suffix-join (null → use roman)
    oblique: string | null;   // Sandhi-mutated stem key (inserted as separate trie entry)
    forceCasing: boolean;         // If true, global capitalize option is bypassed
}

export type ExceptionSchema = Record<string, ExceptionEntry>;

// ── Scheme table shape ────────────────────────────────────────────────────────
export type ConsonantMap = string | Partial<Record<ContextTag | 'DEFAULT', string>>;

export interface SchemeTable {
    vowels: Record<string, string>;
    consonants: Record<string, ConsonantMap>;
}

// ── Suffix table ──────────────────────────────────────────────────────────────
export interface SuffixEntry {
    tamil: string;
    roman: string;
}
