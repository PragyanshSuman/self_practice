// src/utils/NativeRecognizer.ts
// Wrapper for @react-native-voice/voice (Google/Siri/Native ASR)
// Used as a fallback when the Closed-Vocabulary engine returns "Unclear".

import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

export class NativeRecognizer {
    private isRecognizing = false;

    constructor() {
        // Setup listeners if needed, but we might use one-shot properly
        Voice.onSpeechResults = this.onSpeechResults.bind(this);
    }

    public async recognizeOnce(): Promise<string | null> {
        return new Promise((resolve) => {
            let hasResolved = false;

            const cleanup = async () => {
                try {
                    await Voice.stop();
                    await Voice.destroy();
                } catch (e) { /* ignore */ }
            };

            // Set timeout for fallback (Native ASR can hang)
            const timeout = setTimeout(async () => {
                if (!hasResolved) {
                    hasResolved = true;
                    await cleanup();
                    resolve(null); // Timeout
                }
            }, 5000); // 5 seconds max for native

            Voice.onSpeechResults = (e: SpeechResultsEvent) => {
                if (!hasResolved && e.value && e.value.length > 0) {
                    hasResolved = true;
                    const bestMatch = e.value[0];
                    clearTimeout(timeout);
                    cleanup();
                    resolve(bestMatch);
                }
            };

            Voice.onSpeechError = (e) => {
                if (!hasResolved) {
                    hasResolved = true;
                    clearTimeout(timeout);
                    cleanup();
                    resolve(null);
                }
            };

            // Start listening
            // Start listening
            try {
                Voice.start('en-US').catch((e: any) => {
                    console.error("Native Voice Start Failed", e);
                    if (!hasResolved) {
                        hasResolved = true;
                        clearTimeout(timeout);
                        cleanup();
                        resolve(null);
                    }
                });
            } catch (e) {
                // Synchronous error (e.g. library not loaded)
                console.error("Native Voice Sync Error", e);
                if (!hasResolved) {
                    hasResolved = true;
                    clearTimeout(timeout);
                    cleanup();
                    resolve(null);
                }
            }
        });
    }

    private onSpeechResults(e: SpeechResultsEvent) {
        // Placeholder, logic handled in promise
    }
}
