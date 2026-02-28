import { sanitize } from './sanitizer.js';
import { tokenize } from './tokenizer.js';
import { decompose } from './decomposer.js';
import { analyzeContext } from './contextAnalyzer.js';
import { resolveScheme } from './schemeResolver.js';
import { handleSpecialTokens } from './specialTokens.js';
import { exceptionDictionary } from './exceptionTrie.js';

/**
 * Apply capitalization rules.
 */
function applyCapitalization(text, format) {
    if (!text) return '';
    if (format === 'words') {
        return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    if (format === 'sentence') {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    // 'none'
    return text.toLowerCase();
}

/**
 * The public Tamil Romanizer API.
 * 
 * @param {string} text - The raw Tamil string to transliterate.
 * @param {Object} options - Configuration options.
 * @param {string} [options.scheme='practical'] - 'practical', 'iso15919', 'alaLc'
 * @param {boolean} [options.exceptions=true] - Whether to use the Exception Trie for known words.
 * @param {Object} [options.table=null] - Custom map to override specific consonant derivations.
 * @param {string} [options.capitalize='none'] - Capitalization strategy ('none', 'sentence', 'words').
 * @returns {string} The fully romanized text.
 */
export function romanize(text, options = {}) {
    const {
        scheme = 'practical',
        exceptions = true,
        table = null,
        capitalize = 'none'
    } = options;

    if (typeof text !== 'string') return '';

    // 1. Sanitize text natively
    const cleanText = sanitize(text);
    if (!cleanText) return '';

    // Tokenize the ENTIRE string first. This fixes punctuation and spaces breaking the Trie.
    const allTokens = tokenize(cleanText);

    // We group tokens into "words" bounded by whitespace and punctuation.
    // E.g., "சென்னை," -> word chunk: "சென்னை", punctuation chunk: ","
    const chunks = [];
    let currentChunk = [];

    for (const token of allTokens) {
        if (token.type === 'whitespace' || token.type === 'punctuation' || token.type === 'other') {
            if (currentChunk.length > 0) {
                chunks.push({ type: 'word', tokens: currentChunk });
                currentChunk = [];
            }
            chunks.push({ type: 'separator', tokens: [token] });
        } else {
            currentChunk.push(token);
        }
    }
    if (currentChunk.length > 0) {
        chunks.push({ type: 'word', tokens: currentChunk });
    }

    let outputWords = [];

    for (const chunk of chunks) {
        if (chunk.type === 'separator') {
            outputWords.push({ text: chunk.tokens[0].text, isException: false });
            continue;
        }

        // Reconstruct the raw text of the Tamil word for Trie lookup
        const wordText = chunk.tokens.map(t => t.text).join('');

        // Step 2. Exception Trie Intercept (Right after Layer 1 chunking)
        if (exceptions) {
            const hardMatch = exceptionDictionary.lookup(wordText);
            if (hardMatch) {
                outputWords.push({ text: hardMatch, isException: true });
                continue; // Bypass Layers 2-5 for this chunk completely
            }
        }

        // Pipeline Execution for non-exception clusters
        const decomposed = decompose(chunk.tokens);
        const analyzed = analyzeContext(decomposed);
        const resolved = resolveScheme(analyzed, scheme, table);
        const finalizedWord = handleSpecialTokens(resolved, scheme);

        outputWords.push({ text: finalizedWord, isException: false });
    }

    // Instead of a blind lowercase over the whole string,
    // we apply lowercase *only* to algorithmically generated words if format is 'none'.
    // We assemble the string carefully.

    if (capitalize === 'none') {
        return outputWords.map(w => w.text).join('').toLowerCase();
    }

    // For 'sentence' or 'words', we apply the standard transform 
    // since the user explicitly requested global casing rules.
    const resultString = outputWords.map(w => w.text).join('');
    return applyCapitalization(resultString, capitalize);
}
