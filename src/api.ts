/**
 * Runtime extension API
 *
 * These functions allow consumers to extend the library at runtime without
 * needing to fork the package or rebuild the exception dictionary from scratch.
 */
import type { ExceptionSchema, SchemeTable, SchemeName } from './types.js';
import { exceptionDictionary } from './exceptionTrie.js';

// ── addExceptions ─────────────────────────────────────────────────────────────
/**
 * Inserts one or more exception entries into the shared trie singleton at runtime.
 * Accepts the same ExceptionSchema format as data/exceptions.json.
 *
 * @example
 * addExceptions({
 *   "ரஜினிகாந்த்": { roman: "Rajinikanth", romanStem: null, oblique: null, forceCasing: false }
 * });
 */
export function addExceptions(entries: ExceptionSchema): void {
    exceptionDictionary.loadFromSchema(entries);
}

// ── registerScheme ────────────────────────────────────────────────────────────
// Internal scheme registry (shared reference to schemeResolver's map)
// We use a module-level map that schemeResolver reads from.
// NOTE: schemeResolver.ts must import _customSchemes from this module.

/** @internal */
export const _customSchemes: Map<string, SchemeTable> = new Map();

/**
 * Registers a custom romanization scheme under a new name.
 * The name can then be passed as options.scheme to romanize().
 *
 * @example
 * registerScheme('my-scheme', {
 *   vowels: { 'அ': 'a', ... },
 *   consonants: { 'க': 'k', ... }
 * });
 */
export function registerScheme(name: string, table: SchemeTable): void {
    _customSchemes.set(name, table);
}

// ── listSchemes ───────────────────────────────────────────────────────────────
const BUILT_IN_SCHEMES: SchemeName[] = [
    'practical',
    'practical/standard',
    'practical/phonetic',
    'iso15919',
    'ala-lc',
    'alalc',
    'itrans',
];

/**
 * Returns an array of all registered scheme names (built-in + custom).
 */
export function listSchemes(): string[] {
    return [...BUILT_IN_SCHEMES, ..._customSchemes.keys()];
}
