# Real Video/Audio Transcription & Romanization Test Suite

A direct, automated benchmark pipeline to download real Japanese video/audio clips, transcribe them locally, convert them to word-segmented Rōmaji, generate English translations, and measure accuracy and latency before packaging.

## User Review Required

> [!IMPORTANT]
> **Real Audio Verification**: Instead of mock tests, we will download actual Japanese video/audio snippets (e.g., conversational dialogue, anime speech clips) and run the transcription pipeline directly on them using local compute.

> [!NOTE]
> **Direct Pipeline Test**: This tests the exact speech-to-text, word-level timestamping, Japanese-to-Rōmaji tokenization, and English translation on real audio files, printing a side-by-side comparison.

---

## Automated Test Architecture

```
Japanes Anime Extension/
├── tests/
│   ├── download_samples.js       # Downloads/extracts real Japanese dialogue clips
│   ├── run_transcription_test.js # Direct STT test runner on real audio files
│   ├── audio/                    # Storage for downloaded sample video/audio clips
│   │   ├── sample_1.wav          # Clean conversational Japanese
│   │   ├── sample_2.wav          # Anime dialogue with background music
│   │   └── sample_3.wav          # Fast-paced speech
│   └── ground_truth.json         # Reference transcripts to calculate accuracy (WER)
├── lib/
│   ├── stt_engine.js             # Local Whisper STT runner (Japanese + English)
│   ├── romaji_engine.js          # Tokenizer + Katakana to Hepburn Rōmaji
│   └── aligner.js                # Word-level timestamp alignment
└── package.json                  # Test runner dependencies
```

---

## Execution & Benchmark Steps

### Step 1: Environment & Sample Audio Preparation
- Set up Node/npm test environment with required libraries (`@huggingface/transformers`, `wanakana`, `wavefile`).
- Obtain 3 diverse real Japanese speech samples:
  1. Standard clean dialogue (e.g., greeting / daily conversation).
  2. Anime/dramatic dialogue (expressive pitch, casual slang).
  3. Continuous phrase with particles (`wa`, `o`, `ni`) to test pronunciation rules.

### Step 2: Direct Transcription & Translation Test
- Run Whisper locally on each audio file:
  - Task 1: Generate Japanese transcription (`task: "transcribe"`, `language: "ja"`).
  - Task 2: Generate English translation (`task: "translate"`).
  - Task 3: Extract timestamped tokens/chunks.

### Step 3: Rōmaji Tokenization & Word Alignment
- Feed the transcription to the Rōmaji engine.
- Verify:
  - Text splits into discrete words (not a single unspaced block).
  - Particle pronunciation is correct (e.g., `私 は` -> `watashi wa`).
  - Word timestamps map accurately to the audio timeline.

### Step 4: Quality & Speed Benchmark Report
- Print a clear benchmark table showing:
  - File name & duration
  - Transcribed Japanese vs Reference
  - Generated Rōmaji (word-by-word)
  - English translation
  - Processing time / speed factor (RTF)


---

## Proposed File Structure

### Extension Core (`Japanes Anime Extension/`)

```
Japanes Anime Extension/
├── manifest.json                  # Chrome Extension Manifest V3 configuration
├── popup/
│   ├── popup.html                 # Extension control panel & settings
│   ├── popup.css                  # Popup styling
│   └── popup.js                   # Settings logic (engine toggle, display options)
├── content/
│   ├── content_script.js          # Injected into video pages; manages overlay & video sync
│   ├── overlay.css                # Subtitle karaoke styling, hover dictionary popover
│   └── cc_detector.js             # Detects and intercepts native video captions if present
├── offscreen/
│   ├── offscreen.html             # Headless offscreen document for Audio & WebGPU
│   ├── offscreen.js               # Audio stream capture & coordination
│   └── whisper_worker.js          # WebGPU Transformers.js Whisper inference
├── lib/
│   ├── transformers.min.js        # Bundled in-browser ML runtime (WebGPU / ONNX)
│   ├── wanakana.min.js            # Kana & Romaji conversion library
│   ├── tokenizer.js               # Japanese word segmentation & reading parser
│   └── dict.js                    # Embedded mini-dictionary for hover glosses
└── icons/                         # Extension icons (16, 48, 128)
```

---

## Verification Plan

### 1. Model & Engine Verification
- Verify that WebGPU initializes properly in the offscreen document.
- Test in-browser transcription on sample Japanese audio clips.
- Verify word-level timestamp alignment and segment boundaries.

### 2. Romanization & Highlighting Verification
- Feed complex Japanese phrases (kanji compounds, particles like は/へ/を) and verify correct Hepburn Rōmaji outputs.
- Test karaoke highlighting alignment matching video playback `currentTime`.

### 3. Video Integration Test
- Load the unpacked extension in Chrome.
- Test on YouTube / generic HTML5 video:
  - Video overlay mounts cleanly over the video player.
  - Subtitles sync with the dialogue.
  - English line displays and toggles with hotkey `E`.
  - Hovering over a word displays the dictionary popup.
