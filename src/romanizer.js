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

    let outputWords = [];
    // Tokenize by spaces to apply whole-word Exception Trie natively
    const words = cleanText.split(/(\s+)/);

    for (const word of words) {
        if (!word.trim()) {
            outputWords.push({ text: word, isException: false });
            continue;
        }

        // Step 2. Exception Trie Intercept
        if (exceptions) {
            const hardMatch = exceptionDictionary.lookup(word);
            if (hardMatch) {
                outputWords.push({ text: hardMatch, isException: true });
                continue;
            }
        }

        // Pipeline Execution
        const tokens = tokenize(word);
        const decomposed = decompose(tokens);
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
