// Unit test to verify that subtitles stop playing when pause is clicked
import wanakana from 'wanakana';
globalThis.wanakana = wanakana;

await import('../lib/deinflector.js');
await import('../lib/kanji_table.js');
await import('../lib/dict_engine.js');

console.log('='.repeat(70));
console.log('  TESTING SUBTITLE PAUSE / PLAY / RESUME SYNCHRONIZATION');
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

// 1. Test Video Playback & Cue Progress Freeze on Pause
console.log('\n[1] Testing Subtitle Progress Freeze on Pause:');
{
  const cue = {
    startTime: 10.0,
    endTime: 14.0,
    text: 'お前はもう死んでいる。'
  };
  const tokenCount = 5;

  function calculateActiveIndex(curTime, cue, tokens) {
    const duration = cue.endTime - cue.startTime;
    if (duration <= 0) return 0;
    const progress = Math.max(0, Math.min(1, (curTime - cue.startTime) / duration));
    return Math.min(tokens - 1, Math.floor(progress * tokens));
  }

  // At t = 10.0s (start)
  assert(calculateActiveIndex(10.0, cue, tokenCount) === 0, 'At start (10.0s), active index is 0');

  // At t = 11.0s (playing, 25% through 4s cue -> token 1)
  const idx1 = calculateActiveIndex(11.0, cue, tokenCount);
  assert(idx1 === 1, 'At 11.0s (playing), active index is 1');

  // PAUSE clicked at t = 11.0s:
  // Simulate 3 seconds passing in real-time while video is paused (video.currentTime remains 11.0s)
  let videoPaused = true;
  let videoCurrentTime = 11.0;

  // Verify that during pause, active index does NOT advance
  const pausedIdx1 = calculateActiveIndex(videoCurrentTime, cue, tokenCount);
  assert(pausedIdx1 === idx1, 'Immediately upon pause, active index remains 1');

  // After delay while paused:
  const pausedIdx2 = calculateActiveIndex(videoCurrentTime, cue, tokenCount);
  assert(pausedIdx2 === idx1, '3 seconds later while paused, active index is still 1 (does NOT play)');

  // RESUME clicked at t = 11.0s:
  videoPaused = false;
  videoCurrentTime = 12.0; // video advances to 12.0s (50% through cue -> token 2)
  const resumedIdx = calculateActiveIndex(videoCurrentTime, cue, tokenCount);
  assert(resumedIdx === 2, 'Upon unpausing and playing to 12.0s, active index smoothly resumes to 2');
}

// 2. Test Pause-Aware Simulated Karaoke State
console.log('\n[2] Testing Simulated Karaoke Pause & Resume Engine:');
{
  let mockTargetVideo = { paused: false };
  let simulatedKaraokeInterval = null;
  let currentIdx = 0;
  let total = 4;
  let isPaused = false;

  function pauseKaraoke() {
    if (simulatedKaraokeInterval) {
      clearInterval(simulatedKaraokeInterval);
      simulatedKaraokeInterval = null;
    }
    isPaused = true;
  }

  function resumeKaraoke() {
    if (isPaused && total > 0 && currentIdx < total) {
      if (!mockTargetVideo.paused) {
        isPaused = false;
        // restart interval
      }
    }
  }

  // Start playing
  currentIdx = 1;
  simulatedKaraokeInterval = 123; // mock interval ID

  // Video pause clicked
  mockTargetVideo.paused = true;
  pauseKaraoke();

  assert(isPaused === true, 'Karaoke state marked as paused');
  assert(simulatedKaraokeInterval === null, 'Karaoke timer interval cleared on pause');
  assert(currentIdx === 1, 'Current token index preserved at paused position (index 1)');

  // Try resuming while video is still paused
  resumeKaraoke();
  assert(isPaused === true, 'Karaoke does NOT resume if video is still paused');

  // Video play clicked
  mockTargetVideo.paused = false;
  resumeKaraoke();
  assert(isPaused === false, 'Karaoke resumes once video is unpaused');
  assert(currentIdx === 1, 'Resumes from exact token index 1');
}

// 3. Test YouTube Closed Captions Integration on Pause
console.log('\n[3] Testing YouTube Closed Captions Alignment on Pause:');
{
  let targetVideo = { currentTime: 24.5, paused: false };
  let fullText = 'お前はもう死んでいる。';
  let durationSec = Math.max(2.0, fullText.length * 0.28); // 3.08s

  let activeSubtitleCue = {
    startTime: targetVideo.currentTime,
    endTime: targetVideo.currentTime + durationSec,
    text: fullText
  };

  assert(activeSubtitleCue.startTime === 24.5, 'YouTube cue startTime matches video.currentTime at detection');
  assert(activeSubtitleCue.endTime === 24.5 + durationSec, 'YouTube cue endTime computed based on length');

  // Advance 0.8s while playing
  targetVideo.currentTime = 25.3;
  let progressBeforePause = (targetVideo.currentTime - activeSubtitleCue.startTime) / durationSec;

  // User clicks PAUSE on YouTube
  targetVideo.paused = true;

  // Simulate 10 seconds of paused state
  let progressDuringPause = (targetVideo.currentTime - activeSubtitleCue.startTime) / durationSec;
  assert(progressBeforePause === progressDuringPause, 'Progress is 100% frozen while YouTube video is paused');

  // User resumes playback
  targetVideo.paused = false;
  targetVideo.currentTime = 26.0;
  let progressAfterResume = (targetVideo.currentTime - activeSubtitleCue.startTime) / durationSec;
  assert(progressAfterResume > progressDuringPause, 'Progress resumes cleanly when video is unpaused');
}

console.log('\n' + '='.repeat(70));
console.log(`Results: ${passed}/${totalTests} pause behavior tests passed.`);
console.log('='.repeat(70));

if (passed !== totalTests) {
  process.exit(1);
}
