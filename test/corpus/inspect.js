import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { romanize } from '../../src/romanizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SENTENCES_FILE = path.resolve(__dirname, '../../../tam_wikipedia_2021_10K-sentences.txt');

const OUT_FILE = path.resolve(__dirname, 'inspect_results.txt');

function inspectCorpus(sampleSize = 10) {
    let outString = '';
    const log = (msg) => { outString += msg + '\n'; console.log(msg); };

    if (!fs.existsSync(SENTENCES_FILE)) {
        log(`Error: Could not find corpus file at ${SENTENCES_FILE}`);
        process.exit(1);
    }

    const content = fs.readFileSync(SENTENCES_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    log(`\n📚 Total sentences in corpus: ${lines.length.toLocaleString()}`);
    log(`🔍 Inspecting ${sampleSize} random samples...\n`);

    for (let i = 0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * lines.length);
        const originalLine = lines[randomIndex].trim();

        // Remove line numbers if present (e.g. "1\tSentence..." or "1 Sentence...")
        const textToRomanize = originalLine.replace(/^\d+\s+/, '');

        const startTime = process.hrtime();
        const outputTanglish = romanize(textToRomanize, { scheme: 'practical' });
        const timeDiff = process.hrtime(startTime);
        const ms = (timeDiff[0] * 1000) + (timeDiff[1] / 1000000);

        const outputISO = romanize(textToRomanize, { scheme: 'iso15919', exceptions: false });

        log(`\x1b[36m--- Sample ${i + 1} (Line ${randomIndex + 1}) ---\x1b[0m`);
        log(`\x1b[33mOriginal:\x1b[0m ${textToRomanize}`);
        log(`\x1b[32mTanglish:\x1b[0m ${outputTanglish}`);
        log(`\x1b[34mISO 15919:\x1b[0m ${outputISO}`);
        log(`\x1b[90mTime taken: ${ms.toFixed(3)}ms\x1b[0m\n`);
    }
    fs.writeFileSync(OUT_FILE, outString, 'utf-8');
}

inspectCorpus(20);
