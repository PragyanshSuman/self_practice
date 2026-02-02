// src/data/wordDatabase.ts - Fully dynamic word database

import { Word } from '../types';

export interface WordCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  words: Word[];
}

// Dynamic word generation system
export class WordDatabase {
  private categories: Map<string, WordCategory>;

  constructor() {
    this.categories = new Map();
    this.initializeCategories();
  }

  private initializeCategories() {
    // Animals category
    this.categories.set('animals', {
      id: 'animals',
      name: 'Animals',
      icon: '🐾',
      color: '#FFB347',
      words: this.generateWords([
        { text: 'cat', difficulty: 'beginner' },
        { text: 'dog', difficulty: 'beginner' },
        { text: 'bird', difficulty: 'beginner' },
        { text: 'fish', difficulty: 'beginner' },
        { text: 'rabbit', difficulty: 'intermediate' },
        { text: 'elephant', difficulty: 'intermediate' },
        { text: 'butterfly', difficulty: 'advanced' },
        { text: 'hippopotamus', difficulty: 'advanced' },
      ]),
    });

    // Food category
    this.categories.set('food', {
      id: 'food',
      name: 'Food',
      icon: '🍎',
      color: '#50C878',
      words: this.generateWords([
        { text: 'apple', difficulty: 'beginner' },
        { text: 'bread', difficulty: 'beginner' },
        { text: 'milk', difficulty: 'beginner' },
        { text: 'banana', difficulty: 'intermediate' },
        { text: 'chocolate', difficulty: 'intermediate' },
        { text: 'strawberry', difficulty: 'advanced' },
        { text: 'watermelon', difficulty: 'advanced' },
      ]),
    });

    // Home category
    this.categories.set('home', {
      id: 'home',
      name: 'Home',
      icon: '🏠',
      color: '#4A90E2',
      words: this.generateWords([
        { text: 'door', difficulty: 'beginner' },
        { text: 'chair', difficulty: 'beginner' },
        { text: 'table', difficulty: 'beginner' },
        { text: 'window', difficulty: 'intermediate' },
        { text: 'kitchen', difficulty: 'intermediate' },
        { text: 'bedroom', difficulty: 'intermediate' },
        { text: 'refrigerator', difficulty: 'advanced' },
      ]),
    });

    // Nature category
    this.categories.set('nature', {
      id: 'nature',
      name: 'Nature',
      icon: '🌳',
      color: '#98D8C8',
      words: this.generateWords([
        { text: 'tree', difficulty: 'beginner' },
        { text: 'sun', difficulty: 'beginner' },
        { text: 'moon', difficulty: 'beginner' },
        { text: 'flower', difficulty: 'intermediate' },
        { text: 'mountain', difficulty: 'intermediate' },
        { text: 'rainbow', difficulty: 'advanced' },
        { text: 'waterfall', difficulty: 'advanced' },
      ]),
    });

    // Actions category
    this.categories.set('actions', {
      id: 'actions',
      name: 'Actions',
      icon: '🏃',
      color: '#DDA0DD',
      words: this.generateWords([
        { text: 'run', difficulty: 'beginner' },
        { text: 'jump', difficulty: 'beginner' },
        { text: 'walk', difficulty: 'beginner' },
        { text: 'dancing', difficulty: 'intermediate' },
        { text: 'swimming', difficulty: 'intermediate' },
        { text: 'celebrating', difficulty: 'advanced' },
      ]),
    });
  }

  private generateWords(wordData: Array<{ text: string; difficulty: Word['difficulty'] }>): Word[] {
    return wordData.map((data, index) => {
      const syllables = this.splitIntoSyllables(data.text);
      const phonemes = this.textToPhonemes(data.text);

      return {
        id: `${data.text}_${index}`,
        text: data.text,
        syllables,
        phonemes,
        difficulty: data.difficulty,
        category: '',
      };
    });
  }

  // Dynamic syllable splitting algorithm
  private splitIntoSyllables(word: string): string[] {
    const syllableDict: { [key: string]: string[] } = {
      // Comprehensive syllable dictionary
      'cat': ['cat'], 'dog': ['dog'], 'bird': ['bird'], 'fish': ['fish'],
      'rabbit': ['rab', 'bit'], 'elephant': ['el', 'e', 'phant'],
      'butterfly': ['but', 'ter', 'fly'], 'hippopotamus': ['hip', 'po', 'pot', 'a', 'mus'],
      'apple': ['ap', 'ple'], 'bread': ['bread'], 'milk': ['milk'],
      'banana': ['ba', 'na', 'na'], 'chocolate': ['cho', 'co', 'late'],
      'strawberry': ['straw', 'ber', 'ry'], 'watermelon': ['wa', 'ter', 'mel', 'on'],
      'door': ['door'], 'chair': ['chair'], 'table': ['ta', 'ble'],
      'window': ['win', 'dow'], 'kitchen': ['kit', 'chen'], 'bedroom': ['bed', 'room'],
      'refrigerator': ['re', 'frig', 'er', 'a', 'tor'],
      'tree': ['tree'], 'sun': ['sun'], 'moon': ['moon'],
      'flower': ['flow', 'er'], 'mountain': ['moun', 'tain'],
      'rainbow': ['rain', 'bow'], 'waterfall': ['wa', 'ter', 'fall'],
      'run': ['run'], 'jump': ['jump'], 'walk': ['walk'],
      'dancing': ['dan', 'cing'], 'swimming': ['swim', 'ming'],
      'celebrating': ['cel', 'e', 'brat', 'ing'],
    };

    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    return syllableDict[cleaned] || this.fallbackSyllableSplit(cleaned);
  }

