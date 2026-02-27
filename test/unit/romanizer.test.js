import { romanize } from '../../src/romanizer.js';

describe('Public API: romanize', () => {
    test('handles basic transliteration', () => {
        expect(romanize('சட்டம்')).toBe('sattam');
    });

    test('applies capitalization rules', () => {
        const text = 'கப்பல் சென்னை பயணம்';

        // none
        expect(romanize(text)).toBe('kappal chennai payanam');

        // sentence
        expect(romanize(text, { capitalize: 'sentence' })).toBe('Kappal chennai payanam');

        // words
        expect(romanize(text, { capitalize: 'words' })).toBe('Kappal Chennai Payanam');
    });

    test('intercepts exception trie correctly', () => {
        // Both 'சென்னை' and 'தமிழ்நாடு' are in the trie.
        const text = 'சென்னை தமிழ்நாடு பயணம்';

        // Exception enabled by default
        expect(romanize(text)).toBe('chennai tamil nadu payanam');

        // Exception disabled
        expect(romanize(text, { exceptions: false })).toBe('sennai thamizhnaadu payanam');
    });

    test('handles config scheme overrides', () => {
        const text = 'சென்னை';

        // using iso15919
        expect(romanize(text, { scheme: 'iso15919', exceptions: false })).toBe('ceṉṉai');

        // using custom override table 
        const custom = {
            'ச': 'ch' // override default 's'
        };
        expect(romanize('சட்டம்', { table: custom })).toBe('chattam');
        // wait, if I override 'ச', does it completely replace the object or merge?
        // My romanize loop does: `customTable[token.base] || scheme.consonants[token.base]`.
        // So 'ch' overrides completely! Since 'ch' is a string, it becomes strict ISO style format for 'ச'.
    });

    test('handles native Tamil numerals', () => {
        expect(romanize('வருடம் ௨௦௨௪')).toBe('varudam 2024');
    });
});
