# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-12

This is a major release — a complete TypeScript rewrite with a fundamentally new exception architecture and several new schemes.

### Added
- **TypeScript**: Full rewrite with exported type contracts (`types.ts`). All pipeline stage interfaces (`RawToken`, `DecomposedToken`, `ContextToken`, `ResolvedToken`) are publicly exported.
- **Prefix-forward Exception Trie**: The exception lookup now walks the trie as a prefix scanner and joins the remainder to `SUFFIX_MAP` entries (O(1)). This means inflected proper nouns like `சென்னையில்` are correctly resolved to `Chennaiyil` without needing a separate dictionary entry for every inflected form.
- **New `ExceptionEntry` schema**: Each entry in `data/exceptions.json` now carries `roman`, `romanStem`, `oblique`, and `forceCasing` fields (replaces flat string values).
- **`forceCasing` flag**: Exception entries marked `forceCasing: true` (e.g. `டிவி` → `TV`, `வாட்ஸ்அப்` → `WhatsApp`) bypass the global `capitalize` option and are emitted verbatim.
- **Oblique stem keys**: Exception entries with an `oblique` field (e.g. `தமிழ்நாட்ட` for `தமிழ்நாடு`) are inserted as secondary trie keys, enabling sandhi-mutated lookup without a real morphological engine.
- **ITRANS scheme** (`'itrans'`): South Indian ITRANS per Aksharamukha/LibIndic standard. Key conventions: `ஏ → E`, `ஓ → O` (uppercase), `ங → N^`, `ஞ → JN`, `ள → L`, `ற → rr`.
- **`practical/phonetic` scheme**: Phonetically strict variant of the practical scheme, optimized for Aksharantar WER benchmarking. Differences: `ட` POST_NASAL → `nd`, `த` INTERVOCALIC → `dh`.
- **`GRANTHA_CONJUNCT_HEAD` context tag (Layer 3)**: Detects Sanskrit conjunct pairs in-pipeline (`க்+ஷ`, `க்+ஸ`, `ஸ்+ர`, `ஸ்+த`) and tags the head token. Replaces the fragile Layer 5 regex.
- **Grantha conjunct resolution (Layer 4)**: `GRANTHA_CONJUNCT_TABLE` maps conjuncts per scheme (`pakshi → ksh`, ISO `kṣ`). The `i += 2` while-loop consumes both tokens as one unit.
- **`debugRomanize(text, options?): DebugResult`**: Returns all 8 pipeline layer snapshots for diagnostics (`layer0_sanitized` through `layer5_assembled`, `exception_hit`, `final`).
- **`addExceptions(schema): void`**: Runtime trie extension without rebuild.
- **`registerScheme(name, table): void`**: Register a completely custom romanization table. Available immediately as `options.scheme`.
- **`listSchemes(): string[]`**: Enumerate all registered scheme names.
- **`segmenter` / `locale` injection**: Pass a custom `Intl.Segmenter` or locale string for Web Worker / SSR isolation.
- **`SUFFIX_TABLE` + `SUFFIX_MAP`** (`src/data/suffixes.ts`): 38 Tamil case suffixes and sariyai (inflectional increments), sorted longest-first. `SUFFIX_MAP` is a derived `Map<string, string>` for O(1) remainder lookups.
- **`ROADMAP.md`**: Documents the v3 deromanization plan (Viterbi / character-level Transformer).
- **`.github/workflows/ci.yml`**: CI across Node 18, 20, and 22. Includes a WER gate slot for `practical/phonetic` on Aksharantar.
- **`test/corpus/aksharantar_eval.ts`**: Aksharantar WER gate skeleton for the `practical/phonetic` variant.

### Changed
- `applyCapitalization()` is now called **per word chunk** (not on the final assembled string). This is the only way `forceCasing` can correctly override at the chunk level before joining.
- `data/exceptions.json` schema changed from flat `{ "word": "Roman" }` to `{ "word": { roman, romanStem, oblique, forceCasing } }`.
- `dist/` exports now use `index.js` (ESM) and `index.cjs` (CJS). The old `index.mjs` filename is retired.
- All old v1 `.js` source files removed (replaced by `.ts`).

### Breaking Changes
- `exceptions.json` schema incompatible with v1. Any custom exception files must be migrated to the `ExceptionEntry` format.
- `dist/index.mjs` no longer exists — update any `import` paths to `dist/index.js`.
- Schemes `'ala-lc'` and `'alalc'` now diverge from ISO 15919 on `ழ` (`ḻ` in ISO → `ḷ` in ALA-LC per the 2012 tables). This was always the correct behavior but was not implemented in v1.

---

## [1.0.2] - 2026-02-28

### Fixed
- Fixed demo GIF not rendering on NPM by updating README to use an absolute raw GitHub URL.

## [1.0.1] - 2026-02-28

### Changed
- **Layer 1 Structure:** Refined tokenizer types. Replaced monolithic `OTHER` with explicit `WHITESPACE`, `PUNCTUATION`, `NUMERAL`, and `AYTHAM`.
- **Layer 3 Intervocalic Rule:** Consonants now correctly identified as INTERVOCALIC if preceded by a vowel-carrying token and not carrying a VIRAMA themselves.
- **Layer 3 Fricative Rule:** Āytham handling shifted to Layer 3 — `ப` and `ஜ` tagged `FRICATIVE_MUTATED` when following `ஃ`.
- **Scheme Mappings (`practical.js`):** Updated `POST_NASAL` allophone for `த` from `d` to `dh`. Added `f` and `z` for `FRICATIVE_MUTATED`.
- **Pipeline Execution:** Tokenizer now runs on the entire string before the exception trie, enabling safe punctuation-bounded word chunk interception.
- **Exception Dictionary:** Overhauled with curated top-frequency geographic proper nouns and standard English loanwords.

### Fixed
- Fixed improper regex mutations in `handleSpecialTokens()`.
- Scoped ZWJ/ZWNJ stripping strictly to the Tamil Unicode block.
