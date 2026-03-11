/**
 * Layer 0 — Sanitizer
 *
 * Produces a canonical NFC Tamil string before any linguistic processing begins.
 * Transformations applied in order:
 *  1. ZWJ / ZWNJ removal (scoped to Tamil Unicode block only)
 *  2. ஸ்ரீ canonicalization (Grantha SHA variant → SA canonical)
 *  3. Tamil numeral → Indo-Arabic digit
 *  4. NFC normalization (composes decomposed vowel signs, e.g. ெ + ா → ொ)
 */
export function sanitize(text: unknown): string {
    if (typeof text !== 'string') return '';

    return text
        // 1. Strip ZWJ (U+200D) and ZWNJ (U+200C) adjacent to Tamil block (U+0B80–U+0BFF).
        //    Scoped to Tamil only — Malayalam Chillu forms use ZWJ; a global strip would corrupt them.
        .replace(/([\u0B80-\u0BFF])[\u200C\u200D]+/g, '$1')
        .replace(/[\u200C\u200D]+([\u0B80-\u0BFF])/g, '$1')

        // 2. Canonicalize ஸ்ரீ. Two visually identical sequences exist:
        //    Variant:   U+0BB6 (ஶ, Grantha SHA) + U+0BCD + U+0BB0 + U+0BC0
        //    Canonical: U+0BB8 (ஸ, Grantha SA)  + U+0BCD + U+0BB0 + U+0BC0
        .replace(/\u0BB6\u0BCD\u0BB0\u0BC0/g, '\u0BB8\u0BCD\u0BB0\u0BC0')

        // 3. Tamil numeral → Indo-Arabic: ௦ (U+0BE6) = 0, ... ௯ (U+0BEF) = 9.
        //    Arithmetic: digit charCode − 0x0BE6 + 48 gives ASCII '0'–'9'.
        .replace(/[\u0BE6-\u0BEF]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0BE6 + 48))

        // 4. NFC normalization: resolves composite vowel signs.
        //    Critical for ொ (U+0BCA) which may arrive decomposed as U+0BC6 + U+0BBE.
        .normalize('NFC');
}
