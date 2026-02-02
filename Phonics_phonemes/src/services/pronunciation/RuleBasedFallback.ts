/**
 * RuleBasedFallback: Generates approximate pronunciations for unknown words
 * 
 * WHY THIS EXISTS:
 * - CMU dictionary doesn't cover all words (especially proper nouns, new slang)
 * - Users might type typos or made-up words
 * - Better to give 70% accurate pronunciation than nothing
 * 
 * DESIGN PHILOSOPHY:
 * - Use English orthography → phoneme rules
 * - Conservative approach: prefer common pronunciations
 * - Confidence score reflects uncertainty
 * 
 * FUTURE IMPROVEMENTS:
 * - Replace with neural G2P (Grapheme-to-Phoneme) model
 * - Train on Indian English pronunciation patterns
 * - Use transformer-based seq2seq model
 */

import { ARPAbetPhoneme, RawPronunciationData } from '../../types/pronunciation.types';

/**
 * Common English letter → phoneme patterns
 * This is a simplified rule set. Production systems use ~500+ rules.
 */
const GRAPHEME_TO_PHONEME_RULES: Array<{
  pattern: RegExp;
  phoneme: ARPAbetPhoneme[];
  context?: 'start' | 'middle' | 'end';
}> = [
  // Vowels
  { pattern: /a(?=ke|te|ne|ve)$/i, phoneme: ['EY1'], context: 'end' }, // "cake" → /EY/
  { pattern: /a(?=[^aeiou][aeiou])/i, phoneme: ['AE1'] }, // "cat" → /AE/
  { pattern: /e(?=e)/i, phoneme: ['IY1'] }, // "see" → /IY/
  { pattern: /e$/i, phoneme: ['AH0'], context: 'end' }, // "apple" → /AH/
  { pattern: /i(?=ke|te|ne)$/i, phoneme: ['AY1'], context: 'end' }, // "bike" → /AY/
  { pattern: /i/i, phoneme: ['IH0'] }, // "sit" → /IH/
  { pattern: /o(?=ke|te|ne)$/i, phoneme: ['OW1'], context: 'end' }, // "note" → /OW/
  { pattern: /oo/i, phoneme: ['UW1'] }, // "food" → /UW/
  { pattern: /u/i, phoneme: ['AH0'] }, // "cup" → /AH/
  
  // Consonants
  { pattern: /ch/i, phoneme: ['CH'] },
  { pattern: /sh/i, phoneme: ['SH'] },
  { pattern: /th/i, phoneme: ['TH'] }, // Simplified (doesn't distinguish voiced/unvoiced)
  { pattern: /ng/i, phoneme: ['NG'] },
  { pattern: /ph/i, phoneme: ['F'] },
  { pattern: /ck/i, phoneme: ['K'] },
  { pattern: /b/i, phoneme: ['B'] },
  { pattern: /c/i, phoneme: ['K'] }, // Simplified
  { pattern: /d/i, phoneme: ['D'] },
  { pattern: /f/i, phoneme: ['F'] },
  { pattern: /g/i, phoneme: ['G'] },
  { pattern: /h/i, phoneme: ['HH'] },
  { pattern: /j/i, phoneme: ['JH'] },
  { pattern: /k/i, phoneme: ['K'] },
  { pattern: /l/i, phoneme: ['L'] },
  { pattern: /m/i, phoneme: ['M'] },
  { pattern: /n/i, phoneme: ['N'] },
  { pattern: /p/i, phoneme: ['P'] },
  { pattern: /qu/i, phoneme: ['K', 'W'] },
  { pattern: /r/i, phoneme: ['R'] },
  { pattern: /s/i, phoneme: ['S'] },
  { pattern: /t/i, phoneme: ['T'] },
  { pattern: /v/i, phoneme: ['V'] },
  { pattern: /w/i, phoneme: ['W'] },
  { pattern: /x/i, phoneme: ['K', 'S'] },
  { pattern: /y/i, phoneme: ['Y'] },
  { pattern: /z/i, phoneme: ['Z'] },
];

/**
 * Generates pronunciation using orthographic rules
 * 
 * @param word - Input word
 * @returns Raw pronunciation data with low confidence
 * 
 * ALGORITHM:
 * 1. Normalize word (lowercase, trim)
 * 2. Iterate through rules, match patterns
 * 3. Assign stress to first vowel (heuristic)
 * 4. Return phonemes with confidence 0.6
 */
export function generateFallbackPronunciation(word: string): RawPronunciationData {
  const normalizedWord = word.toLowerCase().trim();
  
  if (!normalizedWord || !/^[a-z]+$/.test(normalizedWord)) {
    // Invalid input (contains numbers, symbols, etc.)
    return {
      word: normalizedWord,
      phonemes: [],
      isFromDictionary: false,
      confidence: 0.0,
    };
  }

  const phonemes: ARPAbetPhoneme[] = [];
  let remainingWord = normalizedWord;
  let isFirstVowel = true;

  while (remainingWord.length > 0) {
    let matched = false;

    // Try to match multi-character patterns first (e.g., "ch", "sh")
    for (const rule of GRAPHEME_TO_PHONEME_RULES) {
      const match = remainingWord.match(rule.pattern);
      
      if (match && match.index === 0) {
        let phonemesToAdd = [...rule.phoneme];
        
        // Add stress marker to first vowel
        if (isFirstVowel && isVowelPhoneme(phonemesToAdd[0])) {
          phonemesToAdd[0] = phonemesToAdd[0] + '1'; // Primary stress
          isFirstVowel = false;
        }
        
        phonemes.push(...phonemesToAdd);
        remainingWord = remainingWord.slice(match[0].length);
        matched = true;
        break;
      }
    }

    // If no rule matched, skip character (silent letter heuristic)
    if (!matched) {
      remainingWord = remainingWord.slice(1);
    }
  }

  return {
    word: normalizedWord,
    phonemes,
    isFromDictionary: false,
    confidence: phonemes.length > 0 ? 0.6 : 0.0,
  };
}

/**
 * Checks if a phoneme represents a vowel
 */
function isVowelPhoneme(phoneme: string): boolean {
  return /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)/.test(phoneme);
}

/**
 * FUTURE: Neural G2P Model Integration Point
 * 
 * Example using ONNX Runtime or TensorFlow Lite:
 * 
 * ```typescript
 * import * as ort from 'onnxruntime-react-native';
 * 
 * export async function neuralG2P(word: string): Promise<RawPronunciationData> {
 *   const session = await ort.InferenceSession.create('g2p_model.onnx');
 *   
 *   // Tokenize word → character indices
 *   const inputTensor = tokenizeWord(word);
 *   
 *   // Run inference
 *   const output = await session.run({ input: inputTensor });
 *   
 *   // Decode phoneme indices → ARPAbet
 *   const phonemes = decodePhonemePredictions(output.output);
 *   
 *   return {
 *     word,
 *     phonemes,
 *     isFromDictionary: false,
 *     confidence: calculateConfidence(output.confidence),
 *   };
 * }
 * ```
 */
