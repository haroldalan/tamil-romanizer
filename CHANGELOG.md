# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-02-28

### Fixed
- Fixed demo GIF not rendering on NPM by updating README to use an absolute raw GitHub URL.

## [1.0.1] - 2026-02-28

### Changed
- **Layer 1 Structure:** Refined tokenizer types. Replaced monolithic `OTHER` with explicit `WHITESPACE`, `PUNCTUATION`, `NUMERAL`, and `AYTHAM`. This protects spacing and structural markers natively.
- **Layer 3 Intervocalic Rule:** Corrected phonetic logic. Consonants are now correctly identified as INTERVOCALIC if preceded by a vowel-carrying token and not carrying a VIRAMA modifier themselves, natively handling explicit vowel signs.
- **Layer 3 Fricative Rule:** Shifted Āytham handling context up to Layer 3 natively tagging `ப` and `ஜ` with `FRICATIVE_MUTATED` when immediately following an `AYTHAM` token.
- **Scheme Mappings (`practical.js`):** 
  - Updated the standard `POST_NASAL` allophone for `த` from `d` to `dh` (e.g., *pandhu*).
  - Explicitly defined `f` and `z` responses for the new `FRICATIVE_MUTATED` context natively in the dictionary.
- **Pipeline Execution:** Reordered the execution topology in `romanizer.js`. The Tokenizer now runs on the entire string *before* the Exception Trie. This allows the Trie to safely intercept punctuation-bounded word chunks (e.g., `"சென்னை,"`) without failing absolute string comparisons.
- **Exception Dictionary (`exceptions.json`):** Overhauled the default exception dictionary. Removed non-romanization translational entries and populated it with a curated, data-driven list of top-frequency geographic proper nouns and standard English loanwords based on a 10K Wikipedia corpus analysis.

### Fixed
- Fixed improper regex mutations in `handleSpecialTokens()` that parsed strings directly instead of analyzing phonetic markers, which could cause accidental overwriting.
- Ensured automated tests and benchmarks (ISO Algorithmic and Practical) reflect the new token types and word boundary behavior correctly.
- Scoped ZWJ/ZWNJ stripping in Layer 0 strictly to avoid stripping these markers indiscriminately and possibly corrupting other language texts in multi-lingual streams.
