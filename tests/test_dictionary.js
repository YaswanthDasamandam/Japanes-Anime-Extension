import { lookupWord } from '../lib/dict_engine.js';

console.log('='.repeat(65));
console.log('  LOCAL JAPANESE-ENGLISH HOVER DICTIONARY TEST');
console.log('='.repeat(65));

const testWords = [
  'omae',
  '死ぬ',
  'shinde',
  'wa',
  'kyou',
  'samui',
  'ame',
  'oretachi',
  'heishi',
  'shinu'
];

let passed = 0;

for (const query of testWords) {
  const matches = lookupWord(query);
  if (matches.length > 0) {
    const entry = matches[0];
    const jlptStr = entry.jlpt ? `[${entry.jlpt}]` : '';
    const posStr = entry.pos ? `(${entry.pos})` : '';
    console.log(`✅ [${query.padEnd(9)}] -> ${entry.kanji} (${entry.romaji}): ${entry.meanings[0]} ${posStr} ${jlptStr}`);
    passed++;
  } else {
    console.log(`❌ [${query.padEnd(9)}] -> NOT FOUND`);
  }
}

console.log('-'.repeat(65));
console.log(`Results: ${passed}/${testWords.length} words resolved successfully.`);
console.log('='.repeat(65));
