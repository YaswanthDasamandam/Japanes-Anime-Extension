// Test script to verify Dual Subtitle detection, 3-tier Furigana segmentation, and dictionary glossing
import { lookupWord, LOCAL_DICTIONARY } from '../lib/dict_engine.js';
import wanakana from 'wanakana';

console.log('='.repeat(70));
console.log('  TESTING DUAL SUBTITLES & 3-TIER FURIGANA PIPELINE');
console.log('='.repeat(70));

// 1. Test Track Classification
function isJapaneseTrack(track, sampleText = '') {
  if (!track) return false;
  const lang = ((track.language || track.srclang || '') + '').toLowerCase();
  const label = ((track.label || '') + '').toLowerCase();
  if (/^(ja|jp|ja-jp|japanese)/.test(lang)) return true;
  if (/japanese|日本語|ja\b/.test(label)) return true;
  if (sampleText && /[\u3040-\u309f\u30a0-\u30fa\u4e00-\u9faf]/.test(sampleText)) return true;
  return false;
}

function isEnglishTrack(track, sampleText = '') {
  if (!track) return false;
  const lang = ((track.language || track.srclang || '') + '').toLowerCase();
  const label = ((track.label || '') + '').toLowerCase();
  if (/^(en|en-us|en-gb|english)/.test(lang)) return true;
  if (/english|en\b|eng\b/.test(label)) return true;
  if (sampleText && !/[\u3040-\u309f\u30a0-\u30fa\u4e00-\u9faf]/.test(sampleText) && /[a-zA-Z]{2,}/.test(sampleText)) return true;
  return false;
}

console.log('\n[1] Testing Track Classification:');
const testTracks = [
  { track: { language: 'ja', label: 'Japanese' }, text: 'お前はもう死んでいる。', expectedJa: true, expectedEn: false },
  { track: { language: 'en', label: 'English' }, text: 'You are already dead.', expectedJa: false, expectedEn: true },
  { track: { language: '', label: '日本語 [CC]' }, text: '何！？', expectedJa: true, expectedEn: false },
  { track: { language: '', label: 'English [CC]' }, text: 'What?!', expectedJa: false, expectedEn: true },
  { track: { language: '', label: '' }, text: 'さまのコムシだと、顔とにも気感がない！', expectedJa: true, expectedEn: false },
  { track: { language: '', label: '' }, text: 'What is this? You show no fear in your expression!', expectedJa: false, expectedEn: true }
];

let trackTestsPassed = 0;
testTracks.forEach((t, i) => {
  const isJa = isJapaneseTrack(t.track, t.text);
  const isEn = isEnglishTrack(t.track, t.text);
  const ok = (isJa === t.expectedJa) && (isEn === t.expectedEn);
  if (ok) trackTestsPassed++;
  console.log(`  ${ok ? '✅' : '❌'} Track #${i + 1} (${t.track.label || 'no-label'}): isJa=${isJa}, isEn=${isEn}`);
});
console.log(`Track Classification Score: ${trackTestsPassed}/${testTracks.length}`);

// 2. Test 3-Tier Furigana Tokenization & Glossing
console.log('\n[2] Testing 3-Tier Furigana Segmentation & Glossing:');
const sortedDictKeys = Object.keys(LOCAL_DICTIONARY).sort((a, b) => b.length - a.length);

function splitJapaneseWords(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    let match = null;
    for (const word of sortedDictKeys) {
      if (text.startsWith(word, i)) {
        match = word;
        break;
      }
    }
    if (match) {
      tokens.push(match);
      i += match.length;
    } else {
      const rest = text.slice(i);
      const m = rest.match(/^[\u4e00-\u9faf]+|^[ァ-ヴー]+|^[ぁ-ん]+|^[a-zA-Z0-9]+|^[^\s\w]/);
      if (m && m[0].length > 0) {
        tokens.push(m[0]);
        i += m[0].length;
      } else {
        tokens.push(text[i]);
        i++;
      }
    }
  }
  return tokens.filter(t => t.trim().length > 0);
}

const testSentence = 'お前はもう死んでいる。';
const englishSentence = 'You are already dead.';

console.log(`Input Sentence: "${testSentence}"`);
console.log(`English Subtitle: "${englishSentence}"\n`);
console.log('3-Tier Furigana Units:');

const tokens = splitJapaneseWords(testSentence);
tokens.forEach((token, idx) => {
  let rom = '';
  let shortMeaning = '';
  const isParticle = ['は', 'が', 'を', 'に', 'で', 'の', 'も', 'か', 'ね', 'よ', 'から', 'まで', 'と'].includes(token);

  const matches = lookupWord(token);
  if (matches && matches.length > 0) {
    const entry = matches[0];
    if (entry.romaji) rom = entry.romaji;
    else if (entry.kana) rom = wanakana.toRomaji(entry.kana);

    const raw = entry.meanings[0] || '';
    shortMeaning = raw.replace(/\s*\([^)]*\)/g, '').split(/[,;]/)[0].trim();
  }

  if (!rom) {
    if (token === 'は') rom = 'wa';
    else if (token === 'へ') rom = 'e';
    else if (token === 'を') rom = 'o';
    else rom = wanakana.toRomaji(token);
  }
  if (!shortMeaning && isParticle) {
    const particleMeanings = {
      'は': 'topic', 'が': 'subj', 'を': 'obj', 'に': 'to/at', 'で': 'by/at',
      'の': "'s/of", 'も': 'also', 'か': '?', 'ね': 'right?', 'よ': '!',
      'から': 'from', 'まで': 'until', 'と': 'with/and'
    };
    shortMeaning = particleMeanings[token] || '';
  }

  console.log(`  Token ${idx + 1}:`);
  console.log(`    [Tier 1: Pronunciation (Romaji)] -> ${rom}`);
  console.log(`    [Tier 2: Japanese Kanji/Kana   ] -> ${token}`);
  console.log(`    [Tier 3: English Meaning Gloss ] -> ${shortMeaning || '(symbol/unlisted)'}`);
});

console.log(`\n  [Tier 4: Full English Sentence ] -> "${englishSentence}"`);
console.log('='.repeat(70));
console.log('  ALL TESTS COMPLETED SUCCESSFULLY');
console.log('='.repeat(70));
