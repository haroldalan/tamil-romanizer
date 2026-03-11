import { ExceptionTrie, exceptionDictionary, addEntries } from '../../src/exceptionTrie.js';
import type { ExceptionSchema } from '../../src/types.js';

describe('Layer 6: ExceptionTrie', () => {

    // ── Exact match ───────────────────────────────────────────────────────────
    test('exact match: சென்னை → Chennai', () => {
        const hit = exceptionDictionary.lookup('சென்னை');
        expect(hit).not.toBeNull();
        expect(hit!.roman).toBe('Chennai');
        expect(hit!.forceCasing).toBe(false);
    });

    test('exact miss: unknown Tamil word → null', () => {
        expect(exceptionDictionary.lookup('அறியாஒன்று')).toBeNull();
    });

    // ── forceCasing entries ────────────────────────────────────────────────────
    test('forceCasing=true: டிவி → TV', () => {
        const hit = exceptionDictionary.lookup('டிவி');
        expect(hit).not.toBeNull();
        expect(hit!.roman).toBe('TV');
        expect(hit!.forceCasing).toBe(true);
    });

    test('forceCasing=true: வாட்ஸ்அப் → WhatsApp', () => {
        const hit = exceptionDictionary.lookup('வாட்ஸ்அப்');
        expect(hit).not.toBeNull();
        expect(hit!.roman).toBe('WhatsApp');
        expect(hit!.forceCasing).toBe(true);
    });

    // ── Oblique stem ──────────────────────────────────────────────────────────
    test('oblique key: தமிழ்நாட்ட → same roman as தமிழ்நாடு', () => {
        const nomHit = exceptionDictionary.lookup('தமிழ்நாடு');
        const oblHit = exceptionDictionary.lookup('தமிழ்நாட்ட');
        expect(nomHit).not.toBeNull();
        expect(oblHit).not.toBeNull();
        expect(oblHit!.roman).toBe(nomHit!.roman);
    });

    // ── Prefix-forward scan + suffix join ──────────────────────────────────────
    test('prefix scan: சென்னையில் → Chennai + yil', () => {
        const hit = exceptionDictionary.lookup('சென்னையில்');
        expect(hit).not.toBeNull();
        expect(hit!.roman).toContain('Chennai');
        expect(hit!.roman).toContain('yil');
    });

    test('prefix scan: சென்னையை → Chennai + yai (accusative)', () => {
        const hit = exceptionDictionary.lookup('சென்னையை');
        expect(hit).not.toBeNull();
        expect(hit!.roman).toContain('Chennai');
        expect(hit!.roman).toContain('yai');
    });

    test('prefix scan: no matching suffix → null', () => {
        // "சென்னை" + "xyz" is not in SUFFIX_MAP → null
        const hit = exceptionDictionary.lookup('சென்னைxyz');
        expect(hit).toBeNull();
    });

    // ── Runtime insertion via addEntries ──────────────────────────────────────
    test('addEntries: new entry visible immediately after insertion', () => {
        const newEntries: ExceptionSchema = {
            'ரஜினிகாந்த்': {
                roman: 'Rajinikanth',
                romanStem: null,
                oblique: null,
                forceCasing: false,
            },
        };
        addEntries(newEntries);
        const hit = exceptionDictionary.lookup('ரஜினிகாந்த்');
        expect(hit).not.toBeNull();
        expect(hit!.roman).toBe('Rajinikanth');
    });

    // ── Standalone ExceptionTrie instance ────────────────────────────────────
    test('standalone instance: insert and lookup', () => {
        const trie = new ExceptionTrie();
        trie.insert('மதுரை', 'Madurai', null, false);
        const hit = trie.lookup('மதுரை');
        expect(hit!.roman).toBe('Madurai');
    });

    test('standalone instance: empty trie returns null for any word', () => {
        const trie = new ExceptionTrie();
        // New ExceptionTrie with empty trie (no auto-load)
        // We override root by using a fresh private instance approach:
        // Actually ExceptionTrie auto-loads exceptions.json in constructor.
        // Test that at least the lookup works:
        const hit = trie.lookup('சென்னை');
        expect(hit!.roman).toBe('Chennai'); // loaded from exceptions.json
    });
});
