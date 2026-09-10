// Unit test to verify that subtitle cues and visual states reset when switching episodes
import wanakana from 'wanakana';
globalThis.wanakana = wanakana;

await import('../extension/lib/deinflector.js');
await import('../extension/lib/kanji_table.js');
await import('../extension/lib/dict_engine.js');

console.log('='.repeat(70));
console.log('  TESTING EPISODE SUBTITLE RESET & TRANSITION SYNC');
console.log('='.repeat(70));

let passed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// Emulate content script cue state and reset logic
let loadedJapaneseCues = [];
let loadedEnglishCues = [];
let activeSubtitleCue = null;
let lastRenderedJapanese = '';
let lastRenderedEnglish = '';
let lastYouTubeText = '';
let preFetchQueue = [];
const pendingTranslations = new Set();
let hasEnglishTrackPresent = false;
let overlayVisible = true;

function resetSubtitleState(reason = 'unknown') {
  loadedJapaneseCues = [];
  loadedEnglishCues = [];
  activeSubtitleCue = null;
  lastRenderedJapanese = '';
  lastRenderedEnglish = '';
  lastYouTubeText = '';
  preFetchQueue = [];
  pendingTranslations.clear();
  hasEnglishTrackPresent = false;
  overlayVisible = false;
}

function indexTrackCues(tracks) {
  const seenJa = new Set(loadedJapaneseCues.map(c => `${c.startTime.toFixed(2)}_${c.text}`));
  const seenEn = new Set(loadedEnglishCues.map(c => `${c.startTime.toFixed(2)}_${c.text}`));

  for (const track of tracks) {
    for (const cue of track.cues) {
      const text = (cue.text || '').trim();
      const key = `${cue.startTime.toFixed(2)}_${text}`;
      if (track.language === 'ja') {
        if (text && !seenJa.has(key)) {
          seenJa.add(key);
          loadedJapaneseCues.push({ startTime: cue.startTime, endTime: cue.endTime, text });
        }
      } else if (track.language === 'en') {
        if (text && !seenEn.has(key)) {
          seenEn.add(key);
          loadedEnglishCues.push({ startTime: cue.startTime, endTime: cue.endTime, text });
        }
      }
    }
  }
  loadedJapaneseCues.sort((a, b) => a.startTime - b.startTime);
  loadedEnglishCues.sort((a, b) => a.startTime - b.startTime);
}

// 1. Simulate Episode 1 playback
console.log('\n[1] Testing Episode 1 Subtitle Indexing:');
const ep1Tracks = [
  {
    language: 'ja',
    cues: [
      { startTime: 2.0, endTime: 5.0, text: '第1話：始まりの朝。' },
      { startTime: 6.0, endTime: 9.0, text: 'お前はもう死んでいる。' }
    ]
  },
  {
    language: 'en',
    cues: [
      { startTime: 2.0, endTime: 5.0, text: 'Episode 1: The Morning of Beginning.' },
      { startTime: 6.0, endTime: 9.0, text: 'You are already dead.' }
    ]
  }
];

indexTrackCues(ep1Tracks);
assert(loadedJapaneseCues.length === 2, 'Episode 1 loaded 2 Japanese cues');
assert(loadedEnglishCues.length === 2, 'Episode 1 loaded 2 English cues');

// Simulate active playback in Episode 1
activeSubtitleCue = loadedJapaneseCues[1];
lastRenderedJapanese = activeSubtitleCue.text;
lastRenderedEnglish = loadedEnglishCues[1].text;
overlayVisible = true;
preFetchQueue.push('次のセリフ');
pendingTranslations.add('次のセリフ');

assert(lastRenderedJapanese === 'お前はもう死んでいる。', 'Episode 1 actively displaying subtitle');

// 2. Click "Next Episode" (trigger reset)
console.log('\n[2] Testing resetSubtitleState on Episode Transition:');
resetSubtitleState('url_change');

assert(loadedJapaneseCues.length === 0, 'loadedJapaneseCues is empty after reset');
assert(loadedEnglishCues.length === 0, 'loadedEnglishCues is empty after reset');
assert(activeSubtitleCue === null, 'activeSubtitleCue is null after reset');
assert(lastRenderedJapanese === '', 'lastRenderedJapanese is empty string');
assert(lastRenderedEnglish === '', 'lastRenderedEnglish is empty string');
assert(overlayVisible === false, 'overlay display is hidden after reset');
assert(preFetchQueue.length === 0, 'preFetchQueue is cleared');
assert(pendingTranslations.size === 0, 'pendingTranslations set is cleared');

