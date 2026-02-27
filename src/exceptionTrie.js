import exceptionsData from '../data/exceptions.json' with { type: 'json' };

class TrieNode {
    constructor() {
        this.children = new Map();
        this.isWordEnd = false;
        this.override = null;
    }
}

export class ExceptionTrie {
    constructor() {
        this.root = new TrieNode();
        this.buildTrie();
    }

    buildTrie() {
        for (const [tamilWord, overrideStr] of Object.entries(exceptionsData)) {
            let current = this.root;
            for (const char of tamilWord) {
                if (!current.children.has(char)) {
                    current.children.set(char, new TrieNode());
                }
                current = current.children.get(char);
            }
            current.isWordEnd = true;
            current.override = overrideStr;
        }
    }

    /**
     * Attempts to intercept an entire Tamil word via the dictionary.
     * Runs BEFORE the state machine.
     * 
     * @param {string} tamilWord - A single contiguous Tamil word.
     * @returns {string|null} - The hardcoded romanized word, or null on a miss.
     */
    lookup(tamilWord) {
        let current = this.root;
        for (const char of tamilWord) {
            if (!current.children.has(char)) {
                return null; // Immediate miss mechanism
            }
            current = current.children.get(char);
        }

        if (current.isWordEnd) {
            return current.override;
        }

        return null;
    }
}

// Singleton instances
export const exceptionDictionary = new ExceptionTrie();
