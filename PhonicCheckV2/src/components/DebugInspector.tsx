// src/components/DebugInspector.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts } from '../theme';

interface DebugInspectorProps {
    capturedWord: string;
    targetWord: string;
    scores: { word: string, score: number }[];
    phonemeScores: any[]; // From original result
    isNativeFallback?: boolean;
}

const DebugInspector: React.FC<DebugInspectorProps> = ({ capturedWord, targetWord, scores, phonemeScores, isNativeFallback }) => {
    
    // Determine status
    const isMatch = capturedWord === targetWord;
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔍 Premium Inspection</Text>
            
            {isNativeFallback && (
                <View style={styles.fallbackBadge}>
                    <Text style={styles.fallbackText}>☁️ Cloud AI Recognition</Text>
                </View>
            )}
            
            <View style={styles.comparisonBox}>
                <View style={[styles.wordChip, { borderColor: colors.primary }]}>
                    <Text style={styles.label}>Target</Text>
                    <Text style={styles.word}>{targetWord}</Text>
                </View>

                <Text style={styles.arrow}>{isMatch ? "=" : "≠"}</Text>

                <View style={[styles.wordChip, { borderColor: isMatch ? colors.success : colors.error }]}>
                    <Text style={styles.label}>Heard</Text>
                    <Text style={[styles.word, { color: isMatch ? colors.success : colors.error }]}>
                        {capturedWord}
                    </Text>
                </View>
            </View>

            {!isMatch && (
                <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                        It sounded like you swapped a sound. 
                        Try checking the position of your tongue!
                    </Text>
                </View>
            )}

            <Text style={styles.subTitle}>Possibilities Checked:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scoreRow}>
                {scores.sort((a,b) => b.score - a.score).map((s, i) => (
                    <View key={i} style={[styles.scoreChip, s.word === capturedWord && styles.winnerChip]}>
                        <Text style={styles.scoreWord}>{s.word}</Text>
                        <Text style={styles.scoreVal}>{s.score}%</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        backgroundColor: '#1a1a2e', // Premium Dark
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    title: {
        color: '#ffd700', // Gold
        fontFamily: fonts.primaryBold,
        fontSize: 16,
        marginBottom: 12,
    },
    comparisonBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    wordChip: {
        borderWidth: 2,
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        minWidth: 80,
    },
    label: {
        color: '#aaa',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    word: {
        color: '#fff',
        fontSize: 18,
        fontFamily: fonts.primaryBold,
        marginTop: 4,
    },
    arrow: {
        color: '#666',
        fontSize: 24,
        marginHorizontal: 12,
    },
    hintBox: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
    },
    hintText: {
        color: '#ff6b6b',
        fontSize: 12,
        textAlign: 'center',
    },
    subTitle: {
        color: '#888',
        fontSize: 12,
        marginBottom: 8,
    },
    scoreRow: {
        flexDirection: 'row',
    },
    scoreChip: {
        backgroundColor: '#333',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 8,
        alignItems: 'center',
    },
    winnerChip: {
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: '#fff',
    },
    scoreWord: {
        color: '#eee',
        fontSize: 12,
    },
    scoreVal: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    fallbackBadge: {
        backgroundColor: '#673ab7', // Deep Purple
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    fallbackText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default DebugInspector;
