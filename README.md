# 🎌 Anime Rōmaji & Dual Subtitles (Chrome Extension)

> Learn Japanese naturally while watching anime and videos with word-segmented Rōmaji, dual Japanese/English subtitles, and an instant hover dictionary.

---

## 🚀 Quick Install Guide for Testers (No Coding Required)

Anyone can install and test this extension on **Google Chrome, Brave, Microsoft Edge, or Opera** in under 60 seconds:

### Step 1: Download
- Download the latest **`anime-romaji-dual-subtitles-vX.X.X.zip`** (from GitHub Releases or the `dist/` folder).
- Unzip / extract it into a folder on your computer.

*(If you cloned this Git repository instead, the extension is inside the `extension/` folder)*.

### Step 2: Load into Browser
1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle switch in the top-right corner).
3. Click the **"Load unpacked"** button (top-left).
4. Select the extracted folder containing `manifest.json` (or the `extension/` folder from the repo).
5. Click the puzzle icon in your browser toolbar and **Pin** the extension icon!

---

## 🧪 How to Test It

### Method 1: Instant 1-Click Simulation (No Japanese video needed!)
1. Open any webpage that has an HTML5 video player (even YouTube's homepage or any video page).
2. Look for the floating **Anime Extension Pill** on the video.
3. Click the **"Test"** button on the pill.
4. **What to verify:**
   - Simulated anime subtitle appears with Kanji, Romaji, and English translation.
   - **Hover over any Japanese word** to see the dictionary popover (definitions, readings, Kanji breakdown).
   - Click `+` or `-` on the pill to test font resizing.
   - Switch between **Dual**, **Hover**, and **Ruby** subtitle modes.

### Method 2: Real YouTube Videos (with Japanese CC)
1. Open any YouTube video that has Japanese captions, for example:
   - Japanese music videos / anime openings with CC (e.g. YOASOBI, Official HIGE DANDism)
   - Japanese news streams (e.g. ANNnewsCH or FNN)
   - Anime trailers with Japanese subtitles
2. Turn on **Closed Captions (CC)** on YouTube and select **Japanese**.
3. **What to verify:**
   - The extension intercepts the captions and immediately displays formatted Rōmaji and dual English subtitles.
   - Hover over words to inspect pitch accents and vocabulary definitions.

### Method 3: Local Video Files (Anime MP4 + Subtitles)
1. Drag and drop any local `.mp4` anime episode directly into Chrome.
2. The player overlay will activate on the video.

---

## 🛠️ Features Breakdown

- **Dual Subtitles**: Shows Japanese Kanji/Kana alongside English translations.
- **Dynamic Rōmaji Generation**: Automatically transliterates Japanese characters into Romanized pronunciation.
- **Integrated Hover Dictionary**: Hover over any Japanese word to inspect definitions, parts of speech, and Kanji details without pausing manually.
- **Shadowing Practice Mode**: Replays and pauses dialogue segments to practice pronunciation.
- **On-Screen Control Pill**: Easily repositionable, toggle modes, resize subtitles, and control display preferences on the fly.
- **100% Client-Side Privacy**: All processing runs locally inside the browser. No audio or text data is sent to external servers.

---

## 🐞 Reporting Bugs & Feedback

If something doesn't work as expected:
1. Press `F12` on the video page to open Developer Tools.
2. Switch to the **Console** tab.
3. Filter messages by typing `[Anime Extension]`.
4. Copy any red error messages and submit an issue on GitHub!

---

## 📦 Developer & Make Commands

A cross-platform `Makefile` is included to streamline packaging, testing, and releases:

| Command | Description |
| :--- | :--- |
| `make package` | Bundles `extension/` into `dist/` zip archives for testers |
| `make test` | Runs all unit and pipeline validation tests |
| `make test-transcribe` | Runs local Whisper AI transcription benchmarks |
| `make clean` | Removes `dist/` bundles and temporary test output |
| `make tag-test` | Creates local git pre-release tag `v0.1.0-test` |
| `make push-test` | Pushes commits and tag to GitHub |

*(Alternatively, you can run `node scripts/package.js` directly).*
