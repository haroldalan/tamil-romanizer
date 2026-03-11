/**
 * ALA-LC — American Library Association / Library of Congress
 * Romanization for Tamil (based on ALA-LC Romanization Tables, 2012 ed.)
 *
 * Nearly identical to ISO 15919 for Tamil, with one documented divergence:
 *   ழ: ISO 15919 → 'ḻ' (l with line below)
 *       ALA-LC    → 'ḷ' (l with dot below) — same glyph as ள in ISO!
 *
 * This divergence is real and documented in ALA-LC Table p.55 (Tamil).
 * We implement it faithfully. Consumers needing ழ ≠ ள distinction must use iso15919.
 *
 * All other mappings are identical to ISO 15919.
 */
import type { SchemeTable } from '../types.js';
import { ISO15919 } from './iso15919.js';

export const ALA_LC: SchemeTable = {
    vowels: { ...ISO15919.vowels },
    consonants: {
        ...ISO15919.consonants,
        'ழ': 'ḷ',  // ALA-LC uses ḷ (dot-below) for ழ, diverging from ISO's ḻ (line-below)
    },
};

export default ALA_LC;
