import { pipeline } from '@huggingface/transformers';
import pkg from 'wavefile';
const { WaveFile } = pkg;
import fs from 'fs';

let asrPipeline = null;

/**
 * Initializes or retrieves the Whisper pipeline
 * @param {string} modelName - e.g. "Xenova/whisper-tiny" or "Xenova/whisper-base"
 */
export async function getASRPipeline(modelName = 'Xenova/whisper-tiny') {
  if (!asrPipeline) {
    console.log(`[STT] Loading Whisper model: ${modelName}...`);
    asrPipeline = await pipeline('automatic-speech-recognition', modelName, {
      dtype: 'fp32'
    });
    console.log(`[STT] Whisper model ready!`);
  }
  return asrPipeline;
}

/**
 * Loads a WAV file and converts it into a normalized Float32Array at 16kHz (mono), matching Whisper input requirements.
 * @param {string} filePath - Absolute or relative path to .wav file
 * @returns {Float32Array}
 */
export function loadWavAudio(filePath) {
  const buffer = fs.readFileSync(filePath);
  const wav = new WaveFile(buffer);
  
  // Resample to 16kHz
  wav.toSampleRate(16000);
  
  // Check bit depth and normalize
  const bitDepth = wav.bitDepth;

  let samples;
  if (wav.fmt.numChannels > 1) {
    const rawChannels = wav.getSamples();
    const mono = new Float32Array(rawChannels[0].length);
    for (let i = 0; i < mono.length; i++) {
      let sum = 0;
      for (let ch = 0; ch < rawChannels.length; ch++) {
        sum += rawChannels[ch][i];
      }
      mono[i] = sum / rawChannels.length;
    }
    samples = mono;
  } else {
    samples = wav.getSamples(false, Float32Array);
  }

  // Normalize to [-1.0, 1.0]
  if (bitDepth === '16' || bitDepth === '16-bit') {
    for (let i = 0; i < samples.length; i++) {
      samples[i] = samples[i] / 32768.0;
    }
  } else if (bitDepth === '24') {
    for (let i = 0; i < samples.length; i++) {
      samples[i] = samples[i] / 8388608.0;
    }
  } else if (bitDepth === '8') {
    for (let i = 0; i < samples.length; i++) {
      samples[i] = (samples[i] - 128) / 128.0;
    }
  }

  return samples;
}

/**
 * Transcribes Japanese audio and returns Japanese text with timestamps
 * @param {string|Float32Array} audio - Path to wav or Float32Array
 * @param {Object} options
 */
export async function transcribeJapanese(audio, options = {}) {
  const pipe = await getASRPipeline(options.model || 'Xenova/whisper-tiny');
  const input = typeof audio === 'string' ? loadWavAudio(audio) : audio;

  const result = await pipe(input, {
    language: 'japanese',
    task: 'transcribe',
    return_timestamps: options.wordTimestamps ? 'word' : true,
    chunk_length_s: 30
  });

  return result;
}

/**
 * Translates Japanese audio directly to English text
 * @param {string|Float32Array} audio - Path to wav or Float32Array
 * @param {Object} options
 */
export async function translateToEnglish(audio, options = {}) {
  const pipe = await getASRPipeline(options.model || 'Xenova/whisper-tiny');
  const input = typeof audio === 'string' ? loadWavAudio(audio) : audio;

  const result = await pipe(input, {
    language: 'japanese',
    task: 'translate',
    return_timestamps: false
  });

  return result;
}
