document.addEventListener('DOMContentLoaded', () => {
  const popDisplayMode = document.getElementById('popDisplayMode');
  const popShowEnglish = document.getElementById('popShowEnglish');
  const popShadowing = document.getElementById('popShadowing');
  const popFontScale = document.getElementById('popFontScale');
  const popFontScaleVal = document.getElementById('popFontScaleVal');
  const btnOpenTestBench = document.getElementById('btnOpenTestBench');

  // Load saved preferences
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['displayMode', 'showEnglish', 'shadowingMode', 'fontScale'], (data) => {
      if (data.displayMode !== undefined) popDisplayMode.value = data.displayMode;
      if (data.showEnglish !== undefined) popShowEnglish.checked = data.showEnglish;
      if (data.shadowingMode !== undefined) popShadowing.checked = data.shadowingMode;
      if (data.fontScale !== undefined) {
        const pct = Math.round(data.fontScale * 100);
        popFontScale.value = pct;
        popFontScaleVal.textContent = pct + '%';
      }
    });
  }

  // Save changes
  popDisplayMode.addEventListener('change', () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ displayMode: popDisplayMode.value });
    }
  });

  popFontScale.addEventListener('input', () => {
    popFontScaleVal.textContent = popFontScale.value + '%';
  });

  popFontScale.addEventListener('change', () => {
    if (chrome.storage && chrome.storage.local) {
      const scale = parseFloat(popFontScale.value) / 100;
      chrome.storage.local.set({ fontScale: scale });
    }
  });

  popShowEnglish.addEventListener('change', () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ showEnglish: popShowEnglish.checked });
    }
  });

  popShadowing.addEventListener('change', () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ shadowingMode: popShadowing.checked });
    }
  });

  const btnOpenVideoTest = document.getElementById('btnOpenVideoTest');
  if (btnOpenVideoTest) {
    btnOpenVideoTest.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000/test_bench/video_test.html' });
    });
  }

  btnOpenTestBench.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/test_bench/index.html' });
  });
});
