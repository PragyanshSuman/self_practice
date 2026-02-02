// src/utils/reportGenerator.ts - Generates clinical reports from practice data

import { PracticeSession, ClinicalReport } from '../types';

export class ReportGenerator {
    public generateReport(history: PracticeSession[]): ClinicalReport {
        if (!history || history.length === 0) {
            return this.getEmptyReport();
        }

        const totalSessions = history.length;
        const averageScore = this.calculateAverageScore(history);
        const consistencyScore = this.calculateConsistency(history, averageScore);
        const phonemeStats = this.analyzePhonemes(history);
        const progressTrend = this.calculateTrend(history);

        // Identify weakest and strongest phonemes
        const sortedPhonemes = Object.values(phonemeStats).sort((a, b) => a.averageScore - b.averageScore);

        // Bottom 20% or hard count
        const weakestPhonemes = sortedPhonemes.slice(0, 5).filter(p => p.count >= 3); // Only count if attempted at least 3 times
        const strongestPhonemes = sortedPhonemes.reverse().slice(0, 5).filter(p => p.count >= 3);

        return {
            generatedAt: Date.now(),
            totalSessions,
            averageScore,
            consistencyScore,
            weakestPhonemes,
            strongestPhonemes,
            progressTrend,
            recommendations: this.generateRecommendations(averageScore, weakestPhonemes, consistencyScore),
        };
    }

    private getEmptyReport(): ClinicalReport {
        return {
            generatedAt: Date.now(),
            totalSessions: 0,
            averageScore: 0,
            consistencyScore: 0,
            weakestPhonemes: [],
            strongestPhonemes: [],
            progressTrend: 'stable',
            recommendations: ['No data available for analysis yet.'],
        };
    }

    private calculateAverageScore(history: PracticeSession[]): number {
        const sum = history.reduce((acc, sess) => acc + sess.score, 0);
        return Math.round(sum / history.length);
    }

    private calculateConsistency(history: PracticeSession[], mean: number): number {
        if (history.length < 2) return 100; // Perfect consistency if only 1 session

        const variance = history.reduce((acc, sess) => acc + Math.pow(sess.score - mean, 2), 0) / history.length;
        const stdDev = Math.sqrt(variance);

        // Normalize consistency score (0-100 where 100 is most consistent)
        // Assuming scores range 0-100, standard deviation is rarely > 50
        return Math.max(0, 100 - Math.round(stdDev));
    }

    private analyzePhonemes(history: PracticeSession[]) {
        const phonemeMap: Record<string, { phoneme: string; totalScore: number; count: number; averageScore: number }> = {};

        history.forEach(session => {
            // We assume session stores granular phoneme data. 
            // Current type definition: syllableScores has phonemes
            session.syllableScores.forEach(syllable => {
                syllable.phonemes.forEach(p => {
                    if (!phonemeMap[p.phoneme]) {
                        phonemeMap[p.phoneme] = { phoneme: p.phoneme, totalScore: 0, count: 0, averageScore: 0 };
                    }
                    phonemeMap[p.phoneme].totalScore += p.score;
                    phonemeMap[p.phoneme].count += 1;
                });
            });
        });

        // Calculate averages
        Object.keys(phonemeMap).forEach(key => {
            phonemeMap[key].averageScore = Math.round(phonemeMap[key].totalScore / phonemeMap[key].count);
        });

        return phonemeMap;
    }

    private calculateTrend(history: PracticeSession[]): 'improving' | 'stable' | 'declining' {
        if (history.length < 10) return 'stable';

        const firstHalf = history.slice(0, Math.floor(history.length / 2));
        const secondHalf = history.slice(Math.floor(history.length / 2));

        const avg1 = this.calculateAverageScore(firstHalf);
        const avg2 = this.calculateAverageScore(secondHalf);

        if (avg2 > avg1 + 5) return 'improving';
        if (avg2 < avg1 - 5) return 'declining';
        return 'stable';
    }

    private generateRecommendations(avgScore: number, weakest: any[], consistency: number): string[] {
        const recs: string[] = [];

        if (avgScore < 50) {
            recs.push("Overall accuracy is low. Consider reverting to 'Beginner' difficulty.");
        }

        if (consistency < 70) {
            recs.push("Performance is inconsistent. Regular daily practice is recommended to stabilize skills.");
        }

        if (weakest.length > 0) {
            const phones = weakest.map((p: any) => `/${p.phoneme}/`).join(', ');
            recs.push(`Specific intervention needed for phonemes: ${phones}.`);
        } else {
            recs.push("No specific phonological deficits identified currently.");
        }

        if (avgScore > 90 && consistency > 90) {
            recs.push("Mastery level achieved. Recommended to increase difficulty.");
        }

        return recs;
    }
}
