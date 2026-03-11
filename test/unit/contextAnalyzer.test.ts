import { analyzeContext, contextTags } from '../../src/contextAnalyzer.js';
import { decompose } from '../../src/decomposer.js';
import { tokenize } from '../../src/tokenizer.js';

// Helper: run through Layers 1–3
const processToLayer3 = (text: string) => analyzeContext(decompose(tokenize(text)));

describe('Layer 3: Context Analyzer', () => {

    test('WORD_INITIAL: first token in a word', () => {
        const tokens = processToLayer3('க');
        expect(tokens[0].contextTag).toBe(contextTags.WORD_INITIAL);
    });

    test('WORD_INITIAL: token after whitespace', () => {
        // "வாட்ச் சத்தம்" — the ச of சத்தம் must be WORD_INITIAL not GEMINATE
        const tokens = processToLayer3('வாட்ச் சத்தம்');
        const spaceIdx = tokens.findIndex(t => t.type === 'whitespace');
        const firstAfterSpace = tokens[spaceIdx + 1];
        expect(firstAfterSpace.contextTag).toBe(contextTags.WORD_INITIAL);
    });

    test('GEMINATE: virama half and base half both tagged', () => {
        // சட்டம்: ட் (virama half) and ட (base half) are both GEMINATE
        const tokens = processToLayer3('சட்டம்');
        const virHalf = tokens.find(t => t.base === 'ட' && t.modifierType === 'virama');
        const baseHalf = tokens.find(t => t.base === 'ட' && t.modifierType !== 'virama');
        expect(virHalf?.contextTag).toBe(contextTags.GEMINATE);
        expect(baseHalf?.contextTag).toBe(contextTags.GEMINATE);
    });

    test('POST_NASAL: consonant after nasal virama', () => {
        // நன்றி: ற after ன் → POST_NASAL
        const tokens = processToLayer3('நன்றி');
        const rra = tokens.find(t => t.base === 'ற');
        expect(rra?.contextTag).toBe(contextTags.POST_NASAL);
    });

    test('POST_NASAL: ஞ triggers post-nasal (пanjam, not pansam)', () => {
        // பஞ்சம்: ச after ஞ் → POST_NASAL (CRITICAL: ஞ must be in nasals set)
        const tokens = processToLayer3('பஞ்சம்');
        const cha = tokens.find(t => t.base === 'ச' && t.contextTag === contextTags.POST_NASAL);
        expect(cha).toBeDefined();
    });

    test('POST_NASAL: ண triggers post-nasal', () => {
        // வண்டு: ட after ண் → POST_NASAL
        const tokens = processToLayer3('வண்டு');
        const ta = tokens.find(t => t.base === 'ட');
        expect(ta?.contextTag).toBe(contextTags.POST_NASAL);
    });

    test('GRANTHA_CONJUNCT_HEAD: க் before ஷ', () => {
        // பக்ஷி: க் tagged as GRANTHA_CONJUNCT_HEAD
        const tokens = processToLayer3('பக்ஷி');
        const ka = tokens.find(t => t.base === 'க' && t.modifierType === 'virama');
        expect(ka?.contextTag).toBe(contextTags.GRANTHA_CONJUNCT_HEAD);
    });

    test('GRANTHA_CONJUNCT_HEAD: ஸ் before ர (Sri)', () => {
        // ஸ்ரீ: ஸ் tagged as GRANTHA_CONJUNCT_HEAD
        const tokens = processToLayer3('ஸ்ரீ');
        const sa = tokens.find(t => t.base === 'ஸ' && t.modifierType === 'virama');
        expect(sa?.contextTag).toBe(contextTags.GRANTHA_CONJUNCT_HEAD);
    });

    test('FRICATIVE_MUTATED: ப after Āytham', () => {
        const tokens = processToLayer3('ஃபேன்');
        const pa = tokens.find(t => t.base === 'ப');
        expect(pa?.contextTag).toBe(contextTags.FRICATIVE_MUTATED);
    });

    test('INTERVOCALIC: consonant between vowel-carrying tokens', () => {
        // அறம்: ற preceded by அ (VOWEL) → INTERVOCALIC
        const tokens = processToLayer3('அறம்');
        const rra = tokens.find(t => t.base === 'ற');
        expect(rra?.contextTag).toBe(contextTags.INTERVOCALIC);
    });

    test('INTERVOCALIC rule: only preceding token matters (not following)', () => {
        // அகம்: க preceded by அ, followed by ம் (no vowel) → still INTERVOCALIC
        const tokens = processToLayer3('அகம்');
        const ka = tokens.find(t => t.base === 'க');
        expect(ka?.contextTag).toBe(contextTags.INTERVOCALIC);
    });

    test('WORD_FINAL: virama consonant at end', () => {
        // பல்: ல் at end → WORD_FINAL
        const tokens = processToLayer3('பல்');
        const last = tokens.find(t => t.base === 'ல');
        expect(last?.contextTag).toBe(contextTags.WORD_FINAL);
    });

    test('non-consonant tokens receive DEFAULT', () => {
        const tokens = processToLayer3('அ');
        expect(tokens[0].contextTag).toBe(contextTags.DEFAULT);
    });
});
