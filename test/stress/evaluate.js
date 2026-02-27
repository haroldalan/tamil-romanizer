import { romanize } from '../../src/romanizer.js';
import fs from 'fs';
import path from 'path';

// Stress Test Evaluation Criteria
// --------------------------------
// 1. Accuracy of Allophonic Context: Intervocalic 'g', post-nasal 'b', etc. in Practical.
// 2. Strict Adherence: True 1-to-1 adherence in ISO 15919 mappings.
// 3. Sandhi Cross-Word Fidelity: Does the analyzer properly reset behavior across spaces?
// 4. Grantha Sequences: Correct mappings of borrowings (க்ஷ, ஸ்ரீ, ஜ, etc).
// 5. Special Tokens: Proper contextual resolution of Āytham (ஃ).

// Read the input text from input.txt located in the same directory
const inputFile = path.join(process.cwd(), 'test', 'stress', 'input.txt');

let inputText = '';
try {
    inputText = fs.readFileSync(inputFile, 'utf-8').trim();
} catch (e) {
    console.error(`Could not read ${inputFile}. Please create it and paste Tamil text inside.`);
    process.exit(1);
}

if (!inputText) {
    console.error("The input.txt file is empty. Please paste some Tamil text inside.");
    process.exit(1);
}

const runEval = () => {
    console.log('\n=======================================');
    console.log('      V1.0 STRESS TEST EVALUATOR       ');
    console.log('=======================================');
    console.log(`\n[INPUT TEXT]:\n${inputText}\n`);
    console.log('---------------------------------------');

    // Evaluation 1: Practical Scheme (Algorithmic)
    const pracResult = romanize(inputText, { scheme: 'practical', exceptions: false, capitalize: 'none' });
    console.log(`\n[PRACTICAL SCHEME (Strict Algorithmic)]\n${pracResult}`);

    // Evaluation 2: Practical Scheme (With Dictionary Overrides)
    const pracExceptionsResult = romanize(inputText, { scheme: 'practical', exceptions: true, capitalize: 'none' });
    if (pracResult !== pracExceptionsResult) {
        console.log(`\n[PRACTICAL SCHEME (With Dictionary)]\n${pracExceptionsResult}`);
    } else {
        console.log(`\n[PRACTICAL SCHEME (With Dictionary)]\n(Identical to Algorithmic - No overrides triggered)`);
    }

    // Evaluation 3: ISO 15919
    const isoResult = romanize(inputText, { scheme: 'iso15919', exceptions: false, capitalize: 'none' });
    console.log(`\n[ISO 15919 SCHEME]\n${isoResult}`);
    console.log('\n=======================================\n');
};

runEval();
