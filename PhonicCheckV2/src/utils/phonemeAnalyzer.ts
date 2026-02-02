// src/utils/phonemeAnalyzer.ts - Titanium Standard: Hybrid Scoring Engine

import { AudioData, PronunciationResult, MFCCFeatures, PhonemeScore, SyllableScore } from '../types';
import { MFCCExtractor } from './mfccExtractor';
import { DTWComparator } from './dtwCompare';
import { AudioProcessor } from './audioProcessor';
import { ReferenceGenerator, PHONEME_FORMANTS } from './referenceGenerator';
import { NoiseReducer } from './NoiseReducer';
import { EnvironmentCheck } from './EnvironmentCheck';
import { FormantAnalyzer } from './FormantAnalyzer';
import { PitchAnalyzer } from './PitchAnalyzer';

export class PhonemeAnalyzer {
  private mfccExtractor: MFCCExtractor;
  private dtwComparator: DTWComparator;
  private referenceGenerator: ReferenceGenerator;
  private noiseReducer: NoiseReducer;
  private environmentCheck: EnvironmentCheck;
  private formantAnalyzer: FormantAnalyzer;
  private pitchAnalyzer: PitchAnalyzer;

  constructor() {
    this.mfccExtractor = new MFCCExtractor();
    this.dtwComparator = new DTWComparator();
    this.referenceGenerator = new ReferenceGenerator();
    this.noiseReducer = new NoiseReducer();
    this.environmentCheck = new EnvironmentCheck();
    this.formantAnalyzer = new FormantAnalyzer();
    this.pitchAnalyzer = new PitchAnalyzer();
  }

  public async analyze(
    rawAudio: AudioData,
    targetWord: string,
    targetPhonemes: string[],
    age: number = 7 // Default to 7-year-old child
  ): Promise<PronunciationResult> {
    console.log('[PhonemeAnalyzer] Starting Titanium Analysis...');

    // 0. Configuration
    this.referenceGenerator.setAge(age);
    this.formantAnalyzer.setAge(age);

    // 1. Environment Check (Pre-cleaning)
    const envReport = this.environmentCheck.checkEnvironment(rawAudio);
    if (envReport.isNoisy) {
      console.warn(`[Environment] ${envReport.message} (SNR: ${envReport.snr}dB)`);
      // We continue but metrics might be lower.
    }

    // 2. Active Noise Reduction (Spectral Subtraction)
    const cleanAudio = this.noiseReducer.clean(rawAudio);

    // 3. Audio Processing (Trim & Norm)
    const audioProcessor = new AudioProcessor(); // Instance or static? assuming class from existing code
    const trimmedSamples = audioProcessor.trimSilence(cleanAudio.samples, 0.05);
    const normChildSamples = audioProcessor.normalize(trimmedSamples);

    // Create processed AudioData for sub-analyzers
    const processedChildAudio: AudioData = {
      ...cleanAudio,
      samples: normChildSamples,
      duration: normChildSamples.length / cleanAudio.sampleRate
    };

    // 4. Reference Generation
    const referenceAudio = this.referenceGenerator.generateReference(targetWord, targetPhonemes);
    const normRefSamples = audioProcessor.normalize(referenceAudio.samples);

    // 5. MFCC & DTW (Rhythm/Timing Score) - 50% Impact
    const childFeatures = this.mfccExtractor.extract(normChildSamples);
    const referenceFeatures = this.mfccExtractor.extract(normRefSamples);

    const dtwResult = this.dtwComparator.compare(childFeatures, referenceFeatures);
    const rhythmScore = dtwResult.similarity;

    // 6. Pitch & Prosody (Expression Score) - 20% Impact
    const pitchResult = this.pitchAnalyzer.analyze(processedChildAudio);
    const pitchScore = Math.max(0, 100 - (pitchResult.isMonotone ? 20 : 0) - (pitchResult.microPauses * 10));

    // 7. Granular Analysis (Alignment & Formants) - 30% Impact + Per-Phoneme
    const phonemeScores = this.analyzePhonemes(
      dtwResult.path,
      targetPhonemes,
      referenceFeatures,
      childFeatures,
      processedChildAudio
    );

    // Aggregate Formant Score (Average of phoneme scores)
    const formantScore = phonemeScores.length > 0
      ? phonemeScores.reduce((sum, p) => sum + p.score, 0) / phonemeScores.length
      : 0;

    // 8. Final Weighted Score
    // Titanium Weights: Rhythm (50%), Formants (30%), Pitch (20%)
    const weightedScore = (rhythmScore * 0.5) + (formantScore * 0.3) + (pitchScore * 0.2);
    const finalScore = Math.round(weightedScore);

    console.log(`[Scores] Rhythm: ${rhythmScore}, Formants: ${formantScore}, Pitch: ${pitchScore} => Final: ${finalScore}`);

    // Feedback Gen
    const feedback = this.generateFeedback(finalScore, phonemeScores, pitchResult, envReport);

    const syllableScores: SyllableScore[] = [{
      syllable: targetWord,
      score: finalScore,
      phonemes: phonemeScores,
      needsPractice: finalScore < 70
    }];

    return {
      overallScore: finalScore,
      syllableScores,
      phonemeScores,
      feedback: feedback.message,
      emoji: feedback.emoji,
      encouragement: feedback.encouragement,
      debugInfo: {
        rawDistance: dtwResult.distance,
        normalizedDistance: dtwResult.normalizedDistance,
        refFrames: referenceFeatures.coefficients.length,
        childFrames: childFeatures.coefficients.length
      }
    };
  }

