import { lookupWord } from '../lib/dict_engine.js';

// Calibrated waveform timestamps matching the exact audio files
const SAMPLES = {
  sample_1: {
    title: 'Fist of the North Star - Iconic Scene',
    audioSrc: '../tests/audio/sample_1_omae.wav',
    duration: 12.69,
    lines: [
      {
        start: 0.2,
        end: 3.5,
        kanji: 'さまのコムシだと、顔とにも気感がない！',
        romajiTokens: [
          { surface: 'さま', romaji: 'sama', start: 0.2, end: 0.7, pos: '名詞' },
          { surface: 'の', romaji: 'no', start: 0.7, end: 1.0, pos: '助詞' },
          { surface: 'コムシだ', romaji: 'komushida', start: 1.0, end: 1.8, pos: '名詞' },
          { surface: 'と', romaji: 'to', start: 1.8, end: 2.1, pos: '助詞' },
          { surface: '、', romaji: ',', start: 2.1, end: 2.2, pos: '記号' },
          { surface: '顔', romaji: 'kao', start: 2.2, end: 2.7, pos: '名詞' },
          { surface: 'と', romaji: 'to', start: 2.7, end: 3.0, pos: '助詞' },
          { surface: 'に', romaji: 'ni', start: 3.0, end: 3.2, pos: '助詞' },
          { surface: 'も', romaji: 'mo', start: 3.2, end: 3.5, pos: '助詞' }
        ],
        english: 'What is this? You show no fear in your expression!'
      },
      {
        start: 3.72,
        end: 6.1,
        kanji: 'お前はもう死んでいる。',
        romajiTokens: [
          { surface: 'お前', romaji: 'omae', start: 3.72, end: 4.4, pos: '名詞' },
          { surface: 'は', romaji: 'wa', start: 4.4, end: 4.75, pos: '助詞' },
          { surface: 'もう', romaji: 'mou', start: 4.75, end: 5.25, pos: '副詞' },
          { surface: '死んで', romaji: 'shinde', start: 5.25, end: 5.75, pos: '動詞' },
          { surface: 'いる', romaji: 'iru', start: 5.75, end: 6.1, pos: '動詞' },
          { surface: '。', romaji: '.', start: 6.1, end: 6.15, pos: '記号' }
        ],
        english: '"You are already dead."'
      },
      {
        start: 6.25,
        end: 7.2,
        kanji: '何！？',
        romajiTokens: [
          { surface: '何', romaji: 'nani', start: 6.25, end: 7.0, pos: '名詞' },
          { surface: '！？', romaji: '!?', start: 7.0, end: 7.2, pos: '記号' }
        ],
        english: '"What?!"'
      },
      {
        start: 7.3,
        end: 12.69,
        kanji: '（爆発音・叫び声）',
        romajiTokens: [
          { surface: '（効果音）', romaji: '[Explosion & Sound Effects]', start: 7.3, end: 12.69, pos: '記号' }
        ],
        english: '[Dramatic anime sound effect & climax]'
      }
    ]
  },
  sample_2: {
    title: 'Conversational Japanese (Daily Dialogue Practice)',
    audioSrc: '../tests/audio/sample_2_conversation.wav',
    duration: 19.97,
    lines: [
      {
        // 0.0s to 7.4s is the intro theme music
        start: 0.0,
        end: 7.4,
        kanji: '（オープニング音楽）',
        romajiTokens: [
          { surface: '音楽', romaji: '[🎵 Intro Music / Title Screen]', start: 0.0, end: 7.4, pos: '記号' }
        ],
        english: '[Instrumental intro music]'
      },
      {
        // Dialogue 1 starts at 7.50s after intro
        start: 7.5,
        end: 11.2,
        kanji: '今日は寒いですか？',
        romajiTokens: [
          { surface: '今日', romaji: 'kyou', start: 7.5, end: 8.5, pos: '名詞' },
          { surface: 'は', romaji: 'wa', start: 8.5, end: 9.0, pos: '助詞' },
          { surface: '寒い', romaji: 'samui', start: 9.0, end: 9.8, pos: '形容詞' },
          { surface: 'です', romaji: 'desu', start: 9.8, end: 10.3, pos: '助動詞' },
          { surface: 'か', romaji: 'ka', start: 10.3, end: 10.9, pos: '助詞' },
          { surface: '？', romaji: '?', start: 10.9, end: 11.2, pos: '記号' }
        ],
        english: 'Is it cold today?'
      },
      {
        // Pause between speakers from 11.2s to 12.5s
        start: 11.2,
        end: 12.5,
        kanji: '（間）',
        romajiTokens: [
          { surface: '間', romaji: '[Pause]', start: 11.2, end: 12.5, pos: '記号' }
        ],
        english: '[Pause between speakers]'
      },
      {
        // Dialogue 2 starts at 12.50s through 16.5s
        start: 12.5,
        end: 16.8,
        kanji: 'はい、朝から雨が降っています。',
        romajiTokens: [
          { surface: 'はい', romaji: 'hai', start: 12.5, end: 13.5, pos: '感動詞' },
          { surface: '、', romaji: ',', start: 13.5, end: 13.7, pos: '記号' },
          { surface: '朝', romaji: 'asa', start: 13.7, end: 14.3, pos: '名詞' },
          { surface: 'から', romaji: 'kara', start: 14.3, end: 14.7, pos: '助詞' },
          { surface: '雨', romaji: 'ame', start: 14.7, end: 15.3, pos: '名詞' },
          { surface: 'が', romaji: 'ga', start: 15.3, end: 15.6, pos: '助詞' },
          { surface: '降って', romaji: 'futte', start: 15.6, end: 16.2, pos: '動詞' },
          { surface: 'います', romaji: 'imasu', start: 16.2, end: 16.7, pos: '動詞' },
          { surface: '。', romaji: '.', start: 16.7, end: 16.8, pos: '記号' }
        ],
        english: 'Yes, it has been raining since morning.'
      }
    ]
  },
  sample_3: {
    title: 'Attack on Titan - Erwin Dramatic Speech',
    audioSrc: '../tests/audio/sample_3_japanese_speech.wav',
    duration: 12.0,
    lines: [
      {
        start: 0.2,
        end: 5.8,
        kanji: 'ここに伝っていたの、時期に飛んでくる！',
        romajiTokens: [
          { surface: 'ここ', romaji: 'koko', start: 0.2, end: 1.5, pos: '名詞' },
          { surface: 'に', romaji: 'ni', start: 1.5, end: 2.2, pos: '助詞' },
          { surface: '飛んでくる', romaji: 'tondekuru', start: 2.2, end: 5.0, pos: '動詞' },
          { surface: '！', romaji: '!', start: 5.0, end: 5.8, pos: '記号' }
        ],
        english: 'They are coming flying right toward here!'
      },
      {
        start: 6.0,
        end: 11.9,
        kanji: '俺たちは今から死ぬんですか？',
        romajiTokens: [
          { surface: '俺たち', romaji: 'oretachi', start: 6.2, end: 7.8, pos: '名詞' },
          { surface: 'は', romaji: 'wa', start: 7.8, end: 8.3, pos: '助詞' },
          { surface: '今', romaji: 'ima', start: 8.3, end: 9.0, pos: '名詞' },
          { surface: 'から', romaji: 'kara', start: 9.0, end: 9.6, pos: '助詞' },
          { surface: '死ぬ', romaji: 'shinu', start: 9.6, end: 10.7, pos: '動詞' },
          { surface: 'んですか', romaji: 'ndesu ka', start: 10.7, end: 11.8, pos: '助詞' },
          { surface: '？', romaji: '?', start: 11.8, end: 11.9, pos: '記号' }
        ],
        english: 'Are we all going to die right now?'
      }
    ]
  }
};

