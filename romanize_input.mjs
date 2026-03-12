import { romanize } from './dist/index.js';
import { readFileSync } from 'fs';

const SCHEME = 'practical';
const EXCEPTIONS = false;

// Read from file path arg (avoids PowerShell UTF-8 pipe mangling)
const filePath = process.argv[2];
if (!filePath) { console.error('Usage: node romanize_input.mjs <input_file.txt>'); process.exit(1); }

const raw = readFileSync(filePath, 'utf8').trimEnd();
const lines = raw.split('\n');
for (const line of lines) {
    const result = romanize(line.replace(/\r$/, ''), { scheme: SCHEME, exceptions: EXCEPTIONS, capitalize: 'none' });
    console.log(result);
}
