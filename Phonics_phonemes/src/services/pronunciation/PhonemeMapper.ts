/**
 * PhonemeMapper: Converts ARPAbet phonemes to IPA and syllables
 * 
 * Architecture Decision:
 * - Pure functions, no side effects
 * - Stateless transformations
 * - Can be easily replaced with ML-based mapper in future
 * 
 * Extensibility:
 * - Add new phoneme mappings without changing other modules
 * - Swap with ML model that predicts IPA from audio
 */

import { ARPAbetPhoneme, IPAString, Syllable } from '../../types/pronunciation.types';

/**
 * ARPAbet to IPA mapping
 * Source: CMU Pronouncing Dictionary documentation
 * Numbers indicate stress: 0=no stress, 1=primary, 2=secondary
 */
const ARPABET_TO_IPA: Record<string, string> = {
  // Vowels
  'AA': 'ɑ', 'AA0': 'ɑ', 'AA1': 'ˈɑ', 'AA2': 'ˌɑ',
  'AE': 'æ', 'AE0': 'æ', 'AE1': 'ˈæ', 'AE2': 'ˌæ',
  'AH': 'ə', 'AH0': 'ə', 'AH1': 'ˈʌ', 'AH2': 'ˌʌ',
  'AO': 'ɔ', 'AO0': 'ɔ', 'AO1': 'ˈɔ', 'AO2': 'ˌɔ',
  'AW': 'aʊ', 'AW0': 'aʊ', 'AW1': 'ˈaʊ', 'AW2': 'ˌaʊ',
  'AY': 'aɪ', 'AY0': 'aɪ', 'AY1': 'ˈaɪ', 'AY2': 'ˌaɪ',
  'EH': 'ɛ', 'EH0': 'ɛ', 'EH1': 'ˈɛ', 'EH2': 'ˌɛ',
  'ER': 'ɝ', 'ER0': 'ɚ', 'ER1': 'ˈɝ', 'ER2': 'ˌɝ',
  'EY': 'eɪ', 'EY0': 'eɪ', 'EY1': 'ˈeɪ', 'EY2': 'ˌeɪ',
  'IH': 'ɪ', 'IH0': 'ɪ', 'IH1': 'ˈɪ', 'IH2': 'ˌɪ',
  'IY': 'i', 'IY0': 'i', 'IY1': 'ˈi', 'IY2': 'ˌi',
  'OW': 'oʊ', 'OW0': 'oʊ', 'OW1': 'ˈoʊ', 'OW2': 'ˌoʊ',
  'OY': 'ɔɪ', 'OY0': 'ɔɪ', 'OY1': 'ˈɔɪ', 'OY2': 'ˌɔɪ',
  'UH': 'ʊ', 'UH0': 'ʊ', 'UH1': 'ˈʊ', 'UH2': 'ˌʊ',
  'UW': 'u', 'UW0': 'u', 'UW1': 'ˈu', 'UW2': 'ˌu',

  // Consonants
  'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f',
  'G': 'ɡ', 'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l',
  'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'ɹ',
  'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v',
  'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ',
};

/**
 * Simplified syllable mapping for display (user-friendly)
 * This creates readable syllable breakdowns like "ap·ple"
 */
const ARPABET_TO_SYLLABLE: Record<string, string> = {
  // Vowels (simplified)
  'AA': 'ah', 'AA0': 'ah', 'AA1': 'ah', 'AA2': 'ah',
  'AE': 'a', 'AE0': 'a', 'AE1': 'a', 'AE2': 'a',
  'AH': 'uh', 'AH0': 'uh', 'AH1': 'uh', 'AH2': 'uh',
  'AO': 'aw', 'AO0': 'aw', 'AO1': 'aw', 'AO2': 'aw',
  'AW': 'ow', 'AW0': 'ow', 'AW1': 'ow', 'AW2': 'ow',
  'AY': 'ai', 'AY0': 'ai', 'AY1': 'ai', 'AY2': 'ai',
  'EH': 'eh', 'EH0': 'eh', 'EH1': 'eh', 'EH2': 'eh',
  'ER': 'er', 'ER0': 'er', 'ER1': 'er', 'ER2': 'er',
  'EY': 'ay', 'EY0': 'ay', 'EY1': 'ay', 'EY2': 'ay',
  'IH': 'i', 'IH0': 'i', 'IH1': 'i', 'IH2': 'i',
  'IY': 'ee', 'IY0': 'ee', 'IY1': 'ee', 'IY2': 'ee',
  'OW': 'oh', 'OW0': 'oh', 'OW1': 'oh', 'OW2': 'oh',
  'OY': 'oy', 'OY0': 'oy', 'OY1': 'oy', 'OY2': 'oy',
  'UH': 'u', 'UH0': 'u', 'UH1': 'u', 'UH2': 'u',
  'UW': 'oo', 'UW0': 'oo', 'UW1': 'oo', 'UW2': 'oo',

  // Consonants
  'B': 'b', 'CH': 'ch', 'D': 'd', 'DH': 'th', 'F': 'f',
  'G': 'g', 'HH': 'h', 'JH': 'j', 'K': 'k', 'L': 'l',
  'M': 'm', 'N': 'n', 'NG': 'ng', 'P': 'p', 'R': 'r',
  'S': 's', 'SH': 'sh', 'T': 't', 'TH': 'th', 'V': 'v',
  'W': 'w', 'Y': 'y', 'Z': 'z', 'ZH': 'zh',
};