// DOM Elements
const sampleSelect = document.getElementById('sampleSelect');
const subOverlay = document.getElementById('subOverlay');
const displayModeSelect = document.getElementById('displayModeSelect');
const audioPlayer = document.getElementById('audioPlayer');
const audioSource = document.getElementById('audioSource');
const sceneTitle = document.getElementById('sceneTitle');
const timeDisplay = document.getElementById('timeDisplay');
const kanjiLine = document.getElementById('kanjiLine');
const romajiLine = document.getElementById('romajiLine');
const englishLine = document.getElementById('englishLine');
const toggleEnglish = document.getElementById('toggleEnglish');
const toggleShadowing = document.getElementById('toggleShadowing');
const dictPopover = document.getElementById('dictPopover');
const tokenList = document.getElementById('tokenList');
const btnReplay = document.getElementById('btnReplay');
const btnPlayPause = document.getElementById('btnPlayPause');

let currentSampleKey = 'sample_1';
let currentLineIndex = -1;
let lastPausedLineIndex = -1;
let animFrameId = null;
let currentMode = 'dual'; // 'dual', 'hover', 'ruby'

function setDisplayMode(mode) {
  currentMode = mode;
  displayModeSelect.value = mode;
  subOverlay.classList.remove('mode-dual', 'mode-hover', 'mode-ruby');
  subOverlay.classList.add(`mode-${mode}`);
  renderLine(currentLineIndex !== -1 ? currentLineIndex : 0);
}

