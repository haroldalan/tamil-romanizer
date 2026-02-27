import { resolveScheme } from '../../src/schemeResolver.js';
import { analyzeContext } from '../../src/contextAnalyzer.js';
import { decompose } from '../../src/decomposer.js';
import { tokenize } from '../../src/tokenizer.js';

// Pipeline runner for tests
const processText = (text, scheme) =>
    resolveScheme(analyzeContext(decompose(tokenize(text))), scheme)
        .map(t => t.romanized).join('');

describe('Layer 4: Scheme Resolver', () => {
    describe('ISO 15919 Scheme', () => {
        test('resolves pure vowels', () => {
            expect(processText('அஆஇஈஉஊஎஏஐஒஓஔ', 'iso15919')).toBe('aāiīuūeēaioōau');
        });

        test('resolves consonants to strict ISO forms regardless of context', () => {
            // சட்டம் -> default s, but iso15919 treats 'ச' as 'c', 'ட' as 'ṭ' etc.
            // ச(ca) ட்(ṭ) ட(ṭa) ம்(m) -> caṭṭam
            expect(processText('சட்டம்', 'iso15919')).toBe('caṭṭam');

            // படம் -> paṭam
            expect(processText('படம்', 'iso15919')).toBe('paṭam');

            // அறம் -> aṟam
            expect(processText('அறம்', 'iso15919')).toBe('aṟam');
        });

        test('resolves Grantha consonants in ISO', () => {
            // ஜலக்ரீடை -> jalakrīṭai
            expect(processText('ஜலக்ரீடை', 'iso15919')).toBe('jalakrīṭai');
        });
    });

    describe('Practical Scheme', () => {
        test('resolves allophones based on context tags', () => {
            // சட்டம் -> sattam
            expect(processText('சட்டம்', 'practical')).toBe('sattam');

            // படம் -> padam (intervocalic ட -> d)
            expect(processText('படம்', 'practical')).toBe('padam');

            // அறம் -> aram (intervocalic ற -> r)
            expect(processText('அறம்', 'practical')).toBe('aram');

            // நன்றி -> nandri (post-nasal ன -> ndr)
            expect(processText('நன்றி', 'practical')).toBe('nandri');
        });

        test('resolves nasal edge cases correctly', () => {
            // ஙப்போல் -> ngappol (word-initial ங -> ng)
            expect(processText('ஙப்போல்', 'practical').startsWith('ng')).toBe(true);

            // ஞானம் -> gnanam (word-initial ஞ -> gn)
            expect(processText('ஞானம்', 'practical').startsWith('gn')).toBe(true);

            // பஞ்சம் -> panjam (ஞ post-nasal context causes ச to become j)
            expect(processText('பஞ்சம்', 'practical')).toBe('panjam');
        });
    });

    describe('Pass-through logic', () => {
        test('passes English letters, numerals, spaces untouched', () => {
            expect(processText('தமிழ் 100% pure', 'practical')).toBe('thamizh 100% pure'); // Wait! Is 'த' WORD_INITIAL 'th'? Yes. 
            // மி -> mi
            // ழ் -> zh
            // "thamizh 100% pure"
        });
    });
});
