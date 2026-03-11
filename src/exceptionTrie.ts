/**
 * Layer 6 — Exception Trie
 *
 * A prefix-tree dictionary for Tamil words whose romanization cannot be
 * derived algorithmically (proper nouns, loanwords, brand names).
 *
 * v2 architecture — three major changes from v1:
 *
 *  1. New ExceptionEntry schema
 *     Each entry now has: roman, romanStem, oblique, forceCasing.
 *     - roman:       The canonical romanized form (e.g. "Chennai")
 *     - romanStem:   Joining form for suffix attachment (null → use roman)
 *     - oblique:     Sandhi-mutated stem key (e.g. "தமிழ்நாட்ட" for "Tamil Nadu").
 *                    Inserted into the trie as a second entry pointing to roman same roman.
 *     - forceCasing: If true, global capitalize option is bypassed. Used for
 *                    abbreviations and brand names (TV, WhatsApp, YouTube).
 *
 *  2. Prefix-forward greedy scan with O(1) suffix lookup
 *     Instead of exact-word-only matching, the lookup now:
 *       Pass 1: Attempts an exact match first (O(m)).
 *       Pass 2: Walks the trie as a prefix scanner. At each word-boundary node,
 *               looks up the remainder in SUFFIX_MAP (O(1)).
 *               Stores every valid (prefix, suffix) candidate encountered.
 *               Returns the LAST (longest-prefix, leftmost-suffix) candidate.
 *     This implements longest-prefix-wins semantics without backtracking.
 *
 *  3. Longest-prefix wins
 *     "சென்னையில்" finds prefix "சென்னை" (roman="Chennai") + suffix "யில்"
 *     (roman="yil") → "Chennaiyil". A shorter prefix like "சென்" (if it were
 *     in the trie) would not win because the walk continues past it.
 *
 * The addEntries() method allows runtime insertion without a full trie rebuild.
 */
import type { ExceptionEntry, ExceptionSchema } from './types.js';
import { SUFFIX_MAP } from './data/suffixes.js';
import exceptionsData from '../data/exceptions.json' assert { type: 'json' };

// ── TrieNode ──────────────────────────────────────────────────────────────────
class TrieNode {
    children = new Map<string, TrieNode>();
    isWordEnd = false;
    roman: string | null = null;
    romanStem: string | null = null;
    forceCasing: boolean = false;
}

// ── Lookup result ─────────────────────────────────────────────────────────────
export interface TrieHit {
    roman: string;
    forceCasing: boolean;
}

// ── ExceptionTrie class ───────────────────────────────────────────────────────
export class ExceptionTrie {
    private readonly root = new TrieNode();

    constructor() {
        this.loadFromSchema(exceptionsData as ExceptionSchema);
    }

    // ── Insert a single entry ─────────────────────────────────────────────────
    insert(tamilWord: string, roman: string, romanStem: string | null, forceCasing: boolean): void {
        let current = this.root;
        for (const ch of tamilWord) {
            if (!current.children.has(ch)) {
                current.children.set(ch, new TrieNode());
            }
            current = current.children.get(ch)!;
        }
        current.isWordEnd = true;
        current.roman = roman;
        current.romanStem = romanStem;
        current.forceCasing = forceCasing;
    }

    // ── Bulk load from exceptions.json schema ─────────────────────────────────
    loadFromSchema(schema: ExceptionSchema): void {
        for (const [tamilWord, entry] of Object.entries(schema)) {
            this.insert(tamilWord, entry.roman, entry.romanStem, entry.forceCasing);
            // Insert oblique stem as a secondary key pointing to same roman output
            if (entry.oblique) {
                this.insert(entry.oblique, entry.roman, entry.romanStem, entry.forceCasing);
            }
        }
    }

    // ── Main lookup ───────────────────────────────────────────────────────────
    lookup(word: string): TrieHit | null {

        // Pass 1: Exact match
        // Walk the trie character by character. If we reach a word-end node
        // after exhausting the entire input, return its stored override.
        {
            let node = this.root;
            let miss = false;
            for (const ch of word) {
                const next = node.children.get(ch);
                if (!next) { miss = true; break; }
                node = next;
            }
            if (!miss && node.isWordEnd && node.roman !== null) {
                return { roman: node.roman, forceCasing: node.forceCasing };
            }
        }

        // Pass 2: Prefix-forward greedy scan with O(1) suffix lookup
        // Walk the trie tracking character index. At each word-boundary node,
        // check if the REMAINING input (word[charIdx+1 ..]) exists in SUFFIX_MAP.
        // We collect all valid candidates and return the last one (longest prefix).
        {
            let node = this.root;
            let candidate: TrieHit | null = null;
            let charIdx = 0;
            const chars = [...word]; // spread for correct Unicode iteration

            for (const ch of chars) {
                const next = node.children.get(ch);
                if (!next) break; // No path for this character — stop walking
                node = next;
                charIdx++;

                if (node.isWordEnd && node.roman !== null) {
                    const remainder = chars.slice(charIdx).join('');
                    if (remainder.length > 0) {
                        const suffixRoman = SUFFIX_MAP.get(remainder);
                        if (suffixRoman !== undefined) {
                            // Valid candidate: stem + suffix
                            const stem = node.romanStem ?? node.roman;
                            candidate = {
                                roman: stem + suffixRoman,
                                forceCasing: node.forceCasing,
                            };
                            // Do NOT return yet — keep walking for a longer prefix
                        }
                    }
                }
            }

            return candidate; // null if no valid prefix+suffix pair found
        }
    }
}

// ── Singleton export ──────────────────────────────────────────────────────────
// Built once at module load. All romanize() calls share this instance.
// Use addEntries() / exceptionDictionary.insert() for runtime insertion.
export const exceptionDictionary = new ExceptionTrie();

// ── Runtime extension helper ──────────────────────────────────────────────────
export function addEntries(entries: ExceptionSchema): void {
    exceptionDictionary.loadFromSchema(entries);
}
