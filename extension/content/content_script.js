// Japanese Anime Learning Extension - Content Script
(function () {
  if (window.__animeExtensionLoaded) return;
  window.__animeExtensionLoaded = true;

  console.log('[Anime Extension] Japanese Subtitle & Romaji Engine initialized.');

  let targetVideo = null;
  let overlayEl = null;
  let kanjiEl = null;
  let romajiEl = null;
  let englishEl = null;
  let dictPopover = null;
  let controlPillEl = null;
  let pillStatusEl = null;
  let pillStatusTextEl = null;
  let pillModeBtn = null;
  let pillEngineBtn = null;
  let pillEnBtn = null;
  let pillCcBtn = null;
  let pillTestBtn = null;
  let pillSizeMinus = null;
  let pillSizePlus = null;
  let pillSizeVal = null;
  let subAnimId = null;

  // Settings
  let displayMode = 'dual'; // 'dual', 'hover', 'ruby'
  let readingEngine = 'local'; // 'local' (Fast Yomitan ⚡), 'hybrid', 'neural'
  let showEnglish = true;
  let shadowingMode = false;
  let fontScale = 1.35; // Default 135% font scale (clearly visible)
  let activeSubtitleCue = null;
  let lastPausedCue = null;
  let isTestActive = false;
  let testTimer = null;
  let lastYouTubeText = '';
  let ytObserver = null;
  let userHasMovedOverlay = false;
  let userHasMovedPill = false;
  let lastRenderedJapanese = '';
  let lastRenderedEnglish = '';
  const translationCache = new Map();
  const romanizationCache = new Map();
  let loadedJapaneseCues = [];
  let loadedEnglishCues = [];
  let preFetchQueue = [];
  const pendingTranslations = new Set();
  let isPreFetchWorkerRunning = false;
  let lastLookaheadTime = -999;
  let hasEnglishTrackPresent = false;

  // Track classification helpers
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

  // Pre-sort dictionary keys by length descending for greedy segmentation
  let sortedDictKeys = [];
  function initDictKeys() {
    if (window.AnimeJapanese && window.AnimeJapanese.LOCAL_DICTIONARY) {
      sortedDictKeys = Object.keys(window.AnimeJapanese.LOCAL_DICTIONARY).sort((a, b) => b.length - a.length);
    }
  }

  // Load saved preferences from extension storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['displayMode', 'showEnglish', 'shadowingMode', 'fontScale', 'readingEngine'], (data) => {
      if (data.displayMode) displayMode = data.displayMode;
      if (data.readingEngine) readingEngine = data.readingEngine;
      if (data.showEnglish !== undefined) showEnglish = data.showEnglish;
      if (data.shadowingMode !== undefined) shadowingMode = data.shadowingMode;
      if (data.fontScale !== undefined) fontScale = data.fontScale;
      if (overlayEl) {
        applyDisplayMode();
        applyFontScale();
      }
      updatePillButtons();
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.displayMode) displayMode = changes.displayMode.newValue;
      if (changes.readingEngine) {
        readingEngine = changes.readingEngine.newValue;
        if (activeSubtitleCue) updateSubtitleDisplay(activeSubtitleCue.text);
      }
      if (changes.showEnglish !== undefined) showEnglish = changes.showEnglish.newValue;
      if (changes.shadowingMode !== undefined) shadowingMode = changes.shadowingMode.newValue;
      if (changes.fontScale !== undefined) {
        fontScale = changes.fontScale.newValue;
        applyFontScale();
      }
      if (overlayEl) applyDisplayMode();
      updatePillButtons();
    });
  }

  function applyFontScale() {
    if (overlayEl) {
      overlayEl.style.setProperty('--sub-scale', fontScale.toFixed(2));
    }
    if (pillSizeVal) {
      pillSizeVal.textContent = Math.round(fontScale * 100) + '%';
    }
  }

  function changeFontScale(delta) {
    fontScale = Math.max(0.8, Math.min(2.5, +(fontScale + delta).toFixed(2)));
    applyFontScale();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ fontScale });
    }
    console.log('[Anime Extension] Font scale set to:', fontScale);
  }

  function applyDisplayMode() {
    if (!overlayEl) return;
    overlayEl.classList.remove('mode-dual', 'mode-hover', 'mode-ruby');
    overlayEl.classList.add(`mode-${displayMode}`);
    if (activeSubtitleCue) {
      updateSubtitleDisplay(activeSubtitleCue.text);
    }
    updatePillButtons();
  }

  function updatePillButtons() {
    if (pillModeBtn) {
      const labels = { dual: 'Dual', hover: 'Hover-Only', ruby: 'Furigana' };
      pillModeBtn.textContent = `Mode: ${labels[displayMode] || displayMode}`;
    }
    if (pillEngineBtn) {
      const engineLabels = {
        local: 'Engine: Local ⚡',
        hybrid: 'Engine: Hybrid',
        neural: 'Engine: Cloud AI'
      };
      pillEngineBtn.textContent = engineLabels[readingEngine] || `Engine: ${readingEngine}`;
    }
    if (pillEnBtn) {
      pillEnBtn.textContent = showEnglish ? 'EN: ON' : 'EN: OFF';
      pillEnBtn.classList.toggle('active', showEnglish);
    }
  }

  function updatePillStatus(isActive, message) {
    if (!pillStatusEl || !pillStatusTextEl) return;
    pillStatusEl.className = 'anime-pill-status ' + (isActive ? 'active' : 'waiting');
    pillStatusTextEl.textContent = message;
  }

  // Find active video player on page
  function findVideo() {
    const videos = Array.from(document.querySelectorAll('video')).filter(v => {
      return v.isConnected && (v.offsetWidth > 150 || v.videoWidth > 0 || v.src || v.querySelector('source'));
    });
    if (videos.length > 0) {
      videos.sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight));
      return videos[0];
    }
    return null;
  }

  // Create UI overlay for subtitles and dictionary popover
  function createOverlay() {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.className = `anime-sub-container mode-${displayMode}`;
    overlayEl.style.display = 'none';

    kanjiEl = document.createElement('div');
    kanjiEl.className = 'anime-sub-kanji';

    romajiEl = document.createElement('div');
    romajiEl.className = 'anime-sub-romaji';

    englishEl = document.createElement('div');
    englishEl.className = 'anime-sub-english';

    dictPopover = document.createElement('div');
    dictPopover.className = 'anime-dict-popover';
    dictPopover.innerHTML = `
      <div class="anime-dict-pronunciation-badge">
        <span class="anime-badge-label">English Pronunciation:</span>
        <span class="anime-dict-romaji" id="extPopRomaji"></span>
      </div>
      <div class="anime-dict-header">
        <span class="anime-dict-kanji" id="extPopKanji"></span>
        <span class="anime-dict-jlpt" id="extPopJlpt"></span>
        <span class="anime-dict-pos" id="extPopPos"></span>
      </div>
      <div class="anime-dict-meanings" id="extPopMeanings"></div>
    `;

    overlayEl.appendChild(kanjiEl);
    overlayEl.appendChild(romajiEl);
    overlayEl.appendChild(englishEl);
    document.body.appendChild(overlayEl);
    document.body.appendChild(dictPopover);

    applyFontScale();
    makeDraggable(overlayEl, () => { userHasMovedOverlay = true; });
  }

  // Create floating control pill pinned to the video
  function createControlPill() {
    if (controlPillEl) return;

    controlPillEl = document.createElement('div');
    controlPillEl.className = 'anime-control-pill';
    controlPillEl.innerHTML = `
      <span class="anime-pill-title">🍙 Anime CC</span>
      <span class="anime-pill-status waiting" id="extPillStatus">
        <span class="anime-pill-status-dot"></span>
        <span class="anime-pill-status-text" id="extPillStatusText">Waiting for CC</span>
      </span>
      <button class="anime-pill-btn" id="extPillModeBtn" title="Press 'M' to switch">Mode: Dual</button>
      <button class="anime-pill-btn" id="extPillEngineBtn" title="Click to cycle reading engine (Local Yomitan ⚡ / Hybrid / Cloud AI)">Engine: Local ⚡</button>
      <div class="anime-pill-size-group" title="Adjust Subtitle Size (Hotkeys: [ or ] )">
        <button class="anime-pill-size-btn" id="extPillSizeMinus" title="Smaller font ([)">A-</button>
        <span class="anime-pill-size-val" id="extPillSizeVal">135%</span>
        <button class="anime-pill-size-btn" id="extPillSizePlus" title="Larger font (])">A+</button>
      </div>
      <button class="anime-pill-btn active" id="extPillEnBtn" title="Press 'E' to toggle">EN: ON</button>
      <button class="anime-pill-btn primary" id="extPillCcBtn" style="display:none;" title="Click to turn on CC in player">⚡ Turn on CC</button>
      <button class="anime-pill-btn" id="extPillTestBtn" title="Preview interactive anime subtitles">🧪 Test</button>
    `;

    document.body.appendChild(controlPillEl);

    pillStatusEl = controlPillEl.querySelector('#extPillStatus');
    pillStatusTextEl = controlPillEl.querySelector('#extPillStatusText');
    pillModeBtn = controlPillEl.querySelector('#extPillModeBtn');
    pillEngineBtn = controlPillEl.querySelector('#extPillEngineBtn');
    pillEnBtn = controlPillEl.querySelector('#extPillEnBtn');
    pillCcBtn = controlPillEl.querySelector('#extPillCcBtn');
    pillTestBtn = controlPillEl.querySelector('#extPillTestBtn');
    pillSizeMinus = controlPillEl.querySelector('#extPillSizeMinus');
    pillSizePlus = controlPillEl.querySelector('#extPillSizePlus');
    pillSizeVal = controlPillEl.querySelector('#extPillSizeVal');

    updatePillButtons();
    applyFontScale();

    // Size adjustment buttons
    pillSizeMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      changeFontScale(-0.15);
    });

    pillSizePlus.addEventListener('click', (e) => {
      e.stopPropagation();
      changeFontScale(0.15);
    });

    // Mode cycle button
    pillModeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleDisplayMode();
    });

    // Reading engine cycle button
    pillEngineBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleReadingEngine();
    });

    // English toggle button
    pillEnBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showEnglish = !showEnglish;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ showEnglish });
      }
      englishEl.style.display = (showEnglish && englishEl.textContent) ? 'block' : 'none';
      updatePillButtons();
    });

    // YouTube CC turn-on button
    pillCcBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ytSubBtn = document.querySelector('.ytp-subtitles-button');
      if (ytSubBtn) {
        ytSubBtn.click();
        pillCcBtn.style.display = 'none';
        updatePillStatus(true, 'YouTube CC Enabled');
      }
    });

    // Test subtitle button
    pillTestBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerTestSubtitle();
    });

    makeDraggable(controlPillEl, () => { userHasMovedPill = true; });
  }

  function cycleDisplayMode() {
    const modes = ['dual', 'hover', 'ruby'];
    const nextIdx = (modes.indexOf(displayMode) + 1) % modes.length;
    displayMode = modes[nextIdx];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ displayMode });
    }
    applyDisplayMode();
    console.log('[Anime Extension] Mode set to:', displayMode);
  }

  function cycleReadingEngine() {
    const engines = ['local', 'hybrid', 'neural'];
    const nextIdx = (engines.indexOf(readingEngine) + 1) % engines.length;
    readingEngine = engines[nextIdx];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ readingEngine });
    }
    updatePillButtons();
    console.log('[Anime Extension] Reading engine set to:', readingEngine);
    if (activeSubtitleCue) {
      updateSubtitleDisplay(activeSubtitleCue.text);
    }
  }

  function positionElements(video) {
    if (!video) return;
    const rect = video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Position Subtitle Box (bottom center of video)
    if (overlayEl && !userHasMovedOverlay) {
      overlayEl.style.position = 'fixed';
      overlayEl.style.left = `${rect.left + rect.width / 2}px`;
      overlayEl.style.top = `${rect.top + rect.height - 95}px`;
      overlayEl.style.transform = 'translateX(-50%)';
      overlayEl.style.bottom = 'auto';
    }

    // Position Control Pill (top left of video)
    if (controlPillEl && !userHasMovedPill) {
      controlPillEl.style.position = 'fixed';
      controlPillEl.style.left = `${Math.max(12, rect.left + 16)}px`;
      controlPillEl.style.top = `${Math.max(12, rect.top + 16)}px`;
      controlPillEl.style.transform = 'none';
    }
  }

  window.addEventListener('resize', () => positionElements(targetVideo));
  window.addEventListener('scroll', () => positionElements(targetVideo));

  function makeDraggable(el, onDragStart) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    el.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.classList.contains('anime-word-token') || e.target.classList.contains('anime-kanji-token')) return;
      isDragging = true;
      if (onDragStart) onDragStart();
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      el.style.transform = 'none';
      el.style.left = `${initialLeft}px`;
      el.style.top = `${initialTop}px`;
      el.style.bottom = 'auto';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = `${initialLeft + dx}px`;
      el.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  function showDictionary(e, word, romaji) {
    if (!window.AnimeJapanese || !window.AnimeJapanese.lookupWord) return;
    const matches = window.AnimeJapanese.lookupWord(word) || window.AnimeJapanese.lookupWord(romaji);
    if (!matches || matches.length === 0) return;

    const entry = matches[0];
    const kanjiTarget = document.getElementById('extPopKanji');
    const romajiTarget = document.getElementById('extPopRomaji');
    const jlptTarget = document.getElementById('extPopJlpt');
    const posTarget = document.getElementById('extPopPos');
    const meaningsTarget = document.getElementById('extPopMeanings');

    if (kanjiTarget) kanjiTarget.textContent = entry.kanji || word;
    if (romajiTarget) romajiTarget.textContent = entry.romaji || romaji;
    if (jlptTarget) jlptTarget.textContent = entry.jlpt || 'Vocab';
    if (posTarget) posTarget.textContent = entry.pos || 'Word';
    if (meaningsTarget) meaningsTarget.textContent = entry.meanings.join('; ');

    const rect = e.target.getBoundingClientRect();
    dictPopover.style.left = `${rect.left + rect.width / 2}px`;
    dictPopover.style.top = `${rect.top - 12}px`;
    dictPopover.classList.add('visible');
  }

  function hideDictionary() {
    if (dictPopover) dictPopover.classList.remove('visible');
  }

  // Greedy dictionary segmentation + morphological Yomitan tokenization
  function splitJapaneseWords(text) {
    if (!text) return [];
    if (sortedDictKeys.length === 0) initDictKeys();

    const tokens = [];
    let i = 0;
    while (i < text.length) {
      let match = null;

      // 1. Check longest inflected candidate using Yomitan de-inflector
      const maxLen = Math.min(12, text.length - i);
      for (let len = maxLen; len >= 2; len--) {
        const cand = text.slice(i, i + len);
        if (window.AnimeJapanese && window.AnimeJapanese.lookupWord) {
          const res = window.AnimeJapanese.lookupWord(cand);
          if (res && res.length > 0 && (res[0].lemma || res[0].pos !== 'kanji compound')) {
            match = cand;
            break;
          }
        }
      }

      // 2. Direct dictionary match
      if (!match) {
        for (const word of sortedDictKeys) {
          if (text.startsWith(word, i)) {
            match = word;
            break;
          }
        }
      }

      if (match) {
        tokens.push(match);
        i += match.length;
      } else {
        // Fallback: chunk kanji, katakana, hiragana, or symbols
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

  // Instant offline fallback: local dictionary synthesis (<1ms)
  function synthesizeLocalTranslation(text) {
    if (!text || !text.trim()) return '';
    try {
      const clean = text.replace(/<[^>]+>/g, '').trim();
      const tokens = splitJapaneseWords(clean);
      const parts = [];
      for (const tok of tokens) {
        if (window.AnimeJapanese && window.AnimeJapanese.lookupWord) {
          const matches = window.AnimeJapanese.lookupWord(tok);
          if (matches && matches.length > 0) {
            const raw = (matches[0].meanings[0] || '').replace(/\s*\([^)]*\)/g, '').split(/[,;]/)[0].trim();
            parts.push(raw || tok);
            continue;
          }
        }
        parts.push(tok);
      }
      return parts.join(' ');
    } catch (e) {
      return '';
    }
  }

  // Update control pill status with memory cache stats
  function updatePreCacheStatus() {
    if (pillStatusEl && pillStatusTextEl && targetVideo && !hasEnglishTrackPresent) {
      if (loadedJapaneseCues.length > 0 && activeSubtitleCue) {
        pillStatusTextEl.textContent = `Japanese CC Active (${translationCache.size} in memory)`;
      }
    }
  }

  // Rate-controlled background queue worker (prevents HTTP 429 rate-limiting)
  async function startPreFetchWorker() {
    if (isPreFetchWorkerRunning) return;
    isPreFetchWorkerRunning = true;

    while (preFetchQueue.length > 0) {
      const text = preFetchQueue.shift();
      pendingTranslations.delete(text);

      if (!translationCache.has(text)) {
        try {
          await fetchEnglishTranslation(text);
          updatePreCacheStatus();
        } catch (err) {
          console.debug('[Anime Extension] Pre-fetch worker error:', err);
        }
        // Polite delay (120ms) between background calls to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 120));
      }
    }

    isPreFetchWorkerRunning = false;
  }

  // Pre-fetch lookahead window of upcoming Japanese cues ahead of playback
  function preFetchLookahead(currentTime, windowSec = 35) {
    if (!loadedJapaneseCues || loadedJapaneseCues.length === 0) return;
    if (hasEnglishTrackPresent) return; // Native English track exists, no need to pre-translate

    // Filter upcoming cues within [currentTime - 1.0, currentTime + windowSec]
    const upcoming = loadedJapaneseCues.filter(cue => {
      return cue.startTime >= currentTime - 1.0 && cue.startTime <= currentTime + windowSec;
    });

    let addedCount = 0;
    for (const cue of upcoming) {
      const clean = cue.text.replace(/<[^>]+>/g, '').trim();
      if (!clean) continue;
      if (translationCache.has(clean) || pendingTranslations.has(clean)) continue;

      pendingTranslations.add(clean);
      preFetchQueue.push(clean);
      addedCount++;
    }

    if (addedCount > 0) {
      startPreFetchWorker();
    }
  }

  // Asynchronous real-time translation with memory cache and contextual neural romanization
  async function fetchEnglishTranslation(japaneseText) {
    if (!japaneseText || !japaneseText.trim()) return '';
    const clean = japaneseText.replace(/<[^>]+>/g, '').trim();
    if (translationCache.has(clean)) {
      return translationCache.get(clean);
    }

    // 1. Try public web translation API (requesting translation &dt=t and romanization &dt=rm)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&dt=rm&q=${encodeURIComponent(clean)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const translated = data[0].map(item => item && item[0]).filter(Boolean).join('');
          let fullRomanization = '';
          if (Array.isArray(data[0])) {
            for (const item of data[0]) {
              if (item && item[3]) {
                fullRomanization += (fullRomanization ? ' ' : '') + item[3];
              }
            }
          }
          if (fullRomanization) {
            romanizationCache.set(clean, fullRomanization);
          }
          if (translated) {
            translationCache.set(clean, translated);
            return translated;
          }
        }
      }
    } catch (err) {
      console.debug('[Anime Extension] Web translation unavailable, using dictionary fallback:', err);
    }

    // 2. Offline fallback: local dictionary synthesis
    const fallback = synthesizeLocalTranslation(clean);
    if (fallback) {
      translationCache.set(clean, fallback);
    }
    return fallback;
  }

  // Convert raw Japanese & English subtitle text into synchronized, interactive 3-tier Furigana & Rōmaji display
  function updateSubtitleDisplay(japaneseText, englishText = '') {
    if (!overlayEl) createOverlay();
    if (!controlPillEl) createControlPill();

    if ((!japaneseText || !japaneseText.trim()) && (!englishText || !englishText.trim())) {
      if (!isTestActive) overlayEl.style.display = 'none';
      return;
    }

    overlayEl.style.display = 'block';
    overlayEl.className = `anime-sub-container mode-${displayMode}`;
    positionElements(targetVideo);

    // If only English is present (no Japanese tracks available)
    if (!japaneseText && englishText) {
      kanjiEl.style.display = 'none';
      romajiEl.style.display = 'none';
      englishEl.textContent = englishText;
      englishEl.style.display = showEnglish ? 'block' : 'none';
      return;
    }

    kanjiEl.style.display = 'flex';
    kanjiEl.innerHTML = '';
    romajiEl.innerHTML = '';

    // Determine English translation synchronously from memory cache or instant local fallback
    let resolvedEnglish = englishText;
    const cleanJa = japaneseText ? japaneseText.replace(/<[^>]+>/g, '').trim() : '';

    if (cleanJa && !resolvedEnglish) {
      // 1. Instant synchronous in-memory cache lookup (0ms latency!)
      if (translationCache.has(cleanJa)) {
        resolvedEnglish = translationCache.get(cleanJa);
      } else {
        // 2. Instant offline dictionary synthesis (<1ms) - guarantees no blank gap!
        resolvedEnglish = synthesizeLocalTranslation(cleanJa);

        // 3. Proactively fetch high-quality sentence translation in background and update in place
        fetchEnglishTranslation(cleanJa).then((translated) => {
          if (translated) {
            const currentJa = activeSubtitleCue?.text?.replace(/<[^>]+>/g, '').trim();
            const currentYt = lastYouTubeText?.replace(/<[^>]+>/g, '').trim();
            if (currentJa === cleanJa || currentYt === cleanJa || isTestActive) {
              englishEl.textContent = translated;
              if (showEnglish) englishEl.style.display = 'block';

              // If Neural engine mode is selected and contextual romanization is ready, refine Romaji line
              if (readingEngine === 'neural' && displayMode !== 'ruby' && romanizationCache.has(cleanJa)) {
                romajiEl.textContent = romanizationCache.get(cleanJa);
              }
            }
          }
        });
      }
    }

    englishEl.textContent = resolvedEnglish;
    englishEl.style.display = (showEnglish && resolvedEnglish) ? 'block' : 'none';

    // Word tokenization
    const rawTokens = splitJapaneseWords(japaneseText);

    rawTokens.forEach((token, idx) => {
      // 1. Japanese Kanji Token
      const kSpan = document.createElement('span');
      kSpan.className = 'anime-kanji-token';
      kSpan.textContent = token;
      kSpan.dataset.tokenIdx = idx;

      // 2. Romaji Token
      const rSpan = document.createElement('span');
      rSpan.className = 'anime-word-token';
      const isParticle = ['は', 'が', 'を', 'に', 'で', 'の', 'も', 'か', 'ね', 'よ', 'から', 'まで', 'と'].includes(token);
      if (isParticle) rSpan.classList.add('particle');
      rSpan.dataset.tokenIdx = idx;

      let rom = '';
      let shortMeaning = '';

      // 3. Dictionary Lookup for True Phonetic Romaji & Concise Meaning Gloss
      if (window.AnimeJapanese && window.AnimeJapanese.lookupWord) {
        const matches = window.AnimeJapanese.lookupWord(token);
        if (matches && matches.length > 0) {
          const entry = matches[0];
          if (entry.romaji) rom = entry.romaji;
          else if (entry.kana && window.wanakana) rom = window.wanakana.toRomaji(entry.kana);

          const raw = entry.meanings[0] || '';
          shortMeaning = raw.replace(/\s*\([^)]*\)/g, '').split(/[,;]/)[0].trim();
        }
      }

      // Phonetic particle overrides and wanakana fallback
      if (!rom) {
        if (token === 'は') rom = 'wa';
        else if (token === 'へ') rom = 'e';
        else if (token === 'を') rom = 'o';
        else if (window.wanakana) {
          rom = window.wanakana.toRomaji(token);
        } else {
          rom = token;
        }
      }

      // Joyo Kanji Safety Net: ensure NO raw Kanji ever appears in the pronunciation tier
      if (/[\u4e00-\u9faf]/.test(rom) && window.AnimeJapanese) {
        let convertedKana = '';
        for (const ch of rom) {
          const info = window.AnimeJapanese.getKanjiInfo
            ? window.AnimeJapanese.getKanjiInfo(ch)
            : (window.AnimeJapanese.KANJI_READINGS && window.AnimeJapanese.KANJI_READINGS[ch]);
          if (info && info.kana) {
            convertedKana += info.kana;
          } else if (info && info.romaji) {
            convertedKana += info.romaji;
          } else {
            convertedKana += ch;
          }
        }
        if (window.wanakana) {
          rom = window.wanakana.toRomaji(convertedKana);
        } else {
          rom = convertedKana;
        }
      }

      rSpan.textContent = rom;
      rSpan.dataset.surface = token;
      rSpan.dataset.romaji = rom;

      if (!shortMeaning && isParticle) {
        const particleMeanings = {
          'は': 'topic', 'が': 'subj', 'を': 'obj', 'に': 'to/at', 'で': 'by/at',
          'の': "'s/of", 'も': 'also', 'か': '?', 'ね': 'right?', 'よ': '!',
          'から': 'from', 'まで': 'until', 'と': 'with/and'
        };
        shortMeaning = particleMeanings[token] || '';
      }

      if (!shortMeaning && window.AnimeJapanese) {
        const info = window.AnimeJapanese.getKanjiInfo
          ? window.AnimeJapanese.getKanjiInfo(token)
          : (window.AnimeJapanese.KANJI_READINGS && window.AnimeJapanese.KANJI_READINGS[token]);
        if (info && info.meaning) {
          shortMeaning = info.meaning;
        } else if (/^[\u4e00-\u9faf]+$/.test(token) && window.AnimeJapanese.getKanjiInfo) {
          const meanings = [];
          for (const ch of token) {
            const ci = window.AnimeJapanese.getKanjiInfo(ch);
            if (ci && ci.meaning) meanings.push(ci.meaning);
          }
          if (meanings.length > 0) shortMeaning = meanings.join('; ');
        }
      }

      // Mutual hover & dictionary popover
      const onEnter = (e) => {
        kSpan.classList.add('hovered');
        rSpan.classList.add('hovered');
        showDictionary(e, token, rom);
      };
      const onLeave = () => {
        kSpan.classList.remove('hovered');
        rSpan.classList.remove('hovered');
        hideDictionary();
      };

      kSpan.addEventListener('mouseenter', onEnter);
      kSpan.addEventListener('mouseleave', onLeave);

      rSpan.addEventListener('mouseenter', onEnter);
      rSpan.addEventListener('mouseleave', onLeave);

      if (displayMode === 'ruby') {
        const ruby = document.createElement('ruby');
        ruby.className = 'anime-ruby-unit';
        ruby.dataset.tokenIdx = idx;

        // Tier 1: English Pronunciation (Romaji)
        const rt = document.createElement('rt');
        rt.className = 'anime-ruby-rt';
        rt.textContent = rom;
        ruby.appendChild(rt);

        // Tier 2: Japanese Character (Kanji/Kana)
        ruby.appendChild(kSpan);

        // Tier 3: Concise English Word Meaning Gloss
        if (shortMeaning) {
          const gloss = document.createElement('span');
          gloss.className = 'anime-ruby-gloss';
          gloss.textContent = shortMeaning;
          gloss.title = shortMeaning;
          ruby.appendChild(gloss);
        }

        kanjiEl.appendChild(ruby);
      } else {
        kanjiEl.appendChild(kSpan);
        romajiEl.appendChild(rSpan);
      }
    });
  }

  // Simulated Karaoke Animation for non-timed subtitles or test captions (pause & resume aware)
  let simulatedKaraokeInterval = null;
  let simulatedKaraokeCurrentIdx = 0;
  let simulatedKaraokeTotal = 0;
  let simulatedKaraokeIntervalMs = 200;
  let isSimulatedKaraokePaused = false;

  function stopSimulatedKaraoke() {
    if (simulatedKaraokeInterval) {
      clearInterval(simulatedKaraokeInterval);
      simulatedKaraokeInterval = null;
    }
    simulatedKaraokeCurrentIdx = 0;
    simulatedKaraokeTotal = 0;
    isSimulatedKaraokePaused = false;
  }

  function pauseSimulatedKaraoke() {
    if (simulatedKaraokeInterval) {
      clearInterval(simulatedKaraokeInterval);
      simulatedKaraokeInterval = null;
    }
    isSimulatedKaraokePaused = true;
  }

  function resumeSimulatedKaraoke() {
    if (isSimulatedKaraokePaused && simulatedKaraokeTotal > 0 && simulatedKaraokeCurrentIdx < simulatedKaraokeTotal) {
      if (!targetVideo || !targetVideo.paused) {
        isSimulatedKaraokePaused = false;
        applySimulatedKaraokeHighlight(simulatedKaraokeCurrentIdx);
        simulatedKaraokeInterval = setInterval(stepSimulatedKaraoke, simulatedKaraokeIntervalMs);
      }
    }
  }

  function applySimulatedKaraokeHighlight(idx) {
    const kTokens = kanjiEl ? kanjiEl.querySelectorAll('.anime-kanji-token') : [];
    const rTokens = romajiEl ? romajiEl.querySelectorAll('.anime-word-token') : [];
    const rubyUnits = kanjiEl ? kanjiEl.querySelectorAll('.anime-ruby-unit') : [];
    const total = Math.max(kTokens.length, rTokens.length, rubyUnits.length);

    for (let i = 0; i < total; i++) {
      const isActive = (i === idx);
      if (rTokens[i]) rTokens[i].classList.toggle('active', isActive);
      if (kTokens[i]) kTokens[i].classList.toggle('active', isActive);
      if (rubyUnits[i]) rubyUnits[i].classList.toggle('active', isActive);
    }
  }

  function stepSimulatedKaraoke() {
    applySimulatedKaraokeHighlight(simulatedKaraokeCurrentIdx);
    simulatedKaraokeCurrentIdx++;
    if (simulatedKaraokeCurrentIdx >= simulatedKaraokeTotal) {
      stopSimulatedKaraoke();
    }
  }

  function startSimulatedKaraoke(durationMs = 3000) {
    stopSimulatedKaraoke();
    const kTokens = kanjiEl ? kanjiEl.querySelectorAll('.anime-kanji-token') : [];
    const rTokens = romajiEl ? romajiEl.querySelectorAll('.anime-word-token') : [];
    const rubyUnits = kanjiEl ? kanjiEl.querySelectorAll('.anime-ruby-unit') : [];
    simulatedKaraokeTotal = Math.max(kTokens.length, rTokens.length, rubyUnits.length);
    if (simulatedKaraokeTotal === 0) return;

    simulatedKaraokeCurrentIdx = 0;
    simulatedKaraokeIntervalMs = Math.max(100, Math.floor(durationMs / simulatedKaraokeTotal));

    // If video is currently paused, highlight first token and freeze without running timer
    if (targetVideo && targetVideo.paused) {
      isSimulatedKaraokePaused = true;
      applySimulatedKaraokeHighlight(0);
      return;
    }

    stepSimulatedKaraoke();
    simulatedKaraokeInterval = setInterval(stepSimulatedKaraoke, simulatedKaraokeIntervalMs);
  }

  // Demo quotes for interactive instant testing
  const DEMO_QUOTES = [
    {
      ja: 'お前はもう死んでいる。',
      en: 'You are already dead. (Fist of the North Star)'
    },
    {
      ja: '何！？貴様の攻撃など効かぬ！',
      en: 'What!? An attack like yours will never work on me!'
    },
    {
      ja: '俺たちの戦いはこれからだ！',
      en: 'Our battle begins from now!'
    },
    {
      ja: '雨が降って、天気が寒いです。',
      en: 'It is raining, and the weather is cold.'
    }
  ];
  let demoIdx = 0;

  function triggerTestSubtitle() {
    isTestActive = true;
    if (testTimer) clearTimeout(testTimer);

    const quote = DEMO_QUOTES[demoIdx % DEMO_QUOTES.length];
    demoIdx++;

    updateSubtitleDisplay(quote.ja, quote.en);

    if (targetVideo) {
      const curTime = targetVideo.currentTime;
      const durationSec = 3.2;
      activeSubtitleCue = {
        startTime: curTime,
        endTime: curTime + durationSec,
        text: quote.ja
      };
      if (!targetVideo.paused) {
        if (subAnimId) cancelAnimationFrame(subAnimId);
        subAnimId = requestAnimationFrame(syncVideoFrame);
      } else {
        syncVideoFrame();
      }
    } else {
      startSimulatedKaraoke(3200);
    }
    updatePillStatus(true, 'Test Subtitle Active (Hover any word!)');

    testTimer = setTimeout(() => {
      isTestActive = false;
      if (!lastYouTubeText && (!activeSubtitleCue || activeSubtitleCue.text === quote.ja)) {
        activeSubtitleCue = null;
        if (overlayEl) overlayEl.style.display = 'none';
        updatePillStatus(false, 'Waiting for CC');
      }
    }, 7500);
  }

  // Monitor YouTube captions DOM (.ytp-caption-segment)
  function observeYouTubeCaptions() {
    if (ytObserver) return;

    const checkYouTubeControls = () => {
      const ytSubBtn = document.querySelector('.ytp-subtitles-button');
      if (ytSubBtn && pillCcBtn) {
        const isPressed = ytSubBtn.getAttribute('aria-pressed') === 'true';
        if (!isPressed) {
          pillCcBtn.style.display = 'inline-block';
          updatePillStatus(false, 'Turn on CC (Press C)');
        } else {
          pillCcBtn.style.display = 'none';
          if (!activeSubtitleCue && !isTestActive) {
            updatePillStatus(true, 'YouTube CC Active');
          }
        }
      }
    };

    checkYouTubeControls();
    setInterval(checkYouTubeControls, 2500);

    const targetNode = document.querySelector('.ytp-caption-window-container') ||
                       document.querySelector('#movie_player') ||
                       document.body;

    ytObserver = new MutationObserver(() => {
      const segments = document.querySelectorAll('.ytp-caption-segment');
      if (segments && segments.length > 0) {
        const fullText = Array.from(segments).map(s => s.textContent.trim()).filter(Boolean).join(' ');
        if (fullText && fullText !== lastYouTubeText) {
          lastYouTubeText = fullText;
          // Check if Japanese characters are present
          const hasJapanese = /[\u3040-\u309f\u30a0-\u30fa\u4e00-\u9faf]/.test(fullText);
          if (hasJapanese) {
            updateSubtitleDisplay(fullText, '');
            const curTime = targetVideo ? targetVideo.currentTime : 0;
            const durationSec = Math.max(2.0, fullText.length * 0.28);
            activeSubtitleCue = {
              startTime: curTime,
              endTime: curTime + durationSec,
              text: fullText
            };
            updatePillStatus(true, 'Japanese CC Active (+ English)');

            if (targetVideo && !targetVideo.paused) {
              if (subAnimId) cancelAnimationFrame(subAnimId);
              subAnimId = requestAnimationFrame(syncVideoFrame);
            } else if (!targetVideo) {
              startSimulatedKaraoke(durationSec * 1000);
            } else {
              // Video is currently paused - freeze subtitle without animating
              syncVideoFrame();
            }
          } else {
            // Text is English captions
            activeSubtitleCue = null;
            updateSubtitleDisplay('', fullText);
            updatePillStatus(true, 'English CC Active');
          }
        }
      } else {
        if (lastYouTubeText !== '') {
          lastYouTubeText = '';
          activeSubtitleCue = null;
          stopSimulatedKaraoke();
          if (!isTestActive) {
            if (overlayEl) overlayEl.style.display = 'none';
            updatePillStatus(false, 'Waiting for CC');
          }
        }
      }
    });

    ytObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true
    });
    console.log('[Anime Extension] YouTube caption MutationObserver attached.');
  }

  // Monitor standard HTML5 video player subtitles (Native CC detection with 60FPS dual-track sync)
  function attachSubtitleListener(video) {
    if (!video) return;

    function indexTracks() {
      if (!video.textTracks || video.textTracks.length === 0) return;
      let hasNewJaCues = false;
      const seenJa = new Set(loadedJapaneseCues.map(c => `${c.startTime.toFixed(2)}_${c.text}`));
      let enFound = false;

      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (track.mode === 'disabled') track.mode = 'hidden';

        if (isEnglishTrack(track)) {
          enFound = true;
        }

        if (!track.cues || track.cues.length === 0) continue;

        const sampleText = track.cues[0]?.text || '';
        if (isJapaneseTrack(track, sampleText)) {
          for (let c = 0; c < track.cues.length; c++) {
            const cue = track.cues[c];
            const text = (cue.text || '').replace(/<[^>]+>/g, '').trim();
            const key = `${cue.startTime.toFixed(2)}_${text}`;
            if (text && !seenJa.has(key)) {
              seenJa.add(key);
              loadedJapaneseCues.push({
                startTime: cue.startTime,
                endTime: cue.endTime,
                text: text
              });
              hasNewJaCues = true;
            }
          }
        } else if (isEnglishTrack(track, sampleText)) {
          for (let c = 0; c < track.cues.length; c++) {
            const cue = track.cues[c];
            const text = (cue.text || '').replace(/<[^>]+>/g, '').trim();
            if (text) {
              loadedEnglishCues.push({
                startTime: cue.startTime,
                endTime: cue.endTime,
                text: text
              });
            }
          }
        }
      }

      hasEnglishTrackPresent = enFound;

      if (hasNewJaCues) {
        loadedJapaneseCues.sort((a, b) => a.startTime - b.startTime);
        console.log(`[Anime Extension] Indexed ${loadedJapaneseCues.length} Japanese cues in memory.`);
        preFetchLookahead(video.currentTime, 35);
      }
    }

    // Enable all HTML5 TextTracks in hidden mode so browser parses cues
    function enableTracks() {
      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.mode === 'disabled') {
            track.mode = 'hidden'; // 'hidden' loads cues without browser default black box
          }
          track.oncuechange = () => {
            indexTracks();
            syncVideoFrame();
          };
        }
        indexTracks();
      }
    }

    enableTracks();
    if (video.textTracks) {
      video.textTracks.onaddtrack = () => enableTracks();
    }

    function syncVideoFrame() {
      let foundCue = false;

      // 1. Inspect native TextTracks for both Japanese and English active cues
      if (video.textTracks && video.textTracks.length > 0) {
        let bestJaCue = null;
        let bestEnCue = null;

        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.mode === 'disabled') track.mode = 'hidden';

          const cues = track.activeCues;
          const cue = (cues && cues.length > 0) ? cues[0] : null;
          const cueText = cue ? cue.text : '';

          if (isJapaneseTrack(track, cueText)) {
            if (!bestJaCue && cue) bestJaCue = cue;
          } else if (isEnglishTrack(track, cueText)) {
            if (!bestEnCue && cue) bestEnCue = cue;
          } else if (cue) {
            if (/[\u3040-\u309f\u30a0-\u30fa\u4e00-\u9faf]/.test(cueText)) {
              if (!bestJaCue) bestJaCue = cue;
            } else if (!bestEnCue) {
              bestEnCue = cue;
            }
          }
        }

        // If Japanese cue exists, search English tracks for overlapping/closest cue (±0.6s)
        if (bestJaCue && !bestEnCue) {
          for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            if (isEnglishTrack(track) && track.cues) {
              for (let c = 0; c < track.cues.length; c++) {
                const cand = track.cues[c];
                if (cand.startTime <= video.currentTime + 0.5 && cand.endTime >= video.currentTime - 0.5) {
                  bestEnCue = cand;
                  break;
                }
              }
              if (bestEnCue) break;
            }
          }
        }

        // If English cue exists, search Japanese tracks for overlapping/closest cue (±0.6s)
        if (bestEnCue && !bestJaCue) {
          for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            if (isJapaneseTrack(track) && track.cues) {
              for (let c = 0; c < track.cues.length; c++) {
                const cand = track.cues[c];
                if (cand.startTime <= video.currentTime + 0.5 && cand.endTime >= video.currentTime - 0.5) {
                  bestJaCue = cand;
                  break;
                }
              }
              if (bestJaCue) break;
            }
          }
        }

        // Fallback to indexed cues in memory if track.activeCues has browser delay
        if (!bestJaCue && loadedJapaneseCues.length > 0) {
          bestJaCue = loadedJapaneseCues.find(c => video.currentTime >= c.startTime && video.currentTime <= c.endTime) || null;
        }
        if (!bestEnCue && loadedEnglishCues.length > 0) {
          bestEnCue = loadedEnglishCues.find(c => video.currentTime >= c.startTime && video.currentTime <= c.endTime) || null;
        }

        const currentJaText = bestJaCue ? bestJaCue.text : '';
        const currentEnText = bestEnCue ? bestEnCue.text : '';

        if (currentJaText || currentEnText) {
          foundCue = true;
          const jaChanged = currentJaText !== lastRenderedJapanese;
          const enChanged = currentEnText !== lastRenderedEnglish;

          if (jaChanged || enChanged) {
            lastRenderedJapanese = currentJaText;
            lastRenderedEnglish = currentEnText;
            activeSubtitleCue = bestJaCue || bestEnCue;
            updateSubtitleDisplay(currentJaText, currentEnText);

            const statusText = (bestJaCue && bestEnCue) ? 'Dual CC Active (JA + EN)' :
                               bestJaCue ? `Japanese CC Active (${translationCache.size} in memory)` : 'English CC Active';
            updatePillStatus(true, statusText);
          }

          // Shadowing auto-pause
          if (shadowingMode && bestJaCue && video.currentTime >= bestJaCue.endTime - 0.08 && lastPausedCue !== bestJaCue) {
            lastPausedCue = bestJaCue;
            video.pause();
          }
        }
      }

      if (!foundCue && !isTestActive && !lastYouTubeText) {
        if (activeSubtitleCue || lastRenderedJapanese || lastRenderedEnglish) {
          activeSubtitleCue = null;
          lastRenderedJapanese = '';
          lastRenderedEnglish = '';
          if (overlayEl) overlayEl.style.display = 'none';
          updatePillStatus(false, 'Waiting for CC');
        }
      }

      // 2. High-precision word-level karaoke progress: Both Japanese, Romaji, and Furigana units light up together!
      const kTokens = kanjiEl ? kanjiEl.querySelectorAll('.anime-kanji-token') : [];
      const rTokens = romajiEl ? romajiEl.querySelectorAll('.anime-word-token') : [];
      const rubyUnits = kanjiEl ? kanjiEl.querySelectorAll('.anime-ruby-unit') : [];
      const tokenCount = Math.max(kTokens.length, rTokens.length, rubyUnits.length);

      if (tokenCount > 0 && activeSubtitleCue) {
        const duration = activeSubtitleCue.endTime - activeSubtitleCue.startTime;
        if (duration > 0) {
          const progress = Math.max(0, Math.min(1, (video.currentTime - activeSubtitleCue.startTime) / duration));
          const activeIdx = Math.floor(progress * tokenCount);

          for (let idx = 0; idx < tokenCount; idx++) {
            const isActive = (idx === activeIdx);
            if (rTokens[idx]) rTokens[idx].classList.toggle('active', isActive);
            if (kTokens[idx]) kTokens[idx].classList.toggle('active', isActive);
            if (rubyUnits[idx]) rubyUnits[idx].classList.toggle('active', isActive);
          }
        }
      }

      if (!video.paused) {
        if (subAnimId) cancelAnimationFrame(subAnimId);
        subAnimId = requestAnimationFrame(syncVideoFrame);
      }
    }

    video.addEventListener('play', () => {
      if (subAnimId) cancelAnimationFrame(subAnimId);
      resumeSimulatedKaraoke();
      subAnimId = requestAnimationFrame(syncVideoFrame);
    });

    video.addEventListener('pause', () => {
      if (subAnimId) {
        cancelAnimationFrame(subAnimId);
        subAnimId = null;
      }
      pauseSimulatedKaraoke();
      syncVideoFrame();
    });

    video.addEventListener('ended', () => {
      if (subAnimId) {
        cancelAnimationFrame(subAnimId);
        subAnimId = null;
      }
      stopSimulatedKaraoke();
      syncVideoFrame();
    });

    video.addEventListener('loadedmetadata', indexTracks);
    video.addEventListener('canplay', indexTracks);

    video.addEventListener('seeking', () => {
      // Reprioritize pre-fetch queue immediately around newly sought position
      preFetchQueue = [];
      pendingTranslations.clear();
      lastLookaheadTime = video.currentTime;
      preFetchLookahead(video.currentTime, 35);
      syncVideoFrame();
    });

    video.addEventListener('timeupdate', () => {
      if (Math.abs(video.currentTime - lastLookaheadTime) >= 2.0) {
        lastLookaheadTime = video.currentTime;
        if (loadedJapaneseCues.length === 0) {
          indexTracks();
        }
        preFetchLookahead(video.currentTime, 35);
      }
      if (video.paused) {
        syncVideoFrame();
      }
    });
  }

  // Keyboard Shortcuts (M: Mode, E: English, R: Replay cue, P: Shadowing)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'm' || e.key === 'M') {
      cycleDisplayMode();
    } else if (e.key === 'e' || e.key === 'E') {
      showEnglish = !showEnglish;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ showEnglish });
      }
      englishEl.style.display = (showEnglish && englishEl.textContent) ? 'block' : 'none';
      updatePillButtons();
    } else if (e.key === 'r' || e.key === 'R') {
      if (activeSubtitleCue && targetVideo) {
        targetVideo.currentTime = activeSubtitleCue.startTime;
        targetVideo.play();
      }
    } else if (e.key === 'p' || e.key === 'P') {
      shadowingMode = !shadowingMode;
      console.log('[Anime Extension] Shadowing mode:', shadowingMode);
    } else if (e.key === '[' || e.key === '{') {
      changeFontScale(-0.15);
    } else if (e.key === ']' || e.key === '}') {
      changeFontScale(0.15);
    }
  });

  // Attach to video on page and monitor for SPA navigation
  function setupExtension() {
    const video = findVideo();
    if (video && video !== targetVideo) {
      targetVideo = video;
      createOverlay();
      createControlPill();
      positionElements(video);
      attachSubtitleListener(video);
      observeYouTubeCaptions();
      console.log('[Anime Extension] Hooked into video player:', video);
    }
  }

  setupExtension();
  setInterval(setupExtension, 1200);
})();