  private analyzePhonemes(
    path: Array<[number, number]>,
    phonemes: string[],
    refFeatures: MFCCFeatures,
    childFeatures: MFCCFeatures,
    audio: AudioData
  ): PhonemeScore[] {
    const totalRefFrames = refFeatures.coefficients.length;
    const framesPerPhoneme = totalRefFrames / phonemes.length;

    return phonemes.map((phoneme, index) => {
      // 1. Identify Region
      const startRefFrame = Math.floor(index * framesPerPhoneme);
      const endRefFrame = Math.floor((index + 1) * framesPerPhoneme);

      const pathPoints = path.filter(p => p[1] >= startRefFrame && p[1] < endRefFrame);
      if (pathPoints.length === 0) return this.getEmptyScore(phoneme, index, "Missed");

      const childStartFrame = Math.min(...pathPoints.map(p => p[0]));
      const childEndFrame = Math.max(...pathPoints.map(p => p[0]));

      // 2. Local DTW Score (Shape)
      const localShapeScore = this.dtwComparator.compareRegion(
        childFeatures, refFeatures,
        childStartFrame, childEndFrame,
        startRefFrame, endRefFrame
      );

      // 3. Formant Score (Articulation) - Only for Vowels
      let articulationScore = 100;
      let feedback = "";

      const isVowel = ['a', 'e', 'i', 'o', 'u', 'aa', 'ae', 'iy', 'uw'].some(v => phoneme.toLowerCase().includes(v));

      if (isVowel) {
        const centerFrameIdx = Math.floor((childStartFrame + childEndFrame) / 2);
        const sampleIdx = centerFrameIdx * 160;

        if (sampleIdx + 512 < audio.samples.length) {
          const frameSamples = audio.samples.slice(sampleIdx, sampleIdx + 512);
          const formantResult = this.formantAnalyzer.analyze(frameSamples);

          // Target Formants - Strict Identity Check
          const targetF = (PHONEME_FORMANTS as any)[phoneme.toLowerCase()] || [500, 1500];
          const targetF1 = targetF[0];
          const targetF2 = targetF[1];

          // Calculate Deviation (Euclidean distance in F1-F2 space)
          const f1Diff = Math.abs(formantResult.f1 - targetF1);
          const f2Diff = Math.abs(formantResult.f2 - targetF2);

          let penalty = 0;
          if (f1Diff > 150) penalty += (f1Diff - 150) * 0.2;
          if (f2Diff > 250) penalty += (f2Diff - 250) * 0.1;

          // Bad Bandwidth (Mushy sound)
          if (formantResult.bandwidths[0] > 400) penalty += 20;

          articulationScore = Math.max(0, 100 - penalty);

          if (articulationScore < 60) feedback = "Sound was different.";
          if (f1Diff > 200) feedback = "Open/Close mouth more.";
        }
      } else {
        feedback = "Sharp!";
      }

      // Hybrid Phoneme Score
      const hybridScore = (localShapeScore * 0.6) + (articulationScore * 0.4);

      return {
        phoneme,
        score: Math.round(hybridScore),
        position: index,
        startTime: childStartFrame * 0.01,
        endTime: childEndFrame * 0.01,
        feedback: feedback || (hybridScore < 60 ? 'Try again' : 'Good'),
        color: this.getScoreColor(hybridScore)
      };
    });
  }

  private getEmptyScore(phoneme: string, index: number, feedback: string): PhonemeScore {
    return {
      phoneme, score: 0, position: index, startTime: 0, endTime: 0, feedback, color: '#FF4444'
    };
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50';
    if (score >= 50) return '#FFC107';
    return '#FF4444';
  }

  private generateFeedback(score: number, phonemes: PhonemeScore[], pitch: any, env: any): { message: string, emoji: string, encouragement: string } {
    if (env.isNoisy) {
      return { message: "Too Noisy!", emoji: "🔊", encouragement: env.message };
    }

    if (score >= 85) return { message: "Amazing!", emoji: "🤩", encouragement: "Perfect pronunciation!" };

    if (pitch.isMonotone) {
      return { message: "More Feeling!", emoji: "😐", encouragement: "Don't speak like a robot!" };
    }

    if (pitch.microPauses > 2) {
      return { message: "Smoothly!", emoji: "🌊", encouragement: "Say it in one breath." };
    }

    const weak = [...phonemes].sort((a, b) => a.score - b.score)[0];
    return {
      message: "Almost there!",
      emoji: "🙂",
      encouragement: `Focus on the /${weak.phoneme}/ sound.`
    };
  }
}
