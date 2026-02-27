import { handleSpecialTokens } from '../../src/specialTokens.js';
import { resolveScheme } from '../../src/schemeResolver.js';
import { analyzeContext } from '../../src/contextAnalyzer.js';
import { decompose } from '../../src/decomposer.js';
import { tokenize } from '../../src/tokenizer.js';

const processPipeline = (text, scheme) =>
    handleSpecialTokens(resolveScheme(analyzeContext(decompose(tokenize(text))), scheme), scheme);

describe('Layer 5: Special Token Handler', () => {
    describe('Practical Scheme', () => {
        test('handles all 3 Āytham practical variant derivations', () => {
            // Variant 1: ஃ + ப = f
            expect(processPipeline('ஃபேன்', 'practical')).toBe('faen');

            // Variant 2: ஃ + ஜ = z
            expect(processPipeline('ஃஜ', 'practical')).toBe('za'); // ஜ inherent 'a'

            // Variant 3: Standalone ஃ = dropped silently in practical
            expect(processPipeline('ஃ', 'practical')).toBe('');
        });

        test('handles Grantha sequence cleanup', () => {
            // க்ஷ -> ksh in practical
            expect(processPipeline('பக்ஷி', 'practical')).toBe('pakshi');

            // ஸ்ரீ -> sri in practical
            expect(processPipeline('ஸ்ரீரங்கம்', 'practical')).toBe('srirangam');
        });
    });

    describe('ISO 15919 Scheme', () => {
        test('does not modify grantha sequences post-resolution', () => {
            // க்ஷ -> kṣ natively
            expect(processPipeline('பக்ஷி', 'iso15919')).toBe('pakṣi');

            // ஸ்ரீ -> srī natively
            expect(processPipeline('ஸ்ரீரங்கம்', 'iso15919')).toBe('srīraṅkam');
        });

        test('handles Āytham', () => {
            expect(processPipeline('எஃகு', 'iso15919')).toBe('eḵku');
        });
    });
});
