#!/usr/bin/env node
// compare.mjs — compare actual vs ideal romanization line by line, word by word
// Usage: node compare.mjs actual.txt ideal.txt
import { readFileSync } from 'fs';

const actualLines  = readFileSync(process.argv[2], 'utf8').trimEnd().split('\n');
const idealLines   = readFileSync(process.argv[3], 'utf8').trimEnd().split('\n');

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

let totalWords = 0, matchWords = 0, diffLines = 0;

const maxLen = Math.max(actualLines.length, idealLines.length);

for (let i = 0; i < maxLen; i++) {
    const actual = (actualLines[i] ?? '').trim();
    const ideal  = (idealLines[i]  ?? '').trim();

    if (actual === ideal) {
        console.log(`${DIM}[L${i+1}] ✓ ${actual}${RESET}`);
        totalWords += actual.split(/\s+/).filter(Boolean).length;
        matchWords += actual.split(/\s+/).filter(Boolean).length;
        continue;
    }

    diffLines++;
    console.log(`${CYAN}[L${i+1}]${RESET}`);

    const aWords = actual.split(/\s+/);
    const iWords = ideal.split(/\s+/);
    const len = Math.max(aWords.length, iWords.length);

    for (let j = 0; j < len; j++) {
        const a = aWords[j] ?? '(missing)';
        const b = iWords[j] ?? '(missing)';
        totalWords++;
        if (a === b) {
            matchWords++;
            process.stdout.write(`  ${GREEN}${a}${RESET} `);
        } else {
            process.stdout.write(`\n  ${RED}GOT:  ${a}${RESET}\n  ${GREEN}WANT: ${b}${RESET}\n`);
        }
    }
    console.log();
}

const wer = ((totalWords - matchWords) / totalWords * 100).toFixed(1);
console.log(`\n────────────────────────────────`);
console.log(`Lines differing : ${diffLines} / ${maxLen}`);
console.log(`Word match rate : ${matchWords}/${totalWords} (${(100 - parseFloat(wer)).toFixed(1)}% correct)`);
console.log(`WER             : ${wer}%`);
