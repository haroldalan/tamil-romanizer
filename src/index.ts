/**
 * Public surface of tamil-romanizer v2.0.0
 *
 * Named exports:
 *   Functions: romanize, debugRomanize, addExceptions, registerScheme, listSchemes
 *   Types:     All pipeline stage interfaces and helper types
 */
export { romanize, debugRomanize } from './romanizer.js';
export { addExceptions, registerScheme, listSchemes } from './api.js';

export type {
    // Public API types
    RomanizeOptions,
    DebugResult,
    SchemeName,
    CapitalizeMode,
    // Exception schema
    ExceptionEntry,
    ExceptionSchema,
    // Scheme table
    SchemeTable,
    ConsonantMap,
    // Suffix table
    SuffixEntry,
    // Token pipeline stages (for tooling / debug consumers)
    RawToken,
    DecomposedToken,
    ContextToken,
    ResolvedToken,
    TokenType,
    ModifierType,
    ContextTag,
} from './types.js';
