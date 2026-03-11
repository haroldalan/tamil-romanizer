/**
 * ITRANS — Indian Language TRANSliteration
 * Tamil implementation per Aksharamukha / LibIndic South Indian convention.
 *
 * Context-blind (like ISO 15919): every character maps to exactly one string.
 * Key South Indian ITRANS conventions:
 *   - Long E (ஏ) → 'E' (uppercase) to distinguish from short e (எ) → 'e'
 *   - Long O (ஓ) → 'O' (uppercase) to distinguish from short o (ஒ) → 'o'
 *   - Long I (ஈ) → 'ii'  (not 'I' — avoid shift-key ambiguity)
 *   - Long U (ஊ) → 'uu'
 *   - ங → 'N^' (South Indian caret convention for velar nasal)
 *   - ன and ந both map to 'n' — documented ambiguity inherent to ITRANS Tamil;
 *     not a bug. ISO 15919 preserves this via ṉ vs n.
 *   - ழ → 'zh' (unique to Tamil ITRANS)
 *   - ள → 'L' (uppercase, South Indian convention)
 *   - ற → 'rr' (South Indian convention for the alveolar trill)
 */
import type { SchemeTable } from '../types.js';

export const ITRANS: SchemeTable = {
    vowels: {
        'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ii',
        'உ': 'u', 'ஊ': 'uu', 'எ': 'e', 'ஏ': 'E',
        'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'O', 'ஔ': 'au',
    },
    consonants: {
        // Native Tamil — 18 consonants
        'க': 'k', 'ங': 'N^', 'ச': 'ch', 'ஞ': 'JN',
        'ட': 'T', 'ண': 'N', 'த': 'th', 'ந': 'n',
        'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r',
        'ல': 'l', 'வ': 'v', 'ழ': 'zh', 'ள': 'L',
        'ற': 'rr', 'ன': 'n',
        // Grantha consonants
        'ஜ': 'j', 'ஷ': 'sh', 'ஸ': 's', 'ஹ': 'h',
    },
};

export default ITRANS;
