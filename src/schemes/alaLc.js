import iso15919 from './iso15919.js';

// ALA-LC for Tamil is nearly identical to ISO 15919
// Known delta: ISO 'ē' / 'ō' vs ALA-LC 'e' / 'o' without macron (sometimes) 
// but standard ALA-LC does use macrons for long vowels.
// A common difference is that ISO uses ṟ for ற, while ALA-LC uses ṟ.
// ISO uses ṉ for ன, ALA-LC also uses ṉ.
// We will export a cloned variant of iso15919.

const alaLc = {
    vowels: { ...iso15919.vowels },
    consonants: { ...iso15919.consonants }
};

export default alaLc;