/**
 * Converts ARPAbet phonemes to IPA notation
 * 
 * @param phonemes - Array of ARPAbet phonemes (e.g., ["AE1", "P", "AH0", "L"])
 * @returns IPA string (e.g., "ˈæp.əl")
 * 
 * Example:
 * phonemesToIPA(["AE1", "P", "AH0", "L"]) → "ˈæp.əl"
 */
export function phonemesToIPA(phonemes: ARPAbetPhoneme[]): IPAString {
  if (!phonemes || phonemes.length === 0) {
    return '';
  }

  let ipa = '';
  let currentSyllable: string[] = [];
  
  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i];
    const ipaChar = ARPABET_TO_IPA[phoneme] || phoneme.replace(/[0-9]/g, '');
    
    // Check if this phoneme has primary stress
    const hasStress = phoneme.endsWith('1');
    
    currentSyllable.push(ipaChar);
    
    // Determine syllable boundary (simplified heuristic)
    // Real implementation would use maximal onset principle
    const isVowel = /[AEIOU]/.test(phoneme.substring(0, 2));
    const nextIsVowel = i < phonemes.length - 1 && /[AEIOU]/.test(phonemes[i + 1].substring(0, 2));
    
    if (isVowel && nextIsVowel) {
      // Vowel followed by vowel = syllable break
      ipa += currentSyllable.join('') + '.';
      currentSyllable = [];
    }
  }
  
  // Add remaining syllable
  if (currentSyllable.length > 0) {
    ipa += currentSyllable.join('');
  }
  
  // Clean up trailing dots
  return ipa.replace(/\.+$/, '');
}

/**
 * Converts ARPAbet phonemes to syllable breakdown
 * 
 * @param phonemes - Array of ARPAbet phonemes
 * @returns Array of syllables (e.g., ["ap", "ple"])
 * 
 * WHY: Syllables are easier for dyslexic users to process than full words
 * 
 * Example:
 * phonemesToSyllables(["AE1", "P", "AH0", "L"]) → ["ap", "pl"]
 */
export function phonemesToSyllables(phonemes: ARPAbetPhoneme[]): Syllable[] {
  if (!phonemes || phonemes.length === 0) {
    return [];
  }

  const syllables: Syllable[] = [];
  let currentSyllable = '';
  
  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i];
    const syllableChar = ARPABET_TO_SYLLABLE[phoneme] || phoneme.toLowerCase().replace(/[0-9]/g, '');
    
    currentSyllable += syllableChar;
    
    // Syllable boundary detection
    const hasStressMarker = phoneme.match(/[12]$/);
    const isVowel = /[AEIOU]/.test(phoneme.substring(0, 2));
    const nextIsConsonant = i < phonemes.length - 1 && !/[AEIOU]/.test(phonemes[i + 1].substring(0, 2));
    
    // Push syllable when:
    // 1. Vowel with stress marker is followed by consonant
    // 2. Or we're at the end
    if ((isVowel && hasStressMarker && nextIsConsonant) || i === phonemes.length - 1) {
      syllables.push(currentSyllable);
      currentSyllable = '';
    }
  }
  
  // Fallback: if no syllables detected, split by vowel clusters
  if (syllables.length === 0) {
    return splitByVowelClusters(phonemes);
  }
  
  return syllables;
}

/**
 * Fallback syllable splitter
 * Used when stress-based splitting fails
 */
function splitByVowelClusters(phonemes: ARPAbetPhoneme[]): Syllable[] {
  const syllables: Syllable[] = [];
  let current = '';
  
  for (const phoneme of phonemes) {
    const isVowel = /[AEIOU]/.test(phoneme.substring(0, 2));
    const syllableChar = ARPABET_TO_SYLLABLE[phoneme] || phoneme.toLowerCase().replace(/[0-9]/g, '');
    
    current += syllableChar;
    
    if (isVowel) {
      syllables.push(current);
      current = '';
    }
  }
  
  if (current) {
    if (syllables.length > 0) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }
  
  return syllables;
}

/**
 * Adds stress markers to syllables
 * 
 * @param syllables - Array of syllables
 * @param phonemes - Original phonemes (to extract stress info)
 * @returns Syllables with stress markers (ˈ for primary, ˌ for secondary)
 */
export function addStressMarkers(syllables: Syllable[], phonemes: ARPAbetPhoneme[]): Syllable[] {
  const stressedSyllables: Syllable[] = [];
  let syllableIndex = 0;
  
  for (const syllable of syllables) {
    // Find if this syllable has stress
    let hasStress = false;
    
    for (const phoneme of phonemes) {
      if (phoneme.endsWith('1')) {
        hasStress = true;
        break;
      }
    }
    
    if (hasStress && syllableIndex === 0) {
      stressedSyllables.push(`ˈ${syllable}`);
    } else {
      stressedSyllables.push(syllable);
    }
    
    syllableIndex++;
  }
  
  return stressedSyllables;
}

/**
 * FUTURE EXTENSION: ML-based phoneme prediction
 * This function signature shows how you'd integrate an ML model
 * 
 * @param word - Input word
 * @param audioBuffer - Optional audio recording of user's pronunciation
 * @returns Predicted phonemes with confidence scores
 */
export async function predictPhonemesML(
  word: string,
  audioBuffer?: ArrayBuffer
): Promise<{ phonemes: ARPAbetPhoneme[]; confidence: number }> {
  // TODO: Integrate TensorFlow Lite or ONNX model
  // Example: Run audio through Wav2Vec2 → get phoneme predictions
  throw new Error('ML model not yet integrated. Use dictionary or rule-based fallback.');
}