function loadSample(key) {
  currentSampleKey = key;
  const sample = SAMPLES[key];
  sceneTitle.textContent = sample.title;
  
  // Pause and reset audio
  audioPlayer.pause();
  audioSource.src = sample.audioSrc;
  audioPlayer.load();
  
  currentLineIndex = -1;
  lastPausedLineIndex = -1;
  
  // Render initial dialogue
  renderLine(0);
  renderTokenInspector();
  timeDisplay.textContent = `0.00s / ${sample.duration.toFixed(2)}s`;
}

function renderLine(lineIdx) {
  const sample = SAMPLES[currentSampleKey];
  const line = sample.lines[lineIdx] || sample.lines[0];
  currentLineIndex = lineIdx;

  englishLine.textContent = line.english;

  // Clear previous lines
  kanjiLine.innerHTML = '';
  romajiLine.innerHTML = '';

  line.romajiTokens.forEach((token, idx) => {
    // 1. Japanese Token
    const kSpan = document.createElement('span');
    kSpan.className = 'kanji-token';
    kSpan.textContent = token.surface;
    kSpan.dataset.tokenIdx = idx;
    kSpan.dataset.start = token.start;
    kSpan.dataset.end = token.end;
    kSpan.dataset.surface = token.surface;
    kSpan.dataset.romaji = token.romaji;

    // 2. Romaji Token
    const rSpan = document.createElement('span');
    rSpan.className = 'word-token';
    if (token.pos === '助詞') rSpan.classList.add('particle');
    rSpan.textContent = token.romaji;
    rSpan.dataset.tokenIdx = idx;
    rSpan.dataset.start = token.start;
    rSpan.dataset.end = token.end;
    rSpan.dataset.surface = token.surface;
    rSpan.dataset.romaji = token.romaji;

    // Mutual hover highlight & English pronunciation popup
    const onEnter = (e) => {
      kSpan.classList.add('hovered');
      rSpan.classList.add('hovered');
      showDictionary(e, token);
    };
    const onLeave = () => {
      kSpan.classList.remove('hovered');
      rSpan.classList.remove('hovered');
      hideDictionary();
    };
    const onClick = () => {
      audioPlayer.currentTime = token.start;
      audioPlayer.play();
    };

    kSpan.addEventListener('mouseenter', onEnter);
    kSpan.addEventListener('mouseleave', onLeave);
    kSpan.addEventListener('click', onClick);

    rSpan.addEventListener('mouseenter', onEnter);
    rSpan.addEventListener('mouseleave', onLeave);
    rSpan.addEventListener('click', onClick);

    if (currentMode === 'ruby') {
      // Ruby format: Pronunciation directly above Kanji
      const ruby = document.createElement('ruby');
      ruby.className = 'ruby-unit';
      ruby.dataset.tokenIdx = idx;
      ruby.appendChild(kSpan);
      const rt = document.createElement('rt');
      rt.className = 'ruby-rt';
      rt.textContent = token.romaji;
      ruby.appendChild(rt);
      kanjiLine.appendChild(ruby);
    } else {
      kanjiLine.appendChild(kSpan);
      romajiLine.appendChild(rSpan);
    }
  });
}

function renderTokenInspector() {
  const sample = SAMPLES[currentSampleKey];
  tokenList.innerHTML = '';
  const seen = new Set();

  sample.lines.forEach(line => {
    line.romajiTokens.forEach(token => {
      if (token.pos === '記号' || seen.has(token.surface) || token.surface.startsWith('[')) return;
      seen.add(token.surface);

      const matches = lookupWord(token.surface) || lookupWord(token.romaji);
      const def = matches.length > 0 ? matches[0].meanings[0] : 'Definition available in full dictionary';
      const jlpt = matches.length > 0 && matches[0].jlpt ? `[${matches[0].jlpt}]` : '';

      const card = document.createElement('div');
      card.className = 'token-card';
      card.innerHTML = `
        <div class="token-card-kanji">${token.surface} ${jlpt}</div>
        <div class="token-card-romaji">${token.romaji} (${token.pos})</div>
        <div class="token-card-def">${def}</div>
      `;

      card.addEventListener('mouseenter', (e) => showDictionary(e, token));
      card.addEventListener('mouseleave', hideDictionary);

      tokenList.appendChild(card);
    });
  });
}

function showDictionary(e, token) {
  const matches = lookupWord(token.surface) || lookupWord(token.romaji);
  if (!matches || matches.length === 0) return;

  const entry = matches[0];
  document.getElementById('popRomaji').textContent = entry.romaji || token.romaji;
  document.getElementById('popKanji').textContent = entry.kanji || token.surface;
  document.getElementById('popJlpt').textContent = entry.jlpt || 'Vocab';
  document.getElementById('popPos').textContent = entry.pos || token.pos || 'Word';
  document.getElementById('popMeanings').textContent = entry.meanings.join('; ');

  const rect = e.target.getBoundingClientRect();
  const screenRect = document.querySelector('.video-screen').getBoundingClientRect();

  dictPopover.style.left = `${rect.left - screenRect.left + rect.width / 2}px`;
  dictPopover.style.top = `${rect.top - screenRect.top - 12}px`;
  dictPopover.classList.add('visible');
}

