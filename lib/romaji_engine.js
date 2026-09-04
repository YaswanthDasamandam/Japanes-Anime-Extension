import kuromoji from 'kuromoji';
import * as wanakana from 'wanakana';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tokenizerInstance = null;

/**
 * Initializes the Kuromoji morphological tokenizer
 */
export async function initTokenizer(dictPath = path.resolve(__dirname, '../node_modules/kuromoji/dict')) {
  if (tokenizerInstance) return tokenizerInstance;

  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dictPath }).build((err, tokenizer) => {
      if (err) return reject(err);
      tokenizerInstance = tokenizer;
      resolve(tokenizer);
    });
  });
}

/**
 * Converts Japanese text into word-separated tokens with Kanji reading and Hepburn Romaji.
 * Handles grammatical particle rules (e.g. は -> wa, へ -> e, を -> o) and combines auxiliary verbs (e.g. 行き + ます -> ikimasu).
 * 
 * @param {string} text - Japanese text (e.g. "お前はもう死んでいる")
 * @returns {Array<{surface: string, reading: string, pos: string, romaji: string}>}
 */
export async function tokenizeToRomaji(text) {
  const tokenizer = await initTokenizer();
  const rawTokens = tokenizer.tokenize(text);

  const merged = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const t = rawTokens[i];
    const surface = t.surface_form;
    const pos = t.pos;
    let reading = t.reading || surface;
    let romaji = '';

    // Handle punctuation
    if (pos === '記号') {
      const puncMap = { '、': ',', '。': '.', '！': '!', '？': '?', '「': '"', '」': '"' };
      romaji = puncMap[surface] || surface;
    } 
    // Handle Particle Pronunciations
    else if (pos === '助詞' && surface === 'は') {
      romaji = 'wa';
    } else if (pos === '助詞' && surface === 'へ') {
      romaji = 'e';
    } else if (surface === 'を') {
      romaji = 'o';
    } else if (surface === 'こんにちは') {
      romaji = 'konnichiwa';
    } else if (surface === 'こんばんは') {
      romaji = 'konbanwa';
    } else {
      // Convert Katakana reading to Romaji using Hepburn system
      romaji = wanakana.toRomaji(reading);
    }

    // Natural chunking: Merge auxiliary verbs (助動詞) like 'desu', 'masu', 'ta' with the preceding word
    if (pos === '助動詞' && merged.length > 0 && merged[merged.length - 1].pos !== '記号') {
      const prev = merged[merged.length - 1];
      prev.surface += surface;
      prev.reading += reading;
      prev.romaji += romaji;
    } 
    // Merge te/de connectors if following a verb (e.g. 死ん + で -> shinde)
    else if ((surface === 'て' || surface === 'で') && t.pos_detail_1 === '接続助詞' && merged.length > 0 && merged[merged.length - 1].pos === '動詞') {
      const prev = merged[merged.length - 1];
      prev.surface += surface;
      prev.reading += reading;
      prev.romaji += romaji;
    }
    else {
      merged.push({
        surface,
        reading,
        pos,
        romaji: romaji.trim()
      });
    }
  }

  return merged;
}

/**
 * Returns a human-friendly spaced Romaji sentence string
 */
export async function toSpacedRomaji(text) {
  const tokens = await tokenizeToRomaji(text);
  const words = [];

  for (const token of tokens) {
    if (token.pos === '記号') {
      if (words.length > 0) {
        words[words.length - 1] += token.romaji;
      } else {
        words.push(token.romaji);
      }
    } else if (token.romaji) {
      words.push(token.romaji);
    }
  }

  return words.join(' ');
}
