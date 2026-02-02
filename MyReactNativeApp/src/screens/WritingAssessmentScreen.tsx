import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import Tts from 'react-native-tts';
import { WritingCanvas, Stroke } from '../components/WritingCanvas';
import { modelService } from '../services/ModelService';
import { 
    ALPHABET_INDICES, 
    getCharFromIndex, 
    rasterizeStrokes,
    flipHorizontal,
    flipVertical,
    rotate180 
} from '../utils/WritingUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CANVAS_SIZE = SCREEN_WIDTH - 40;

const WritingAssessmentScreen = () => {
    const [targetChar, setTargetChar] = useState<string | null>(null);
    const [targetClassId, setTargetClassId] = useState<number | null>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [canvasKey, setCanvasKey] = useState(0); // To force re-render clear
    const [result, setResult] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0);
    const [timing, setTiming] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    
    // Stats
    const [stats, setStats] = useState({ total: 0, correct: 0 });

    useEffect(() => {
        // Init TTS
        Tts.setDefaultLanguage('en-GB');
        Tts.setDefaultRate(0.5);
        
        // Init Model
        modelService.loadModel();
        
        let interval: ReturnType<typeof setInterval>;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTiming(t => t + 0.1);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const startNewTest = () => {
        // Select random character
        const randomIndex = Math.floor(Math.random() * ALPHABET_INDICES.length);
        const classId = ALPHABET_INDICES[randomIndex];
        const char = getCharFromIndex(classId);
        
        setTargetChar(char);
        setTargetClassId(classId);
        setStrokes([]);
        setCanvasKey(k => k + 1); // Clear canvas
        setResult('');
        setConfidence(0);
        setTiming(0);
        setIsTimerRunning(true);
        
        // Speak
        speakPrompt(char);
    };

    const speakPrompt = (char: string) => {
        let text = `Write ${char}`;
        if (char.match(/[A-Z]/)) {
            text = `Write capital ${char}`;
        } else if (char.match(/[a-z]/)) {
            text = `Write small ${char}`;
        }
        Tts.speak(text);
    };

    const checkAnswer = async () => {
        if (!strokes.length || targetClassId === null) return;
        
        setIsTimerRunning(false);
        
        // 1. Rasterize
        const inputTensor = rasterizeStrokes(strokes, CANVAS_SIZE, CANVAS_SIZE);
        
        // 2. Predict
        const predictions = await modelService.predict(inputTensor);
        
        if (!predictions) {
            Alert.alert("Error", "Model inference failed");
            return;
        }

        // 3. Analyze
        const maxProbIndex = predictions.indexOf(Math.max(...predictions));
        const conf = predictions[maxProbIndex];
        const predictedChar = getCharFromIndex(maxProbIndex);
        
        let isCorrect = (maxProbIndex === targetClassId);
        let feedbackDetails = "";
        
        if (!isCorrect) {
            // Check for reversals
            const checkReversal = async (transform: (t: Float32Array) => Float32Array, name: string) => {
                const transformed = transform(inputTensor);
                const predT = await modelService.predict(transformed);
                if (predT) {
                    const maxT = predT.indexOf(Math.max(...predT));
                    if (maxT === targetClassId) {
                        return name;
                    }
                }
                return null;
            };
            
            // We need to await sequentially or Promise.all
            // But we can just run them one by one for simplicity
            
            const isMirror = await checkReversal(flipHorizontal, "Mirrored (Horizontal Flip)");
            if (isMirror) feedbackDetails = isMirror;
            else {
                const isUpsideDown = await checkReversal(flipVertical, "Upside Down (Vertical Flip)");
                if (isUpsideDown) feedbackDetails = isUpsideDown;
                else {
                    const isRotated = await checkReversal(rotate180, "Rotated 180°");
                    if (isRotated) feedbackDetails = isRotated;
                }
            }
        }
        
        // Update Stats
        setStats(prev => ({
            total: prev.total + 1,
            correct: prev.correct + (isCorrect ? 1 : 0)
        }));
        
        setResult(isCorrect ? "CORRECT!" : "INCORRECT");
        setConfidence(conf);
        
        let msg = isCorrect 
            ? `Good job! Time: ${timing.toFixed(1)}s` 
            : `Expected: ${targetChar}, Got: ${predictedChar}`;
            
        if (feedbackDetails) {
            msg += `\nWarning: ${feedbackDetails}`;
        }
        
        Alert.alert(isCorrect ? "Correct!" : "Try Again", msg);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Character Writing Test</Text>
            
            <View style={styles.statsRow}>
                <Text style={styles.statText}>Tests: {stats.total}</Text>
                <Text style={styles.statText}>Correct: {stats.correct}</Text>
                <Text style={styles.statText}>
                    Accuracy: {stats.total ? ((stats.correct/stats.total)*100).toFixed(1) : 0}%
                </Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.promptText}>
                    {targetChar ? `Target: ${targetChar}` : "Press Start"}
                </Text>
                <Text style={styles.timerText}>{timing.toFixed(1)}s</Text>
            </View>

            <WritingCanvas 
                key={canvasKey}
                width={CANVAS_SIZE} 
                height={CANVAS_SIZE} 
                onStrokesChanged={setStrokes} 
            />
            
            <View style={styles.controls}>
                <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={startNewTest}>
                    <Text style={styles.btnText}>New Character</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.btn, styles.btnBlue, (!targetChar || strokes.length === 0) && styles.btnDisabled]} 
                    onPress={checkAnswer}
                    disabled={!targetChar || strokes.length === 0}
                >
                    <Text style={styles.btnText}>Check Answer</Text>
                </TouchableOpacity>
            </View>

             <View style={styles.controls}>
                <TouchableOpacity style={[styles.btn, styles.btnOrange]} onPress={() => setCanvasKey(k => k + 1)}>
                    <Text style={styles.btnText}>Clear</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={[styles.btn, styles.btnPurple]} onPress={() => targetChar && speakPrompt(targetChar)}>
                    <Text style={styles.btnText}>Replay Audio</Text>
                </TouchableOpacity>
            </View>

            {result ? (
                <View style={styles.resultBox}>
                    <Text style={[styles.resultText, result === "CORRECT!" ? styles.green : styles.red]}>
                        {result}
                    </Text>
                    <Text>Confidence: {(confidence * 100).toFixed(1)}%</Text>
                </View>
            ) : null}
            
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    statText: {
        fontSize: 14,
        color: '#666',
    },
    infoBox: {
        marginBottom: 10,
        alignItems: 'center',
    },
    promptText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    timerText: {
        fontSize: 14,
        color: '#333',
    },
    controls: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-around',
        width: '100%',
    },
    btn: {
        padding: 15,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    btnGreen: { backgroundColor: '#4CAF50' },
    btnBlue: { backgroundColor: '#2196F3' },
    btnOrange: { backgroundColor: '#FF9800' },
    btnPurple: { backgroundColor: '#9C27B0' },
    btnDisabled: { backgroundColor: '#ccc' },
    resultBox: {
        marginTop: 20,
        alignItems: 'center',
    },
    resultText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    green: { color: 'green' },
    red: { color: 'red' },
});

export default WritingAssessmentScreen;
