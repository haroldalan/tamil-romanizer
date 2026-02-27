import { romanize } from '../../src/romanizer.js';

describe('Benchmark: ISO 15919 Algorithmic Logic (Exhaustive Coverage)', () => {

    const isoVowels = {
        'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī',
        'உ': 'u', 'ஊ': 'ū', 'எ': 'e', 'ஏ': 'ē',
        'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'ō', 'ஔ': 'au'
    };

    const isoConsonants = {
        'க': 'k', 'ங': 'ṅ', 'ச': 'c', 'ஞ': 'ñ',
        'ட': 'ṭ', 'ண': 'ṇ', 'த': 't', 'ந': 'n',
        'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r',
        'ல': 'l', 'வ': 'v', 'ழ': 'ḻ', 'ள': 'ḷ',
        'ற': 'ṟ', 'ன': 'ṉ'
    };

    const isoGrantha = {
        'ஜ': 'j', 'ஷ': 'ṣ', 'ஸ': 's', 'ஹ': 'h',
        'க்ஷ': 'kṣ', 'ஸ்ரீ': 'srī'
    };

    test('Achieves 100% CER mapping for all 12 vowels', () => {
        for (const [v, expected] of Object.entries(isoVowels)) {
            const result = romanize(v, { scheme: 'iso15919', exceptions: false, capitalize: 'none' });
            expect(result).toBe(expected);
        }
    });

    test('Achieves 100% CER mapping for all 18 bare consonants with inherent a', () => {
        for (const [c, expectedBase] of Object.entries(isoConsonants)) {
            const result = romanize(c, { scheme: 'iso15919', exceptions: false, capitalize: 'none' });
            expect(result).toBe(expectedBase + 'a');
        }
    });

    test('Achieves 100% CER mapping for all 18 pure virama consonants', () => {
        for (const [c, expectedBase] of Object.entries(isoConsonants)) {
            const viramaC = c + '்';
            const result = romanize(viramaC, { scheme: 'iso15919', exceptions: false, capitalize: 'none' });
            expect(result).toBe(expectedBase);
        }
    });

    test('Achieves 100% CER mapping for Grantha characters', () => {
        for (const [g, expected] of Object.entries(isoGrantha)) {
            // ISO 15919 Grantha bases: 'ஜ', 'ஷ', 'ஸ', 'ஹ' get inherent 'a' because they are pure consonants lacking a virama.
            // Ligatures like 'க்ஷ' internally parse as 'க்' + 'ஷ', which means the final 'ஷ' ALSO gets an inherent 'a'!
            // 'ஸ்ரீ' parses as 'ஸ்' + 'ரீ'. Since 'ரீ' has a vowel sign (ீ), it does NOT get an inherent 'a'.
            let expectedStr = expected;
            if (g === 'ஸ்ரீ') expectedStr = expected; // srī
            else if (g === 'க்ஷ') expectedStr = expected + 'a'; // kṣa
            else expectedStr = expected + 'a'; // ja, ṣa, sa, ha

            const result = romanize(g, { scheme: 'iso15919', exceptions: false, capitalize: 'none' });
            expect(result).toBe(expectedStr);
        }
    });

    test('Achieves 100% CER mapping for Aytham / Akh', () => {
        const result = romanize('ஃ', { scheme: 'iso15919', exceptions: false, capitalize: 'none' });
        expect(result).toBe('ḵ');
    });
});
