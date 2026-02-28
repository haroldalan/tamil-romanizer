export default {
    vowels: {
        'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee',
        'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'ae',
        'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oa', 'ஔ': 'au'
    },
    consonants: {
        'க': { DEFAULT: 'k', INTERVOCALIC: 'g', POST_NASAL: 'g', GEMINATE: 'kk' },
        'ச': { DEFAULT: 's', WORD_INITIAL: 's', INTERVOCALIC: 's', POST_NASAL: 'j', GEMINATE: 'chch' },
        'ட': { DEFAULT: 't', INTERVOCALIC: 'd', POST_NASAL: 'd', GEMINATE: 'tt' },
        'த': { DEFAULT: 'th', INTERVOCALIC: 'd', POST_NASAL: 'dh', GEMINATE: 'tth' },
        'ப': { DEFAULT: 'p', INTERVOCALIC: 'b', POST_NASAL: 'b', GEMINATE: 'pp', FRICATIVE_MUTATED: 'f' },
        'ற': { DEFAULT: 'r', INTERVOCALIC: 'r', POST_NASAL: 'dr', GEMINATE: 'tr' },
        // Nasals and other consonants that change based on context or position
        'ங': { DEFAULT: 'n', WORD_INITIAL: 'ng' },
        'ஞ': { DEFAULT: 'n', WORD_INITIAL: 'gn' },
        // Strict direct mappings
        'ல': { DEFAULT: 'l' },
        'ள': { DEFAULT: 'l' }, // Often 'l' in modern names
        'ழ': { DEFAULT: 'zh' },
        'ந': { DEFAULT: 'n' },
        'ன': { DEFAULT: 'n' },
        'ண': { DEFAULT: 'n' },
        'ம': { DEFAULT: 'm' },
        'ய': { DEFAULT: 'y' },
        'ர': { DEFAULT: 'r' },
        'வ': { DEFAULT: 'v' },
        // Grantha mappings standard for practical
        'ஜ': { DEFAULT: 'j', FRICATIVE_MUTATED: 'z' },
        'ஷ': { DEFAULT: 'sh' },
        'ஸ': { DEFAULT: 's' },
        'ஹ': { DEFAULT: 'h' }
    }
};
