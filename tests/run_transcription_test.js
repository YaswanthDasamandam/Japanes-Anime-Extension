import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { transcribeJapanese, translateToEnglish } from '../lib/stt_engine.js';
import { tokenizeToRomaji, toSpacedRomaji } from '../lib/romaji_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, 'audio');

const testCases = [
  {
    id: 'sample_1',
    file: 'sample_1_omae.wav',
    title: 'Anime Iconic Quote (Fist of the North Star)',
    expectedKeywords: ['お前', '死んでいる', 'omae']
  },
  {
    id: 'sample_2',
    file: 'sample_2_conversation.wav',
    title: 'Conversational Japanese (Listening Practice)',
    expectedKeywords: ['です', 'ます']
  },
  {
    id: 'sample_3',
    file: 'sample_3_japanese_speech.wav',
    title: 'Dramatic Anime Speech (Attack on Titan - Japanese Original)',
    expectedKeywords: ['兵士', '進め', '戦え']
  }
];

async function runBenchmark() {
  console.log('='.repeat(75));
  console.log('  JAPANESE AUDIO TRANSCRIPTION & ROMAJI BENCHMARK TEST');
  console.log('='.repeat(75));
  console.log(`Node: ${process.version}`);
  console.log(`Model: Xenova/whisper-tiny (Local In-Browser Engine Format)`);
  console.log('-'.repeat(75));

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const filePath = path.join(audioDir, tc.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] Audio file not found: ${filePath}`);
      continue;
    }

    console.log(`\n[TEST ${i + 1}/${testCases.length}] Processing: ${tc.title}`);
    console.log(`Audio file: ${tc.file}`);

    const startTime = Date.now();

    // 1. Transcribe Japanese
    const transcribeStart = Date.now();
    const jaResult = await transcribeJapanese(filePath, { wordTimestamps: false });
    const jaTime = ((Date.now() - transcribeStart) / 1000).toFixed(2);
    const jaText = jaResult.text.trim();

    // 2. Translate to English
    const translateStart = Date.now();
    const enResult = await translateToEnglish(filePath);
    const enTime = ((Date.now() - translateStart) / 1000).toFixed(2);
    const enText = enResult.text.trim();

    // 3. Morphological Tokenization & Romaji Conversion
    const romajiStart = Date.now();
    const romajiTokens = await tokenizeToRomaji(jaText);
    const spacedRomaji = await toSpacedRomaji(jaText);
    const romajiTime = ((Date.now() - romajiStart) / 1000).toFixed(3);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n  🇯🇵 Transcribed Japanese (${jaTime}s):`);
    console.log(`     "${jaText}"`);
    console.log(`\n  🔤 Spaced Rōmaji (Hepburn) (${romajiTime}s):`);
    console.log(`     "${spacedRomaji}"`);
    console.log(`\n  🇬🇧 English Translation (${enTime}s):`);
    console.log(`     "${enText}"`);

    // Show word breakdown
    console.log(`\n  📖 Word Breakdown (first 6 tokens):`);
    romajiTokens.slice(0, 6).forEach(t => {
      console.log(`     - [${t.surface}] -> reading: ${t.reading} | romaji: ${t.romaji} (${t.pos})`);
    });

    // Display timestamps if available
    if (jaResult.chunks && jaResult.chunks.length > 0) {
      console.log(`\n  ⏱️ Detected Timestamps (${jaResult.chunks.length} chunks):`);
      jaResult.chunks.slice(0, 3).forEach(c => {
        const [start, end] = c.timestamp;
        console.log(`     [${start.toFixed(2)}s -> ${end ? end.toFixed(2) + 's' : '...'}] ${c.text}`);
      });
    }

    console.log(`\n  ⚡ Total Pipeline Time: ${totalTime}s`);
    console.log('-'.repeat(75));

    results.push({
      id: tc.id,
      title: tc.title,
      file: tc.file,
      jaText,
      spacedRomaji,
      enText,
      totalTime,
      jaTime,
      enTime
    });
  }

  // Summary Table
  console.log('\n' + '='.repeat(75));
  console.log('  TEST SUMMARY REPORT');
  console.log('='.repeat(75));
  results.forEach((r, idx) => {
    console.log(`[#${idx + 1}] ${r.title}`);
    console.log(`    JA:     ${r.jaText}`);
    console.log(`    ROMAJI: ${r.spacedRomaji}`);
    console.log(`    EN:     ${r.enText}`);
    console.log(`    SPEED:  ${r.totalTime}s (Transcribe: ${r.jaTime}s, Translate: ${r.enTime}s)`);
    console.log('-'.repeat(75));
  });

  return results;
}

runBenchmark().catch(err => {
  console.error('Benchmark Error:', err);
  process.exit(1);
});
