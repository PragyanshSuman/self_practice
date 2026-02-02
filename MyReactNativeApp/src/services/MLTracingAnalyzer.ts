import { modelService } from './ModelService';
import {
    rasterizeStrokes,
    getCharFromIndex,
    flipHorizontal,
    flipVertical,
    rotate180,
    ALPHABET_INDICES
} from '../utils/WritingUtils';

export interface MLFeatures {
    predictedChar: string;
    expectedChar: string;
    isCorrect: boolean;
    confidence: number;
    topPredictions: Array<{ char: string; confidence: number }>;
    reversalDetected: boolean;
    reversalType?: 'horizontal_flip' | 'vertical_flip' | 'rotation_180';
    reversalConfidence?: number;
    allProbabilities?: number[];
    analysisTimestamp: string;
}

interface Stroke {
    x: number;
    y: number;
}

export class MLTracingAnalyzer {
    /**
     * Analyze traced strokes using ML model
     * @param strokes - Array of stroke arrays (each stroke is an array of points)
     * @param expectedLetter - The letter the user was supposed to trace
     * @param canvasWidth - Width of the canvas
     * @param canvasHeight - Height of the canvas
     * @returns ML analysis features
     */
    static async analyzeTracing(
        strokes: Stroke[][],
        expectedLetter: string,
        canvasWidth: number = 400,
        canvasHeight: number = 400
    ): Promise<MLFeatures | null> {
        try {
            console.log(`[MLTracingAnalyzer] Analyzing ${strokes.length} strokes for letter: ${expectedLetter}`);

            // 1. Rasterize strokes to 28x28 grid
            const inputTensor = rasterizeStrokes(strokes, canvasWidth, canvasHeight);

            // 2. Run ML inference
            const probabilities = await modelService.predict(inputTensor);

            if (!probabilities) {
                console.error('[MLTracingAnalyzer] Model prediction failed');
                return null;
            }

            // 3. Get predicted character
            const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));
            const predictedChar = getCharFromIndex(maxProbIndex);
            const confidence = probabilities[maxProbIndex];

            // 4. Get top 5 predictions
            const topIndices = probabilities
                .map((prob, idx) => ({ prob, idx }))
                .sort((a, b) => b.prob - a.prob)
                .slice(0, 5);

            const topPredictions = topIndices.map(item => ({
                char: getCharFromIndex(item.idx),
                confidence: item.prob
            }));

            // 5. Check if prediction is correct
            const isCorrect = predictedChar.toLowerCase() === expectedLetter.toLowerCase();

            // 6. Reversal Detection (only if incorrect)
            let reversalDetected = false;
            let reversalType: MLFeatures['reversalType'] = undefined;
            let reversalConfidence: number | undefined = undefined;

            if (!isCorrect) {
                const reversalResult = await this.detectReversal(
                    inputTensor,
                    expectedLetter
                );

                if (reversalResult) {
                    reversalDetected = true;
                    reversalType = reversalResult.type;
                    reversalConfidence = reversalResult.confidence;
                }
            }

            const mlFeatures: MLFeatures = {
                predictedChar,
                expectedChar: expectedLetter,
                isCorrect,
                confidence,
                topPredictions,
                reversalDetected,
                reversalType,
                reversalConfidence,
                allProbabilities: probabilities,
                analysisTimestamp: new Date().toISOString()
            };

            console.log('[MLTracingAnalyzer] Analysis complete:', {
                predicted: predictedChar,
                expected: expectedLetter,
                correct: isCorrect,
                confidence: (confidence * 100).toFixed(1) + '%',
                reversal: reversalDetected ? reversalType : 'none'
            });

            return mlFeatures;

        } catch (error) {
            console.error('[MLTracingAnalyzer] Error during analysis:', error);
            return null;
        }
    }

    /**
     * Detect if the character was written in reverse/upside-down
     */
    private static async detectReversal(
        inputTensor: Float32Array,
        expectedLetter: string
    ): Promise<{ type: MLFeatures['reversalType']; confidence: number } | null> {
        try {
            // Get the expected character's class index
            const expectedIndex = this.getExpectedCharIndex(expectedLetter);
            if (expectedIndex === -1) {
                return null;
            }

            // Test horizontal flip
            const flippedH = flipHorizontal(inputTensor);
            const predH = await modelService.predict(flippedH);
            if (predH) {
                const maxHIndex = predH.indexOf(Math.max(...predH));
                if (maxHIndex === expectedIndex) {
                    return {
                        type: 'horizontal_flip',
                        confidence: predH[maxHIndex]
                    };
                }
            }

            // Test vertical flip
            const flippedV = flipVertical(inputTensor);
            const predV = await modelService.predict(flippedV);
            if (predV) {
                const maxVIndex = predV.indexOf(Math.max(...predV));
                if (maxVIndex === expectedIndex) {
                    return {
                        type: 'vertical_flip',
                        confidence: predV[maxVIndex]
                    };
                }
            }

            // Test 180° rotation
            const rotated = rotate180(inputTensor);
            const predR = await modelService.predict(rotated);
            if (predR) {
                const maxRIndex = predR.indexOf(Math.max(...predR));
                if (maxRIndex === expectedIndex) {
                    return {
                        type: 'rotation_180',
                        confidence: predR[maxRIndex]
                    };
                }
            }

            return null;

        } catch (error) {
            console.error('[MLTracingAnalyzer] Error in reversal detection:', error);
            return null;
        }
    }

    /**
     * Get the class index for the expected character
     */
    private static getExpectedCharIndex(letter: string): number {
        const mapping = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabdefghnqrt";
        const upperLetter = letter.toUpperCase();
        const lowerLetter = letter.toLowerCase();

        // Try uppercase first
        let index = mapping.indexOf(upperLetter);
        if (index !== -1) return index;

        // Try lowercase
        index = mapping.indexOf(lowerLetter);
        return index;
    }
}
