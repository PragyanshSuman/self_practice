import { modelService } from './ModelService';
import { rasterizeStrokes, getCharFromIndex } from '../utils/WritingUtils';

export interface MLValidationResult {
    isCorrect: boolean;
    confidence: number;
    predictedChar: string;
    expectedChar: string;
}

interface Point {
    x: number;
    y: number;
}

/**
 * MLValidator - Uses ML model for character validation
 * Replaces pixel-distance template matching with semantic character recognition
 */
export class MLValidator {
    /**
     * Validate if the traced character matches the expected letter
     * @param strokes - User's traced strokes
     * @param expectedLetter - The letter they should have written
     * @param canvasWidth - Canvas width for rasterization
     * @param canvasHeight - Canvas height for rasterization
     */
    static async validateCharacter(
        strokes: Point[][],
        expectedLetter: string,
        canvasWidth: number = 400,
        canvasHeight: number = 400
    ): Promise<MLValidationResult | null> {
        try {
            if (!strokes || strokes.length === 0) {
                console.warn('[MLValidator] No strokes provided');
                return null;
            }

            console.log(`[MLValidator] Validating ${strokes.length} strokes for letter: ${expectedLetter}`);

            // 1. Rasterize strokes to 28x28 grid
            const inputTensor = rasterizeStrokes(strokes, canvasWidth, canvasHeight);

            // 2. Run ML inference
            const probabilities = await modelService.predict(inputTensor);

            if (!probabilities) {
                console.error('[MLValidator] Model prediction failed');
                return null;
            }

            // 3. Get predicted character
            const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));
            const predictedChar = getCharFromIndex(maxProbIndex);
            const confidence = probabilities[maxProbIndex];

            // 4. Check if prediction matches expected letter (case-insensitive)
            const isCorrect = predictedChar.toLowerCase() === expectedLetter.toLowerCase();

            const result: MLValidationResult = {
                isCorrect,
                confidence,
                predictedChar,
                expectedChar: expectedLetter
            };

            console.log('[MLValidator] Validation result:', {
                predicted: predictedChar,
                expected: expectedLetter,
                correct: isCorrect,
                confidence: (confidence * 100).toFixed(1) + '%'
            });

            return result;

        } catch (error) {
            console.error('[MLValidator] Error during validation:', error);
            return null;
        }
    }

    /**
     * Quick validation for real-time feedback (optional)
     * Can be called during tracing for immediate feedback
     */
    static async quickValidate(
        strokes: Point[][],
        expectedLetter: string
    ): Promise<boolean> {
        const result = await this.validateCharacter(strokes, expectedLetter);
        return result?.isCorrect ?? false;
    }
}
