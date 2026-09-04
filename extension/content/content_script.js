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
  let pillEnBtn = null;
  let pillCcBtn = null;
  let pillTestBtn = null;
  let pillSizeMinus = null;
  let pillSizePlus = null;
  let pillSizeVal = null;

  // Settings
  let displayMode = 'dual'; // 'dual', 'hover', 'ruby'
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

  // Pre-sort dictionary keys by length descending for greedy segmentation
  let sortedDictKeys = [];
  function initDictKeys() {
    if (window.AnimeJapanese && window.AnimeJapanese.LOCAL_DICTIONARY) {
      sortedDictKeys = Object.keys(window.AnimeJapanese.LOCAL_DICTIONARY).sort((a, b) => b.length - a.length);
    }
  }

  // Load saved preferences from extension storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['displayMode', 'showEnglish', 'shadowingMode', 'fontScale'], (data) => {
      if (data.displayMode) displayMode = data.displayMode;
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

  // Greedy dictionary segmentation + morphological tokenization
  function splitJapaneseWords(text) {
    if (!text) return [];
    if (sortedDictKeys.length === 0) initDictKeys();

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

  // Convert raw Japanese subtitle text into clickable, highlighted Rōmaji words
  function updateSubtitleDisplay(japaneseText, englishText = '') {
    if (!overlayEl) createOverlay();
    if (!controlPillEl) createControlPill();

    if (!japaneseText || !japaneseText.trim()) {
      if (!isTestActive) overlayEl.style.display = 'none';
      return;
    }

    overlayEl.style.display = 'block';
    overlayEl.className = `anime-sub-container mode-${displayMode}`;
    positionElements(targetVideo);

    kanjiEl.style.display = 'flex';
    kanjiEl.innerHTML = '';
    romajiEl.innerHTML = '';

    englishEl.textContent = englishText;
    englishEl.style.display = (showEnglish && englishText) ? 'block' : 'none';

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
      if (token === 'は') rom = 'wa';
      else if (token === 'へ') rom = 'e';
      else if (token === 'を') rom = 'o';
      else if (window.wanakana) {
        rom = window.wanakana.toRomaji(token);
      } else {
        rom = token;
      }

      rSpan.textContent = rom;
      rSpan.dataset.surface = token;
      rSpan.dataset.romaji = rom;

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
        ruby.appendChild(kSpan);
        const rt = document.createElement('rt');
        rt.className = 'anime-ruby-rt';
        rt.textContent = rom;
        ruby.appendChild(rt);
        kanjiEl.appendChild(ruby);
      } else {
        kanjiEl.appendChild(kSpan);
        romajiEl.appendChild(rSpan);
      }
    });
  }

  // Simulated Karaoke Animation for non-timed subtitles or test captions
  let simulatedKaraokeInterval = null;
  function startSimulatedKaraoke(durationMs = 3000) {
    if (simulatedKaraokeInterval) clearInterval(simulatedKaraokeInterval);
    const kTokens = kanjiEl ? kanjiEl.querySelectorAll('.anime-kanji-token') : [];
    const rTokens = romajiEl ? romajiEl.querySelectorAll('.anime-word-token') : [];
    const total = Math.max(kTokens.length, rTokens.length);
    if (total === 0) return;

    let currentIdx = 0;
    const intervalMs = Math.max(100, Math.floor(durationMs / total));

    simulatedKaraokeInterval = setInterval(() => {
      for (let i = 0; i < total; i++) {
        if (i === currentIdx) {
          if (rTokens[i]) rTokens[i].classList.add('active');
          if (kTokens[i]) kTokens[i].classList.add('active');
        } else {
          if (rTokens[i]) rTokens[i].classList.remove('active');
          if (kTokens[i]) kTokens[i].classList.remove('active');
        }
      }
      currentIdx++;
      if (currentIdx >= total) {
        clearInterval(simulatedKaraokeInterval);
        simulatedKaraokeInterval = null;
      }
    }, intervalMs);
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
    startSimulatedKaraoke(3200);
    updatePillStatus(true, 'Test Subtitle Active (Hover any word!)');

    testTimer = setTimeout(() => {
      isTestActive = false;
      if (!lastYouTubeText && !activeSubtitleCue) {
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
            updateSubtitleDisplay(fullText);
            startSimulatedKaraoke(Math.max(2000, fullText.length * 280));
            updatePillStatus(true, 'Japanese CC Active');
          } else {
            // Text is present but not Japanese (e.g. English captions)
            updatePillStatus(false, 'CC is English: Switch to Japanese in ⚙️');
          }
        }
      } else {
        if (lastYouTubeText !== '') {
          lastYouTubeText = '';
          if (!isTestActive && !activeSubtitleCue) {
            if (overlayEl) overlayEl.style.display = 'none';
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

  // Monitor standard HTML5 video player subtitles (Native CC detection with 60FPS sync)
  function attachSubtitleListener(video) {
    if (!video) return;

    let subAnimId = null;

    // Enable all HTML5 TextTracks so browser parses cues
    function enableTracks() {
      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.mode === 'disabled') {
            track.mode = 'hidden'; // 'hidden' loads cues without browser default black box
          }
          track.oncuechange = () => {
            if (track.activeCues && track.activeCues.length > 0) {
              const cue = track.activeCues[0];
              activeSubtitleCue = cue;
              updateSubtitleDisplay(cue.text);
              updatePillStatus(true, 'HTML5 CC Active');
            } else if (!isTestActive && !lastYouTubeText) {
              activeSubtitleCue = null;
              if (overlayEl) overlayEl.style.display = 'none';
            }
          };
        }
      }
    }

    enableTracks();
    if (video.textTracks) {
      video.textTracks.onaddtrack = () => enableTracks();
    }

    function syncVideoFrame() {
      // 1. Check native TextTracks (WebVTT, HTML5 <track>)
      let foundCue = false;
      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.mode === 'disabled') track.mode = 'hidden';
          if (track.activeCues && track.activeCues.length > 0) {
            const cue = track.activeCues[0];
            if (activeSubtitleCue !== cue) {
              activeSubtitleCue = cue;
              updateSubtitleDisplay(cue.text);
              updatePillStatus(true, 'CC Active');
            }
            foundCue = true;

            // Shadowing auto-pause
            if (shadowingMode && video.currentTime >= cue.endTime - 0.08 && lastPausedCue !== cue) {
              lastPausedCue = cue;
              video.pause();
            }
            break;
          }
        }
      }

      // 2. High-precision word-level karaoke progress: Both Japanese & Romaji light up together!
      const kTokens = kanjiEl ? kanjiEl.querySelectorAll('.anime-kanji-token') : [];
      const rTokens = romajiEl ? romajiEl.querySelectorAll('.anime-word-token') : [];
      if (rTokens.length > 0 && activeSubtitleCue) {
        const duration = activeSubtitleCue.endTime - activeSubtitleCue.startTime;
        if (duration > 0) {
          const progress = Math.max(0, Math.min(1, (video.currentTime - activeSubtitleCue.startTime) / duration));
          const activeIdx = Math.floor(progress * rTokens.length);

          for (let idx = 0; idx < rTokens.length; idx++) {
            if (idx === activeIdx) {
              rTokens[idx].classList.add('active');
              if (kTokens[idx]) kTokens[idx].classList.add('active');
            } else {
              rTokens[idx].classList.remove('active');
              if (kTokens[idx]) kTokens[idx].classList.remove('active');
            }
          }
        }
      }

      if (!video.paused) {
        subAnimId = requestAnimationFrame(syncVideoFrame);
      }
    }

    video.addEventListener('play', () => {
      if (subAnimId) cancelAnimationFrame(subAnimId);
      subAnimId = requestAnimationFrame(syncVideoFrame);
    });

    video.addEventListener('pause', () => {
      if (subAnimId) cancelAnimationFrame(subAnimId);
      syncVideoFrame();
    });

    video.addEventListener('seeking', syncVideoFrame);
    video.addEventListener('timeupdate', syncVideoFrame);
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
