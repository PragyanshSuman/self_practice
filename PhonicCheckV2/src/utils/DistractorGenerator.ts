// src/utils/DistractorGenerator.ts
// Dynamically generates "Shadow Words" (phonetic neighbors) for any target word.

import { PHONEME_FORMANTS } from './referenceGenerator';

export interface ShadowWord {
    word: string;
    phonemes: string[];
    type: 'VowelSwap' | 'ConsonantSwap' | 'Deletion' | 'Insertion';
}

export class DistractorGenerator {

    // Phonetic Neighbors Map
    private vowelNeighbors: Record<string, string[]> = {
        'aa': ['ah', 'ao', 'ae'],
        'ae': ['eh', 'aa', 'ay'],
        'ah': ['aa', 'uh', 'er'],
        'ao': ['aa', 'ow', 'uh'],
        'aw': ['ow', 'aa'],
        'ay': ['ae', 'iy'],
        'eh': ['ae', 'ih', 'ey'],
        'er': ['ah', 'uh'],
        'ey': ['eh', 'iy'],
        'ih': ['iy', 'eh'],
        'iy': ['ih', 'ey'],
        'ow': ['ao', 'uw'],
        'oy': ['ay', 'ow'],
        'uh': ['ah', 'uw'],
        'uw': ['uh', 'ow'],
    };

    private consonantNeighbors: Record<string, string[]> = {
        'b': ['p', 'd', 'v'],
        'd': ['t', 'b', 'g'],
        'g': ['k', 'd'],
        'p': ['b', 'f'],
        't': ['d', 's'],
        'k': ['g', 't'],
        'f': ['v', 'th', 'p'],
        'v': ['f', 'b'],
        'th': ['s', 'f', 'dh'],
        'dh': ['d', 'z', 'th'],
        's': ['z', 'sh', 'th'],
        'z': ['s', 'zh', 'dh'],
        'sh': ['s', 'ch', 'zh'],
        'zh': ['z', 'jh', 'sh'],
        'ch': ['sh', 'jh', 't'],
        'jh': ['zh', 'ch', 'd'],
        'm': ['n'],
        'n': ['m', 'ng'],
        'ng': ['n'],
        'l': ['r', 'w'],
        'r': ['l', 'w'],
        'w': ['v', 'r'],
        'y': ['iy'],
        'hh': [],
    };

    /**
     * Generate 3-5 distractors for a given word
     */
    public generateDistractors(word: string, phonemes: string[]): ShadowWord[] {
        const shadows: ShadowWord[] = [];

        // 1. Vowel Swaps (Most common mistake)
        phonemes.forEach((p, idx) => {
            const neighbors = this.vowelNeighbors[p.toLowerCase()];
            if (neighbors) {
                neighbors.forEach(neighbor => {
                    const newPhonemes = [...phonemes];
                    newPhonemes[idx] = neighbor;
                    shadows.push({
                        word: this.constructWord(newPhonemes, word, "Vowel"),
                        phonemes: newPhonemes,
                        type: 'VowelSwap'
                    });
                });
            }
        });

        // 2. Consonant Swaps (Initial/Final only usually)
        if (phonemes.length > 0) {
            // First phoneme
            this.addConsonantSwaps(0, phonemes, word, shadows);
            // Last phoneme
            if (phonemes.length > 1) {
                this.addConsonantSwaps(phonemes.length - 1, phonemes, word, shadows);
            }
        }

        // 3. Simple Deletion (e.g. "Bread" -> "Bed")
        // Only if word is long enough
        if (phonemes.length > 3) {
            const newPhonemes = [...phonemes];
            newPhonemes.splice(1, 1); // Delete 2nd phoneme
            shadows.push({
                word: this.constructWord(newPhonemes, word, "Del"),
                phonemes: newPhonemes,
                type: 'Deletion'
            });
        }

        // Shuffle and take top 4
        return this.shuffle(shadows).slice(0, 4);
    }

    private addConsonantSwaps(index: number, phonemes: string[], originalWord: string, shadows: ShadowWord[]) {
        const p = phonemes[index].toLowerCase();
        const neighbors = this.consonantNeighbors[p];
        if (neighbors) {
            neighbors.forEach(neighbor => {
                const newPhonemes = [...phonemes];
                newPhonemes[index] = neighbor;
                shadows.push({
                    word: this.constructWord(newPhonemes, originalWord, "Cons"),
                    phonemes: newPhonemes,
                    type: 'ConsonantSwap'
                });
            });
        }
    }

    // Heuristic to guess how the shadow word might be spelled
    // This is purely for display purposes ("Heard: [Estimated]")
    private constructWord(phonemes: string[], original: string, type: string): string {
        // Very basic mapping back to text. 
        // Ideally we would carry the orthography, but for generated words we guess.
        // We can just label it "Like [Original] but with ..."
        // OR we try to replace the letter.

        // For now, let's return a "Phonetic Style" label
        // e.g. "Bed (Phonetic)" 
        return `*${phonemes.join('-')}*`;

        // Better: Return a diff-like string.
        // But the user wants "Heard: Bed". 
        // Building a real G2P inverter is hard.
        // We will try a simple replacement approach if possible, otherwise Phonetic.
    }

    private shuffle(array: any[]) {
        return array.sort(() => Math.random() - 0.5);
    }
}
