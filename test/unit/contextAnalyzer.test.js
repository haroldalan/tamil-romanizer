import { analyzeContext, contextTags } from '../../src/contextAnalyzer.js';
import { tokenize } from '../../src/tokenizer.js';
import { decompose } from '../../src/decomposer.js';

// Helper function to run the pipeline up to Layer 3
const processToLayer3 = (text) => analyzeContext(decompose(tokenize(text)));

describe('Layer 3: Context Analyzer', () => {
    test('tags WORD_INITIAL correctly and resets Sandhi aggressively across spaces', () => {
        // Test explicitly requested by User: 
        // a ச-initial word after a ச்-final word MUST get WORD_INITIAL, not GEMINATE
        const tokens = processToLayer3('வாட்ச் சத்தம்');

        // வா(0) ட்(1) ச்(2) ' '(3) ச(4) த்(5) த(6) ம்(7)
        expect(tokens[2].base).toBe('ச');
        expect(tokens[2].contextTag).toBe(contextTags.WORD_FINAL); // end of 'வாட்ச்'

        expect(tokens[3].type).toBe('whitespace'); // The space

        expect(tokens[4].base).toBe('ச');
        expect(tokens[4].contextTag).toBe(contextTags.WORD_INITIAL); // Start of 'சத்தம்', MUST NOT BE GEMINATE
    });

    test('tags GEMINATE correctly', () => {
        const tokens = processToLayer3('சட்டம்');
        // ச(0) ட்(1) ட(2) ம்(3)
        expect(tokens[1].base).toBe('ட');
        expect(tokens[1].contextTag).toBe(contextTags.GEMINATE);

        expect(tokens[2].base).toBe('ட');
        expect(tokens[2].contextTag).toBe(contextTags.GEMINATE); // ட follows ட்
    });

    test('tags POST_NASAL correctly', () => {
        const tokens = processToLayer3('நன்றி');
        // ந(0) ன்(1) றி(2) -> ன is nasal
        expect(tokens[2].base).toBe('ற');
        expect(tokens[2].contextTag).toBe(contextTags.POST_NASAL);

        const tokens2 = processToLayer3('வண்டு');
        expect(tokens2[2].base).toBe('ட');
        expect(tokens2[2].contextTag).toBe(contextTags.POST_NASAL);
    });

    test('tags INTERVOCALIC correctly', () => {
        const tokens = processToLayer3('அறம்');
        // அ(0) ற(1) ம்(2)
        expect(tokens[1].base).toBe('ற');
        expect(tokens[1].contextTag).toBe(contextTags.INTERVOCALIC);
    });

    test('tags WORD_FINAL correctly', () => {
        const tokens = processToLayer3('பல்');
        // ப(0) ல்(1)
        expect(tokens[1].base).toBe('ல');
        expect(tokens[1].contextTag).toBe(contextTags.WORD_FINAL);

        const tokens2 = processToLayer3('அது');
        // அ(0) து(1)
        expect(tokens2[1].base).toBe('த');
        expect(tokens2[1].contextTag).toBe(contextTags.INTERVOCALIC);
    });
});
