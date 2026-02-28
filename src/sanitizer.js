/**
 * Sanitizes a raw Tamil string for tokenization.
 * Performs NFC normalization, canonicalization of specific multi-cluster sequences,
 * stripping of control characters (ZWJ/ZWNJ), and converting Tamil numerals to Indo-Arabic characters.
 *
 * @param {string} text - The raw Tamil text.
 * @returns {string} The canonicalized and normalized Tamil text.
 */
export function sanitize(text) {
    if (typeof text !== 'string') return '';

    return text
        // 1. ZWJ (U+200D) / ZWNJ (U+200C) removal ONLY when adjacent to Tamil text 
        // We match any Tamil character (U+0B80-U+0BFF) followed optionally by ZWJ/ZWNJ repeatedly
        // to strictly scope the removal and prevent corrupting Malayalam text.
        .replace(/([\u0B80-\u0BFF])[\u200C\u200D]+/g, '$1')
        .replace(/[\u200C\u200D]+([\u0B80-\u0BFF])/g, '$1')

        // 2. ஸ்ரீ (Sri) canonicalization
        // Normalize variant `ஶ்ரீ` (U+0BB6) to canonical `ஸ்ரீ` (U+0BB8)
        .replace(/\u0BB6\u0BCD\u0BB0\u0BC0/g, '\u0BB8\u0BCD\u0BB0\u0BC0')

        // 3. Convert Tamil numerals (௦-௯) to standard Indo-Arabic (0-9)
        // ௦ is U+0BE6, ௯ is U+0BEF
        .replace(/[\u0BE6-\u0BEF]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x0BE6 + 48))

        // 4. NFC Normalization
        .normalize('NFC');
}
