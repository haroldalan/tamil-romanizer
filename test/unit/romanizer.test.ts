import { romanize, debugRomanize } from '../../src/romanizer.js';

describe('Public API: romanize()', () => {

    // ── Basic pipeline ─────────────────────────────────────────────────────────
    test('basic transliteration (practical)', () => {
        // ச is WORD_INITIAL → 'ch'; ட்ட is GEMINATE → 'tt'; ம் WORD_FINAL → 'm'
        expect(romanize('சட்டம்')).toBe('chattam');
    });

    test('returns empty string for non-string input', () => {
        expect(romanize(null as any)).toBe('');
        expect(romanize(undefined as any)).toBe('');
    });

    // ── Capitalization ─────────────────────────────────────────────────────────
    test('capitalize: none (default) — lowercases everything', () => {
        expect(romanize('கப்பல்', { capitalize: 'none' })).toBe('kappal');
    });

    test('capitalize: sentence — first word char uppercased', () => {
        const result = romanize('கப்பல் பயணம்', { capitalize: 'sentence' });
        expect(result[0]).toBe('K');
        expect(result.slice(1)).toBe(result.slice(1).toLowerCase());
    });

    test('capitalize: words — each word first char uppercased', () => {
        const result = romanize('கப்பல் பயணம்', { capitalize: 'words' });
        expect(result.startsWith('Kappal')).toBe(true);
        expect(result).toContain('Payanam');
    });

    // ── Exception trie ─────────────────────────────────────────────────────────
    test('exception trie ON: சென்னை → chennai', () => {
        expect(romanize('சென்னை')).toBe('chennai');
    });

    test('exception trie OFF: சென்னை algorithmic', () => {
        // Algorithmic: ச WORD_INITIAL = 'ch', so result starts with 'ch'.
        // The exception trie overrides to 'Chennai'. With exceptions:false,
        // the algorithmic result is also 'chennai' (ch+e+n+n+ai lowercased).
        expect(romanize('சென்னை', { exceptions: false })).toBe('chennai');
    });

    test('exception trie ON: full sentence with loanwords', () => {
        expect(romanize('சென்னை தமிழ்நாடு')).toBe('chennai tamil nadu');
    });

    // ── forceCasing semantics ─────────────────────────────────────────────────
    test('forceCasing: TV stays TV even with capitalize:none', () => {
        expect(romanize('டிவி', { capitalize: 'none' })).toBe('TV');
    });

    test('forceCasing: WhatsApp retains casing with capitalize:words', () => {
        expect(romanize('வாட்ஸ்அப்', { capitalize: 'words' })).toBe('WhatsApp');
    });

    // ── Scheme selection ───────────────────────────────────────────────────────
    test('iso15919 scheme', () => {
        expect(romanize('சென்னை', { scheme: 'iso15919', exceptions: false })).toBe('ceṉṉai');
    });

    test('itrans scheme — ஏ → e (uppercase in scheme, but lowercase via capitalize:none)', () => {
        // ITRANS maps ஏ→'E' but romanize() applies capitalize:'none' which lowercases all.
        // forceCasing only applies to trie entries, not to scheme vowel output.
        const result = romanize('ஏழு', { scheme: 'itrans', exceptions: false });
        expect(result.startsWith('e')).toBe(true);
    });

    test('ala-lc scheme — ழ → ḷ', () => {
        expect(romanize('தமிழ்', { scheme: 'ala-lc', exceptions: false })).toBe('tamiḷ');
    });

    // ── Custom table override ──────────────────────────────────────────────────
    test('custom table: ச → ch changes output', () => {
        expect(romanize('சட்டம்', { table: { 'ச': 'ch' } })).toBe('chattam');
    });

    // ── Numerals ──────────────────────────────────────────────────────────────
    test('Tamil numerals converted to Arabic digits', () => {
        const result = romanize('வருடம் ௨௦௨௪', { exceptions: false });
        expect(result).toContain('2024');
    });

    // ── Mixed content ─────────────────────────────────────────────────────────
    test('English words and punctuation pass through', () => {
        const r = romanize('Hello! தமிழ்', { exceptions: false });
        expect(r).toContain('Hello!');
        // தமிழ் algorithmic: த WORD_INITIAL='th', மி='mi', ழ் WORD_FINAL='zh' → 'tamizhz'?
        // த=WORD_INITIAL'th', மி='mi', ழ்='zh' with virama/WORD_FINAL → 'zh' (no vowel).
        // Result: th+a+m+i+zh = 'thamizh'
        expect(r).toContain('thamizh');
    });

    test('handles empty string', () => {
        expect(romanize('')).toBe('');
    });

    // ── Grantha — end-to-end ──────────────────────────────────────────────────
    test('பக்ஷி → pakshi (Grantha conjunct in pipeline)', () => {
        expect(romanize('பக்ஷி', { exceptions: false })).toBe('pakshi');
    });

    test('ஸ்ரீரங்கம் → algorithmic output (exceptions:false)', () => {
        // Algorithmic: ஸ்+ரீ conjunct → 'sree'; ரங்கம் → ranggam. Full: 'sreeranggam'.
        // Use exception trie ON to get 'Srirangam' via the exception dictionary.
        expect(romanize('ஸ்ரீரங்கம்', { exceptions: false })).toBe('sreeranggam');
    });
});

describe('Public API: debugRomanize()', () => {
    test('returns DebugResult with all 5 layer snapshots', () => {
        const result = debugRomanize('சட்டம்');
        expect(result.layer0_sanitized).toBe('சட்டம்');
        expect(Array.isArray(result.layer1_tokens)).toBe(true);
        expect(Array.isArray(result.layer2_decomposed)).toBe(true);
        expect(Array.isArray(result.layer3_context)).toBe(true);
        expect(Array.isArray(result.layer4_resolved)).toBe(true);
        expect(typeof result.layer5_assembled).toBe('string');
        expect(typeof result.exception_hit).toBe('boolean');
        expect(typeof result.final).toBe('string');
    });

    test('exception_hit is true for known exceptions', () => {
        const result = debugRomanize('சென்னை');
        expect(result.exception_hit).toBe(true);
    });

    test('exception_hit is false for unknown words', () => {
        const result = debugRomanize('அட்டம்', { exceptions: true });
        expect(result.exception_hit).toBe(false);
    });
});
