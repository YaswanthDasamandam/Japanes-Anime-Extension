import wanakana from 'wanakana';
globalThis.wanakana = wanakana;

await import('../lib/deinflector.js');
await import('../lib/kanji_table.js');
await import('../lib/dict_engine.js');

const { lookupWord, LOCAL_DICTIONARY } = globalThis.AnimeJapanese;
global.AnimeJapanese = globalThis.AnimeJapanese;

console.log('='.repeat(70));
console.log('  SUBTITLE PRE-LOADING & LOOKAHEAD CACHE UNIT TEST');
console.log('='.repeat(70));

const sortedDictKeys = Object.keys(LOCAL_DICTIONARY).sort((a, b) => b.length - a.length);

function splitJapaneseWords(text) {
  if (!text) return [];
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

function synthesizeLocalTranslation(text) {
  if (!text || !text.trim()) return '';
  try {
    const clean = text.replace(/<[^>]+>/g, '').trim();
    const tokens = splitJapaneseWords(clean);
    const parts = [];
    for (const tok of tokens) {
      const matches = lookupWord(tok);
      if (matches && matches.length > 0) {
        const raw = (matches[0].meanings[0] || '').replace(/\s*\([^)]*\)/g, '').split(/[,;]/)[0].trim();
        parts.push(raw || tok);
        continue;
      }
      parts.push(tok);
    }
    return parts.join(' ');
  } catch (e) {
    return '';
  }
}

// 1. Test Instant Local Dictionary Synthesis Latency
console.log('\n--- 1. Testing Instant Local Dictionary Fallback (<1ms) ---');
const sampleJa = 'お前はもう死んでいる。';
const tStart = performance.now();
const synthesized = synthesizeLocalTranslation(sampleJa);
const tElapsed = performance.now() - tStart;

console.log(`Input:       "${sampleJa}"`);
console.log(`Synthesized: "${synthesized}"`);
console.log(`Execution Time: ${tElapsed.toFixed(3)} ms`);
if (synthesized.includes('you') && (synthesized.includes('dead') || synthesized.includes('die')) && tElapsed < 15) {
  console.log('✅ PASS: Instant dictionary synthesis works within < 15ms');
} else {
  console.error('❌ FAIL: Synthesis output or latency unexpected');
  process.exit(1);
}

// 2. Test Cue Indexing and Sliding Lookahead Window
console.log('\n--- 2. Testing Cue Indexing & Lookahead Pre-fetch Window ---');
const mockCues = [
  { startTime: 1.0, endTime: 3.5, text: 'お前はもう死んでいる。' },
  { startTime: 5.0, endTime: 7.0, text: '何！？' },
  { startTime: 12.0, endTime: 15.0, text: '俺たちの戦いはこれからだ！' },
  { startTime: 45.0, endTime: 48.0, text: '雨が降って、天気が寒いです。' },
  { startTime: 80.0, endTime: 83.0, text: '敵の兵士たちが近づいている。' }
];

const translationCache = new Map();
const pendingTranslations = new Set();
let preFetchQueue = [];

function preFetchLookahead(cues, currentTime, windowSec = 30) {
  const upcoming = cues.filter(cue => {
    return cue.startTime >= currentTime - 1.0 && cue.startTime <= currentTime + windowSec;
  });

  for (const cue of upcoming) {
    const clean = cue.text.replace(/<[^>]+>/g, '').trim();
    if (!clean) continue;
    if (translationCache.has(clean) || pendingTranslations.has(clean)) continue;

    pendingTranslations.add(clean);
    preFetchQueue.push(clean);
  }
}

// At playback time t = 0.0s, window = 30s
preFetchLookahead(mockCues, 0.0, 30);
console.log(`At t = 0.0s (Lookahead window 30s), Queued cues:`, preFetchQueue);

if (preFetchQueue.length === 3 &&
    preFetchQueue.includes('お前はもう死んでいる。') &&
    preFetchQueue.includes('何！？') &&
    preFetchQueue.includes('俺たちの戦いはこれからだ！') &&
    !preFetchQueue.includes('雨が降って、天気が寒いです。')) {
  console.log('✅ PASS: Only cues within 30s window are queued; cues at 45s and 80s are excluded.');
} else {
  console.error('❌ FAIL: Lookahead queue filtering failed:', preFetchQueue);
  process.exit(1);
}

// Simulate pre-fetch worker resolving translations into memory cache
console.log('\n--- 3. Testing In-Memory Pre-translation Resolution ---');
for (const text of preFetchQueue) {
  translationCache.set(text, `[English Translation of: ${text}]`);
}
preFetchQueue = [];
pendingTranslations.clear();

console.log(`Items in Memory Cache: ${translationCache.size}`);
for (const [k, v] of translationCache.entries()) {
  console.log(`  - "${k}" => "${v}"`);
}

// 4. Test Zero-Latency Playback Lookup
console.log('\n--- 4. Testing Zero-Latency Playback Lookup at t = 1.0s ---');
const activeCueText = mockCues[0].text;
const lookupStart = performance.now();
const isHit = translationCache.has(activeCueText);
const resolvedText = isHit ? translationCache.get(activeCueText) : synthesizeLocalTranslation(activeCueText);
const lookupTime = performance.now() - lookupStart;

console.log(`Active Cue at t=1.0s: "${activeCueText}"`);
console.log(`Resolved: "${resolvedText}"`);
console.log(`Lookup Latency: ${lookupTime.toFixed(4)} ms`);

if (isHit && lookupTime < 1.0) {
  console.log('✅ PASS: Zero perceived latency (0ms) synchronous memory hit on cue playback!');
} else {
  console.error('❌ FAIL: Lookup was not instantaneous:', lookupTime);
  process.exit(1);
}

// 5. Test Video Seeking Reprioritization
console.log('\n--- 5. Testing Video Seek Reprioritization to t = 42.0s ---');
preFetchLookahead(mockCues, 42.0, 30);
console.log(`At t = 42.0s, Newly Queued cues:`, preFetchQueue);

if (preFetchQueue.length === 1 && preFetchQueue[0] === '雨が降って、天気が寒いです。') {
  console.log('✅ PASS: Seeking immediately queues cues for the new timestamp window.');
} else {
  console.error('❌ FAIL: Seeking reprioritization failed:', preFetchQueue);
  process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log('  ALL LOOKAHEAD CACHE & PRE-LOADING TESTS PASSED!');
console.log('='.repeat(70));
