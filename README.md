# tamil-romanizer

> **Context-aware Tamil-to-English romanization for Node.js and the browser.**  
> Produces natural, readable Tanglish — not a naive character swap.

[![npm version](https://img.shields.io/npm/v/tamil-romanizer)](https://www.npmjs.com/package/tamil-romanizer) [![CI](https://github.com/haroldalan/tamil-romanizer/actions/workflows/ci.yml/badge.svg)](https://github.com/haroldalan/tamil-romanizer/actions) [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## The problem

Every Tamil transliteration script you've tried probably produced garbage like `cinkam` for `சிங்கம்` (lion). That's because Tamil consonants change their sound based on where they appear in a word — a fact that a simple character table can never capture.

`tamil-romanizer` solves this properly.

```bash
npm install tamil-romanizer
```

---

## Quick look

```js
import { romanize } from 'tamil-romanizer';

romanize('சிங்கம்');              // 'singam'       ✓ post-nasal 'g', not 'k'
romanize('பம்பரம்');             // 'pambaram'     ✓ intervocalic 'b', not 'p'
romanize('சட்டம்');              // 'chattam'      ✓ geminate 'tt', not 't'
romanize('சென்னை');             // 'chennai'      ✓ from exception dictionary
romanize('சென்னையில்');        // 'chennaiyil'   ✓ inflected form, no extra entry needed
romanize('பக்ஷி');              // 'pakshi'       ✓ Grantha conjunct க்+ஷ resolved in-pipeline
```

---

## How it works

The library runs every word through a 6-layer pipeline:

| Layer | What it does |
|---|---|
| **0 — Sanitizer** | Strips ZWJ/ZWNJ, canonicalizes ஸ்ரீ, converts Tamil numerals, applies NFC |
| **1 — Tokenizer** | Splits into grapheme clusters using `Intl.Segmenter` |
| **2 — Decomposer** | Extracts base consonant, modifier diacritic, and modifier type |
| **3 — Context Analyzer** | Tags each token: `WORD_INITIAL`, `GEMINATE`, `POST_NASAL`, `INTERVOCALIC`, `FRICATIVE_MUTATED`, `GRANTHA_CONJUNCT_HEAD`, `WORD_FINAL`, or `DEFAULT` |
| **4 — Scheme Resolver** | Applies allophone rules per scheme (e.g. `ப` → `p`/`b`/`f` depending on tag) |
| **5 — Special Tokens** | Assembles the final string; handles Āytham (ஃ) |
| **6 — Exception Trie** | Intercepts known proper nouns with a prefix-forward trie. Inflected forms like `சென்னையில்` are matched by scanning `சென்னை` + suffix `யில்` — no extra entry needed. |

---

## Schemes

Choose the right scheme for your use case:

| Scheme | Alias | Best for |
|---|---|---|
| `'practical'` | `'practical/standard'` | Human-readable Tanglish — blogs, social media, subtitles |
| `'practical/phonetic'` | — | NLP / ASR pipelines (Aksharantar corpus optimized) |
| `'iso15919'` | — | Academic / archival — strict 1-to-1, diacritics |
| `'ala-lc'` | `'alalc'` | Library catalogues (Library of Congress 2012) |
| `'itrans'` | — | ITRANS-based toolchains (Aksharamukha South Indian standard) |

```js
romanize('தமிழ்',  { scheme: 'iso15919' });       // 'tamiḻ'
romanize('தமிழ்',  { scheme: 'ala-lc' });          // 'tamiḷ'
romanize('ஏழு',    { scheme: 'itrans', exceptions: false }); // 'Ezhbu'
```

---

## Options

```js
romanize(text, options?)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `scheme` | `SchemeName` | `'practical'` | Romanization ruleset |
| `exceptions` | `boolean` | `true` | Enable the exception trie |
| `capitalize` | `'none' \| 'sentence' \| 'words'` | `'none'` | Output casing |
| `table` | `Record<string, string \| object>` | `null` | Per-character overrides |
| `segmenter` | `Intl.Segmenter` | built-in | Custom segmenter (Web Workers, SSR) |
| `locale` | `string` | `'ta-IN'` | Locale for the built-in segmenter |

### Capitalization

```js
const s = 'சென்னை ஒரு அழகான நகரம்';

romanize(s);                              // 'chennai oru azhagana nagaram'
romanize(s, { capitalize: 'sentence' }); // 'Chennai oru azhagana nagaram'
romanize(s, { capitalize: 'words' });    // 'Chennai Oru Azhagana Nagaram'
```

> Entries with `forceCasing: true` in the dictionary (e.g. `டிவி → TV`, `வாட்ஸ்அப் → WhatsApp`) are **always** emitted verbatim — they ignore the `capitalize` option.

---

## Exception dictionary

The library ships with a curated trie of proper nouns, brand names, and loanwords. Use `addExceptions()` to extend it at runtime:

```js
import { addExceptions } from 'tamil-romanizer';

addExceptions({
  'ரஜினிகாந்த்': { roman: 'Rajinikanth', romanStem: null, oblique: null, forceCasing: false }
});

romanize('ரஜினிகாந்த்'); // 'Rajinikanth'
```

Disable the dictionary entirely for raw algorithmic output:

```js
romanize('சென்னை', { exceptions: false }); // 'chennai'  (algorithmic, same here by coincidence)
romanize('பஸ்',    { exceptions: false }); // 'bas'      (algorithmic — not 'bus')
```

---

## Custom schemes

```js
import { registerScheme, listSchemes } from 'tamil-romanizer';

registerScheme('my-scheme', {
  vowels:     { 'அ': 'a', 'ஆ': 'aa', /* ... all 12 */ },
  consonants: { 'க': 'k', /* ... all 22 */ }
});

romanize('கமல்', { scheme: 'my-scheme' });

listSchemes();
// ['practical', 'practical/standard', 'practical/phonetic',
//  'iso15919', 'ala-lc', 'alalc', 'itrans', 'my-scheme']
```

---

## Debugging

`debugRomanize()` returns a full snapshot of every pipeline layer — useful for tracking down unexpected output:

```js
import { debugRomanize } from 'tamil-romanizer';

const d = debugRomanize('பம்பரம்');

console.log(d.layer3_context.map(t => `${t.base}→${t.contextTag}`));
// ['ப→WORD_INITIAL', 'ம→DEFAULT', 'ப→INTERVOCALIC', 'ர→DEFAULT', 'ம→WORD_FINAL']

console.log(d.exception_hit); // false
console.log(d.final);         // 'pambaram'
```

---

## Mixed-language and numerals

```js
romanize('The price is ௫௦௦ rupees (ரூபாய்) 🤯!');
// 'The price is 500 rupees (roobaay) 🤯!'
```

Tamil numerals are converted automatically. English text, numbers, emojis, and punctuation pass through untouched.

---

## TypeScript

All types are exported from the root:

```ts
import type {
  RomanizeOptions, DebugResult, SchemeName, CapitalizeMode,
  ExceptionEntry, ExceptionSchema, SchemeTable, ConsonantMap,
  RawToken, DecomposedToken, ContextToken, ResolvedToken,
  TokenType, ModifierType, ContextTag
} from 'tamil-romanizer';
```

---

## Live demo

[**haroldalan.github.io/tamil-romanizer**](https://haroldalan.github.io/tamil-romanizer/)

![Demo GIF](https://raw.githubusercontent.com/haroldalan/tamil-romanizer/main/assets/demo.gif)

---

*Built for Tamil by Harold Alan.*
