/**
 * Public API — romanize() and debugRomanize()
 *
 * Orchestrates the full 6-layer pipeline. Handles chunking (word vs separator),
 * exception trie interception, per-chunk capitalization, and final assembly.
 *
 * v2 changes:
 *  - applyCapitalization() is now called per-word-chunk (not on the final string).
 *    This allows forceCasing (from the exception trie) to override globally.
 *  - debugRomanize() export for transparency / diagnostics.
 *  - Segmenter and locale options are threaded to tokenize().
 *  - SchemeName type is used; 'practical' continues to work as an alias.
 */
import type {
    RomanizeOptions, DebugResult, CapitalizeMode, SchemeName, ConsonantMap
} from './types.js';
import { sanitize } from './sanitizer.js';
import { tokenize, tokenTypes } from './tokenizer.js';
import { decompose } from './decomposer.js';
import { analyzeContext } from './contextAnalyzer.js';
import { resolveScheme } from './schemeResolver.js';
import { handleSpecialTokens } from './specialTokens.js';
import { exceptionDictionary } from './exceptionTrie.js';

// ── Capitalization helper ─────────────────────────────────────────────────────
function applyCapitalization(
    text: string,
    capitalize: CapitalizeMode,
    forceCasing: boolean,
    isFirstChunk: boolean,
): string {
    if (!text) return '';
    // forceCasing = entry declared its own authoritative casing (e.g. "TV", "YouTube")
    if (forceCasing) return text;

    switch (capitalize) {
        case 'none':
            return text.toLowerCase();
        case 'sentence':
            if (isFirstChunk) {
                return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            }
            return text.toLowerCase();
        case 'words':
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
}

// ── Main public function ──────────────────────────────────────────────────────
export function romanize(text: string, options: RomanizeOptions = {}): string {
    const {
        scheme = 'practical',
        exceptions = true,
        table = null,
        capitalize = 'none',
        segmenter,
        locale,
    } = options;

    if (typeof text !== 'string') return '';

    const cleanText = sanitize(text);
    if (!cleanText) return '';

    // Layer 1: tokenize the ENTIRE string at once (necessary for correct chunk grouping)
    const allTokens = tokenize(cleanText, { segmenter, locale });

    // ── Chunk segmentation ────────────────────────────────────────────────────
    // Group tokens into alternating 'word' and 'separator' chunks.
    // This ensures punctuation adjacent to Tamil words is NOT fed to the trie.
    type Chunk =
        | { kind: 'word'; tokens: typeof allTokens }
        | { kind: 'separator'; text: string };

    const chunks: Chunk[] = [];
    let current: typeof allTokens = [];

    const isSepType = (t: (typeof allTokens)[0]) =>
        t.type === tokenTypes.WHITESPACE ||
        t.type === tokenTypes.PUNCTUATION ||
        t.type === tokenTypes.OTHER ||
        t.type === tokenTypes.NUMERAL;

    for (const token of allTokens) {
        if (isSepType(token)) {
            if (current.length > 0) {
                chunks.push({ kind: 'word', tokens: current });
                current = [];
            }
            chunks.push({ kind: 'separator', text: token.text });
        } else {
            current.push(token);
        }
    }
    if (current.length > 0) chunks.push({ kind: 'word', tokens: current });

    // ── Per-chunk processing ──────────────────────────────────────────────────
    const parts: string[] = [];
    let isFirstWordChunk = true;  // tracks if we've passed the first word chunk

    for (const chunk of chunks) {
        if (chunk.kind === 'separator') {
            parts.push(chunk.text);
            continue;
        }

        // Reconstruct the raw word text for trie lookup
        const wordText = chunk.tokens.map(t => t.text).join('');
        let wordRoman: string;
        let forceCasing = false;

        // Exception trie interception (bypass Layers 2–5 on hit)
        if (exceptions) {
            const hit = exceptionDictionary.lookup(wordText);
            if (hit) {
                wordRoman = hit.roman;
                forceCasing = hit.forceCasing;
                parts.push(
                    applyCapitalization(wordRoman, capitalize, forceCasing, isFirstWordChunk)
                );
                isFirstWordChunk = false;
                continue;
            }
        }

        // Layers 2–5: full pipeline
        const decomposed = decompose(chunk.tokens);
        const analyzed = analyzeContext(decomposed);
        const resolved = resolveScheme(
            analyzed,
            scheme as SchemeName,
            table as Record<string, ConsonantMap> | null,
        );
        wordRoman = handleSpecialTokens(resolved, scheme);

        parts.push(
            applyCapitalization(wordRoman, capitalize, forceCasing, isFirstWordChunk)
        );
        isFirstWordChunk = false;
    }

    return parts.join('');
}

// ── Debug export (new in v2) ──────────────────────────────────────────────────
export function debugRomanize(text: string, options: RomanizeOptions = {}): DebugResult {
    const {
        scheme = 'practical',
        exceptions = true,
        table = null,
        capitalize = 'none',
        segmenter,
        locale,
    } = options;

    const sanitized = sanitize(text);
    const tokens = tokenize(sanitized, { segmenter, locale });
    const decomposed = decompose(tokens);
    const context = analyzeContext(decomposed);
    const resolved = resolveScheme(
        context,
        scheme as SchemeName,
        table as Record<string, ConsonantMap> | null,
    );
    const assembled = handleSpecialTokens(resolved, scheme);

    let exceptionHit = false;
    if (exceptions) {
        const hit = exceptionDictionary.lookup(sanitized.trim());
        exceptionHit = hit !== null;
    }

    return {
        layer0_sanitized: sanitized,
        layer1_tokens: tokens,
        layer2_decomposed: decomposed,
        layer3_context: context,
        layer4_resolved: resolved,
        layer5_assembled: assembled,
        exception_hit: exceptionHit,
        final: romanize(text, options),
    };
}
