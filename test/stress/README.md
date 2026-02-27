# Stress Testing Framework

This module allows for rapid manual verification of the Tamil Romanization engine using real-world arbitrary text.

## How to Test:
1. Open `input.txt` and paste in any Tamil paragraphs, sentences, or phrases.
2. Run the evaluation script via Node:
```bash
node test/stress/evaluate.js
```

## Output Criteria
The script will output 3 separate blocks for comparison:
1. **[PRACTICAL SCHEME (Strict Algorithmic)]**: Displays exactly how the core algorithmic Context Analyzer routes phonemes natively based on position (e.g. intervocalic `g`, post-nasal `b`).
2. **[PRACTICAL SCHEME (With Dictionary)]**: Applies the Layer-6 Exception Trie pre-filter to correct known loanwords or proper noun mappings (e.g. `தமிழ்நாடு` to `Tamil Nadu` or `ஃபேன்` to `Fan` if present in `exceptions.json`).
3. **[ISO 15919 SCHEME]**: Demonstrates strict formal 1-to-1 transliteration, completely ignoring phonemic context routing to preserve explicit grammatical bases.