// 3. Fallback lookup at t = 2.5s before Episode 2 tracks finish loading
console.log('\n[3] Testing Fallback Lookup Safety during Episode 2 Buffering:');
const currentTimeBeforeLoad = 2.5;
const fallbackJaCue = loadedJapaneseCues.find(c => currentTimeBeforeLoad >= c.startTime && currentTimeBeforeLoad <= c.endTime) || null;
const fallbackEnCue = loadedEnglishCues.find(c => currentTimeBeforeLoad >= c.startTime && currentTimeBeforeLoad <= c.endTime) || null;

assert(fallbackJaCue === null, 'Fallback JA lookup returns null (does NOT display Episode 1 subtitle)');
assert(fallbackEnCue === null, 'Fallback EN lookup returns null (does NOT display Episode 1 subtitle)');

// 4. Episode 2 tracks finish loading
console.log('\n[4] Testing Episode 2 Subtitle Ingestion:');
const ep2Tracks = [
  {
    language: 'ja',
    cues: [
      { startTime: 2.0, endTime: 5.0, text: '第2話：新たなる敵。' },
      { startTime: 6.0, endTime: 9.0, text: '雨が降って、天気が寒いです。' }
    ]
  },
  {
    language: 'en',
    cues: [
      { startTime: 2.0, endTime: 5.0, text: 'Episode 2: A New Enemy.' },
      { startTime: 6.0, endTime: 9.0, text: 'It is raining, and the weather is cold.' }
    ]
  }
];

indexTrackCues(ep2Tracks);
assert(loadedJapaneseCues.length === 2, 'Episode 2 loaded 2 Japanese cues');
assert(loadedEnglishCues.length === 2, 'Episode 2 loaded 2 English cues');

const activeJaEp2 = loadedJapaneseCues.find(c => 2.5 >= c.startTime && 2.5 <= c.endTime);
const activeEnEp2 = loadedEnglishCues.find(c => 2.5 >= c.startTime && 2.5 <= c.endTime);

assert(activeJaEp2.text === '第2話：新たなる敵。', 'Playback at t=2.5s correctly displays Episode 2 Japanese');
assert(activeEnEp2.text === 'Episode 2: A New Enemy.', 'Playback at t=2.5s correctly displays Episode 2 English');
assert(!loadedJapaneseCues.some(c => c.text.includes('第1話')), 'Episode 1 Japanese cues completely absent from memory');
assert(!loadedEnglishCues.some(c => c.text.includes('Episode 1')), 'Episode 1 English cues completely absent from memory');

// 5. Deduplication test (repeated calls to indexTracks on the same episode)
console.log('\n[5] Testing Track Index Deduplication:');
indexTrackCues(ep2Tracks);
assert(loadedJapaneseCues.length === 2, 'Japanese cues not duplicated on repeated indexing');
assert(loadedEnglishCues.length === 2, 'English cues not duplicated on repeated indexing');

// 6. Navigation and Video Source Change Detection Test
console.log('\n[6] Testing Navigation & Video Source Change Detection:');
let currentUrl = 'https://anime.example.com/watch?ep=1';
let currentVideoSrc = 'https://cdn.example.com/videos/ep1.mp4';
let resetCount = 0;

function checkNavigationOrSrcChange(newUrl, newSrc) {
  if (newUrl !== currentUrl) {
    currentUrl = newUrl;
    resetSubtitleState('url_change');
    resetCount++;
    if (newSrc) currentVideoSrc = newSrc;
    return;
  }
  if (newSrc && newSrc !== currentVideoSrc) {
    currentVideoSrc = newSrc;
    resetSubtitleState('video_src_change');
    resetCount++;
  }
}

checkNavigationOrSrcChange('https://anime.example.com/watch?ep=1', 'https://cdn.example.com/videos/ep1.mp4');
assert(resetCount === 0, 'No reset when URL and video source are unchanged');

checkNavigationOrSrcChange('https://anime.example.com/watch?ep=2', 'https://cdn.example.com/videos/ep2.mp4');
assert(resetCount === 1, 'Reset triggered when URL changes to Episode 2');

checkNavigationOrSrcChange('https://anime.example.com/watch?ep=2', 'https://cdn.example.com/videos/ep3.mp4');
assert(resetCount === 2, 'Reset triggered when video src changes even on same URL');

console.log('='.repeat(70));
console.log(`Results: ${passed}/${totalTests} tests passed.`);
console.log('='.repeat(70));

if (passed !== totalTests) {
  process.exit(1);
}
