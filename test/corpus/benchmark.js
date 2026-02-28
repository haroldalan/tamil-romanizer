import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { romanize } from '../../src/romanizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SENTENCES_FILE = path.resolve(__dirname, '../../../tam_wikipedia_2021_10K-sentences.txt');
const WORDS_FILE = path.resolve(__dirname, '../../../tam_wikipedia_2021_10K-words.txt');

const OUT_FILE = path.resolve(__dirname, 'benchmark_results.txt');
let globalOutString = '';
const log = (msg) => { globalOutString += msg + '\n'; console.log(msg); };

function runBenchmark(filePath, label) {
    if (!fs.existsSync(filePath)) {
        log(`Error: Could not find corpus file at ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    // Clean up lines (remove line numbers/frequencies at the start/end if any)
    const cleanedLines = lines.map(line => line.replace(/^\d+\s+/, '').replace(/\s+\d+$/, '').trim());

    const targetCharCount = cleanedLines.reduce((acc, val) => acc + val.length, 0);

    log(`\n🚀 Starting Benchmark on: ${label}`);
    log(`📂 Total Lines: ${cleanedLines.length.toLocaleString()}`);
    log(`🔤 Total Characters: ${targetCharCount.toLocaleString()}`);

    // Test Practical Scheme
    log(`\n⏳ Running Scheme: Practical (with dictionary exceptions)...`);
    const startPractical = process.hrtime.bigint();
    for (const line of cleanedLines) {
        romanize(line, { scheme: 'practical' });
    }
    const endPractical = process.hrtime.bigint();
    const timePracticalMs = Number(endPractical - startPractical) / 1000000;

    log(`✅ Completed in: ${timePracticalMs.toFixed(2)} ms`);
    log(`⚡ Throughput: ${((targetCharCount / timePracticalMs) * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })} chars/sec`);

    // Test ISO 15919 Scheme
    log(`\n⏳ Running Scheme: ISO 15919 (strict algorithmic)...`);
    const startIso = process.hrtime.bigint();
    for (const line of cleanedLines) {
        romanize(line, { scheme: 'iso15919', exceptions: false });
    }
    const endIso = process.hrtime.bigint();
    const timeIsoMs = Number(endIso - startIso) / 1000000;

    log(`✅ Completed in: ${timeIsoMs.toFixed(2)} ms`);
    log(`⚡ Throughput: ${((targetCharCount / timeIsoMs) * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })} chars/sec`);
    log(`--------------------------------------------------`);
}

log(`==================================================`);
log(`   TAMIL ROMANIZER 10K CORPUS STRESS TEST`);
log(`==================================================`);

runBenchmark(WORDS_FILE, "10K Wikipedia Words");
runBenchmark(SENTENCES_FILE, "10K Wikipedia Sentences");
fs.writeFileSync(OUT_FILE, globalOutString, 'utf-8');