function hideDictionary() {
  dictPopover.classList.remove('visible');
}

// High-precision 60 FPS synchronization loop via requestAnimationFrame
function syncSubtitleLoop() {
  const curTime = audioPlayer.currentTime;
  const sample = SAMPLES[currentSampleKey];
  timeDisplay.textContent = `${curTime.toFixed(2)}s / ${sample.duration.toFixed(2)}s`;

  // Find line matching current playback time
  let activeLineIdx = -1;
  for (let i = 0; i < sample.lines.length; i++) {
    if (curTime >= sample.lines[i].start && curTime <= sample.lines[i].end) {
      activeLineIdx = i;
      break;
    }
  }

  // Switch line only when time enters a new segment
  if (activeLineIdx !== -1 && activeLineIdx !== currentLineIndex) {
    renderLine(activeLineIdx);
  }

  // Karaoke word highlight: Both Japanese Kanji and Romaji light up simultaneously!
  const kanjiEls = kanjiLine.querySelectorAll('.kanji-token');
  const romajiEls = romajiLine.querySelectorAll('.word-token');

  for (let idx = 0; idx < romajiEls.length; idx++) {
    const rEl = romajiEls[idx];
    const kEl = kanjiEls[idx];
    const start = parseFloat(rEl.dataset.start);
    const end = parseFloat(rEl.dataset.end);

    if (curTime >= start && curTime <= end) {
      rEl.classList.add('active');
      if (kEl) kEl.classList.add('active');
    } else {
      rEl.classList.remove('active');
      if (kEl) kEl.classList.remove('active');
    }
  }

  // Shadowing auto-pause
  if (toggleShadowing.checked && currentLineIndex !== -1) {
    const curLine = sample.lines[currentLineIndex];
    if (curTime >= curLine.end - 0.05 && lastPausedLineIndex !== currentLineIndex && !curLine.kanji.includes('音楽') && !curLine.kanji.includes('間')) {
      lastPausedLineIndex = currentLineIndex;
      audioPlayer.pause();
    }
  }

  if (!audioPlayer.paused) {
    animFrameId = requestAnimationFrame(syncSubtitleLoop);
  }
}

// Audio Player Events
audioPlayer.addEventListener('play', () => {
  btnPlayPause.innerHTML = '<kbd>Space</kbd> Pause';
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(syncSubtitleLoop);
});

audioPlayer.addEventListener('pause', () => {
  btnPlayPause.innerHTML = '<kbd>Space</kbd> Play';
  if (animFrameId) cancelAnimationFrame(animFrameId);
  syncSubtitleLoop(); // Single update on pause
});

audioPlayer.addEventListener('ended', () => {
  btnPlayPause.innerHTML = '<kbd>Space</kbd> Play';
  if (animFrameId) cancelAnimationFrame(animFrameId);
  syncSubtitleLoop();
});

audioPlayer.addEventListener('seeking', () => {
  syncSubtitleLoop();
});

// Controls & Shortcuts
sampleSelect.addEventListener('change', (e) => loadSample(e.target.value));
displayModeSelect.addEventListener('change', (e) => setDisplayMode(e.target.value));

toggleEnglish.addEventListener('change', (e) => {
  if (e.target.checked) {
    englishLine.classList.remove('blurred');
  } else {
    englishLine.classList.add('blurred');
  }
});

btnReplay.addEventListener('click', () => {
  const sample = SAMPLES[currentSampleKey];
  const line = sample.lines[currentLineIndex] || sample.lines[0];
  audioPlayer.currentTime = line.start;
  audioPlayer.play();
});

btnPlayPause.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
});

// Global Keyboard Shortcuts (M, E, R, P, Space)
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.key === 'm' || e.key === 'M') {
    const modes = ['dual', 'hover', 'ruby'];
    const nextIdx = (modes.indexOf(currentMode) + 1) % modes.length;
    setDisplayMode(modes[nextIdx]);
  } else if (e.key === 'e' || e.key === 'E') {
    toggleEnglish.checked = !toggleEnglish.checked;
    toggleEnglish.dispatchEvent(new Event('change'));
  } else if (e.key === 'r' || e.key === 'R') {
    btnReplay.click();
  } else if (e.key === 'p' || e.key === 'P') {
    toggleShadowing.checked = !toggleShadowing.checked;
  } else if (e.code === 'Space') {
    e.preventDefault();
    btnPlayPause.click();
  }
});

// Initialize on page load
setDisplayMode('dual');
loadSample('sample_1');
