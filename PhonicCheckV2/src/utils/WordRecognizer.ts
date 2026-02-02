// src/utils/WordRecognizer.ts
// Closed-Vocabulary Recognizer (The "Duolingo" Logic)

import { AudioData, PronunciationResult } from '../types';
import { PhonemeAnalyzer } from './phonemeAnalyzer';
import { DistractorGenerator, ShadowWord } from './DistractorGenerator';
import { NativeRecognizer } from './NativeRecognizer';

export interface RecognitionResult {
    capturedWord: string;     // The word we think they said
    isPass: boolean;          // Did they say the TARGET?
    winningScore: number;     // The score of the captured word
    targetScore: number;      // The score of the target word
    distractorScores: { word: string, score: number }[];
    fullAnalysis: PronunciationResult; // Analysis of the TARGET (standard feedback)
    isNativeFallback?: boolean; // Did we use Google/Siri?
}

export class WordRecognizer {
    private analyzer: PhonemeAnalyzer;
    private distractorGen: DistractorGenerator;
    private nativeRecognizer: NativeRecognizer;

    constructor() {
        this.analyzer = new PhonemeAnalyzer();
        this.distractorGen = new DistractorGenerator();
        this.nativeRecognizer = new NativeRecognizer();
    }

    public async recognize(
        audio: AudioData,
        targetWord: string,
        targetPhonemes: string[]
    ): Promise<RecognitionResult> {
        console.log(`[Recognizer] Analyzing '${targetWord}' vs Shadows...`);

        // 0. Length Check (Garbage Filter)
        // Estimate target duration (Roughly 100-150ms per phoneme + 200ms buffer)
        // e.g. "Apple" (3) -> 0.36s. "Chocolate" (7) -> 0.84s.
        const expectedDuration = targetPhonemes.length * 0.12;
        const actualDuration = audio.duration;
        const durationRatio = actualDuration / expectedDuration;

        let lengthPenalty = 0;
        // If audio is > 2.5x longer or < 0.4x shorter, it's likely a different word
        if (durationRatio > 2.5 || durationRatio < 0.4) {
            console.warn(`[Recognizer] Length Mismatch! Exp: ${expectedDuration.toFixed(2)}s, Act: ${actualDuration.toFixed(2)}s`);
            lengthPenalty = 30; // Heavy penalty
        }

        // 1. Analyze TARGET (The standard path)
        const targetAnalysis = await this.analyzer.analyze(audio, targetWord, targetPhonemes);
        let targetScore = targetAnalysis.overallScore - lengthPenalty;
        targetScore = Math.max(0, targetScore);

        // 2. Generate Distractors
        const distractors = this.distractorGen.generateDistractors(targetWord, targetPhonemes);

        // 3. Analyze Distractors (Race)
        // We run the analyzer on all shadows.
        // Note: Ideally optimize this to reuse Feature Extraction.
        const distractorResults = [];

        for (const d of distractors) {
            const res = await this.analyzer.analyze(audio, d.word, d.phonemes);

            // Apply similar length penalty (Shadows have similar length to target)
            let dScore = res.overallScore - lengthPenalty;
            dScore = Math.max(0, dScore);

            distractorResults.push({
                word: d.word,
                score: dScore,
                phonemeString: d.phonemes.join('-')
            });
        }

        // 4. Find Winner
        // "Target" participates in the race too.
        let winner = { word: targetWord, score: targetScore, isTarget: true };

        for (const d of distractorResults) {
            // Bias TOWARDS the target?
            // Duolingo logic: If Distractor is SIGNIFICANTLY better (>10 points), it wins.
            // If scores are close, assume Target (benefit of doubt).
            if (d.score > winner.score + 10) {
                winner = { word: d.word, score: d.score, isTarget: false };
            }
        }

        // 5. Rejection Threshold (Hybrid Fallback)
        let isNativeFallback = false;

        // If the best match is trash (<45), try Native Recognition
        if (winner.score < 45) {
            console.log(`[Recognizer] Score ${winner.score} too low. Trying Native Fallback...`);
            try {
                const nativeResult = await this.nativeRecognizer.recognizeOnce();

                if (nativeResult) {
                    console.log(`[Recognizer] Native Result: ${nativeResult}`);
                    // If native result basically matches target, maybe our engine just failed?
                    // But usually if score is low, they said something else.

                    winner.word = nativeResult;
                    winner.isTarget = nativeResult.toLowerCase() === targetWord.toLowerCase();
                    // If it matches target now, maybe give it a "Mercy Pass" score?
                    if (winner.isTarget) winner.score = 50;
                    else winner.score = 0; // It's clearly a wrong word

                    isNativeFallback = true;
                } else {
                    winner.word = "??? (Unclear)";
                    winner.isTarget = false;
                }
            } catch (e) {
                console.error("Native Fallback Failed", e);
                winner.word = "??? (Unclear)";
                winner.isTarget = false;
            }
        }

        console.log(`[Recognizer] Winner: ${winner.word} (${winner.score}) vs Target (${targetScore})`);

        return {
            capturedWord: winner.word,
            isPass: winner.isTarget && targetScore >= 50,
            winningScore: winner.score,
            targetScore: targetScore,
            distractorScores: distractorResults.map(d => ({ word: d.word, score: d.score })),
            fullAnalysis: targetAnalysis,
            isNativeFallback
        };
    }
}
