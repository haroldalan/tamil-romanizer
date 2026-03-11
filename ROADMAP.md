# tamil-romanizer Roadmap

## v2.0.0 — Released ✅

- TypeScript rewrite with full type contracts
- Prefix-forward Exception Trie with prefix+suffix agglutination
- `GRANTHA_CONJUNCT_HEAD` in-pipeline resolution (replaces Layer 5 regex)
- `practical/phonetic` variant for Aksharantar WER benchmarking
- ITRANS scheme (Aksharamukha South Indian standard)
- ALA-LC scheme (Library of Congress 2012)
- `forceCasing` for proper nouns / brand names
- Runtime extension API: `addExceptions()`, `registerScheme()`, `listSchemes()`
- `debugRomanize()` for pipeline transparency

## v2.1.0 — Planned

- Expand `exceptions.json` to 250+ entries (districts, brands, loanwords)
- Aksharantar WER CI gate for `practical/phonetic`
- Suffix table expansion (verb conjugations, post-positions)
- npm publish final

## v3.0.0 — Deromanization (Deferred)

`deromanize(roman: string): string` requires probabilistic disambiguation
because Latin is many-to-one for Tamil phonemes:

- `'n'` → ந (dental nasal) / ன (alveolar nasal) / ண (retroflex nasal)
- `'l'` → ல (lateral) / ள (retroflex lateral)
- `'r'` → ர (flap) / ற (trill)

A rule-based reverse map produces incorrect output on ~40% of ambiguous
consonants without positional context. The planned approach is a
**character-level trigram language model** or a **Viterbi decoder** trained
on a Tamil–Latin aligned corpus (Aksharantar is the natural training
source). This is architecturally a separate module and will not share the
forward pipeline.

A small **Transformer encoder** (BERT-style character model, ~2M params)
could handle the full disambiguation task including sandhi boundary
detection, but requires a labelled corpus. This justifies the v3 deferral.

Planned for v3.0.0.
