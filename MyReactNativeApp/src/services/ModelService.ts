import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

class ModelService {
    private model: TensorflowModel | null = null;
    private isModelLoading: boolean = false;

    async loadModel(): Promise<void> {
        if (this.model || this.isModelLoading) return;

        this.isModelLoading = true;
        try {
            console.log('Loading TFLite model...');

            const modelFileName = 'emnist_cnn_model.tflite';

            if (Platform.OS === 'android') {
                // For Android: Copy from assets to cache directory
                const destPath = `${RNFS.CachesDirectoryPath}/${modelFileName}`;

                const exists = await RNFS.exists(destPath);
                if (!exists) {
                    console.log('Copying model from assets...');
                    // Android assets are accessed via special path
                    await RNFS.copyFileAssets(modelFileName, destPath);
                    console.log(`Model copied to: ${destPath}`);
                }

                // Load from file path
                this.model = await loadTensorflowModel({ url: `file://${destPath}` });
            } else {
                // iOS: Load from main bundle
                const bundlePath = `${RNFS.MainBundlePath}/${modelFileName}`;
                this.model = await loadTensorflowModel({ url: `file://${bundlePath}` });
            }

            if (this.model) {
                console.log('TFLite Model loaded successfully!');
            } else {
                console.error('Failed to load TFLite Model: Model object is null');
            }
        } catch (error) {
            console.error('Error loading TFLite model:', error);
        } finally {
            this.isModelLoading = false;
        }
    }

    async predict(inputTensor: Float32Array): Promise<number[] | null> {
        if (!this.model) {
            console.warn('Model not loaded yet. Attempting to load...');
            await this.loadModel();
            if (!this.model) return null;
        }

        try {
            console.log(`Running inference with input length: ${inputTensor.length}`);

            // Check for NaNs or Infinities
            if (inputTensor.some(v => isNaN(v) || !isFinite(v))) {
                console.error('Input tensor contains NaN or Infinite values');
                return null;
            }

            // CRITICAL: Model expects [1, 28, 28, 1] shape
            // But react-native-fast-tflite accepts flat arrays
            const output = await this.model.run([inputTensor]);

            if (output && output.length > 0) {
                console.log(`Inference successful. Output length: ${output[0].length}`);

                // CRITICAL FIX: Model outputs LOGITS, not probabilities
                // We need to apply softmax manually
                const logits = Array.from(output[0] as unknown as Float32Array);
                const probabilities = this.softmax(logits);

                return probabilities;
            }
            console.warn('Inference returned empty output');
            return null;
        } catch (error) {
            console.error('Error running inference details:', error);
            console.log('Model state:', this.model ? 'Attached' : 'Null');
            return null;
        }
    }

    // Softmax function to convert logits to probabilities
    private softmax(logits: number[]): number[] {
        const maxLogit = Math.max(...logits);
        const expScores = logits.map(x => Math.exp(x - maxLogit)); // Subtract max for numerical stability
        const sumExpScores = expScores.reduce((a, b) => a + b, 0);
        return expScores.map(x => x / sumExpScores);
    }
}

export const modelService = new ModelService();