  // Fallback syllable algorithm
  private fallbackSyllableSplit(word: string): string[] {
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    const syllables: string[] = [];
    let current = '';

    for (let i = 0; i < word.length; i++) {
      current += word[i];
      const isVowel = vowels.includes(word[i]);
      const nextIsConsonant = i + 1 < word.length && !vowels.includes(word[i + 1]);

      if (isVowel && nextIsConsonant && i + 1 < word.length) {
        syllables.push(current);
        current = '';
      }
    }

    if (current) syllables.push(current);
    return syllables.length > 0 ? syllables : [word];
  }

  // Text to phonemes (CMU-style ARPAbet)
  private textToPhonemes(word: string): string[] {
    const phonemeDict: { [key: string]: string[] } = {
      'cat': ['K', 'AE', 'T'],
      'dog': ['D', 'AO', 'G'],
      'bird': ['B', 'ER', 'D'],
      'fish': ['F', 'IH', 'SH'],
      'rabbit': ['R', 'AE', 'B', 'IH', 'T'],
      'elephant': ['EH', 'L', 'AH', 'F', 'AH', 'N', 'T'],
      'butterfly': ['B', 'AH', 'T', 'ER', 'F', 'L', 'AY'],
      'hippopotamus': ['HH', 'IH', 'P', 'OW', 'P', 'AA', 'T', 'AH', 'M', 'AH', 'S'],
      'apple': ['AE', 'P', 'AH', 'L'],
      'bread': ['B', 'R', 'EH', 'D'],
      'milk': ['M', 'IH', 'L', 'K'],
      'banana': ['B', 'AH', 'N', 'AE', 'N', 'AH'],
      'chocolate': ['CH', 'AO', 'K', 'AH', 'L', 'AH', 'T'],
      'strawberry': ['S', 'T', 'R', 'AO', 'B', 'EH', 'R', 'IY'],
      'watermelon': ['W', 'AO', 'T', 'ER', 'M', 'EH', 'L', 'AH', 'N'],
      'door': ['D', 'AO', 'R'],
      'chair': ['CH', 'EH', 'R'],
      'table': ['T', 'EY', 'B', 'AH', 'L'],
      'window': ['W', 'IH', 'N', 'D', 'OW'],
      'kitchen': ['K', 'IH', 'CH', 'AH', 'N'],
      'bedroom': ['B', 'EH', 'D', 'R', 'UW', 'M'],
      'refrigerator': ['R', 'IH', 'F', 'R', 'IH', 'JH', 'ER', 'EY', 'T', 'ER'],
      'tree': ['T', 'R', 'IY'],
      'sun': ['S', 'AH', 'N'],
      'moon': ['M', 'UW', 'N'],
      'flower': ['F', 'L', 'AW', 'ER'],
      'mountain': ['M', 'AW', 'N', 'T', 'AH', 'N'],
      'rainbow': ['R', 'EY', 'N', 'B', 'OW'],
      'waterfall': ['W', 'AO', 'T', 'ER', 'F', 'AO', 'L'],
      'run': ['R', 'AH', 'N'],
      'jump': ['JH', 'AH', 'M', 'P'],
      'walk': ['W', 'AO', 'K'],
      'dancing': ['D', 'AE', 'N', 'S', 'IH', 'NG'],
      'swimming': ['S', 'W', 'IH', 'M', 'IH', 'NG'],
      'celebrating': ['S', 'EH', 'L', 'AH', 'B', 'R', 'EY', 'T', 'IH', 'NG'],
    };

    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    return phonemeDict[cleaned] || this.approximatePhonemes(cleaned);
  }

  // Approximate phonemes from letters
  private approximatePhonemes(word: string): string[] {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    return word.split('').map(char => {
      if (vowels.includes(char.toLowerCase())) {
        return 'AH'; // Generic vowel
      }
      return char.toUpperCase();
    });
  }

  // Public API methods
  public getAllCategories(): WordCategory[] {
    return Array.from(this.categories.values());
  }

  public getCategory(categoryId: string): WordCategory | undefined {
    return this.categories.get(categoryId);
  }

  public getWordsByDifficulty(difficulty: Word['difficulty']): Word[] {
    const allWords: Word[] = [];
    this.categories.forEach(category => {
      const filtered = category.words.filter(word => word.difficulty === difficulty);
      allWords.push(...filtered);
    });
    return allWords;
  }

  public getRandomWord(categoryId?: string, difficulty?: Word['difficulty']): Word | null {
    let words: Word[] = [];

    if (categoryId) {
      const category = this.categories.get(categoryId);
      words = category?.words || [];
    } else {
      this.categories.forEach(cat => words.push(...cat.words));
    }

    if (difficulty) {
      words = words.filter(word => word.difficulty === difficulty);
    }

    if (words.length === 0) return null;
    return words[Math.floor(Math.random() * words.length)];
  }

  public addCustomWord(categoryId: string, wordText: string, difficulty: Word['difficulty']): void {
    const category = this.categories.get(categoryId);
    if (!category) return;

    const newWord: Word = {
      id: `custom_${Date.now()}`,
      text: wordText,
      syllables: this.splitIntoSyllables(wordText),
      phonemes: this.textToPhonemes(wordText),
      difficulty,
      category: categoryId,
    };

    category.words.push(newWord);
  }
}

// Singleton instance
export const wordDatabase = new WordDatabase();
export default wordDatabase;
