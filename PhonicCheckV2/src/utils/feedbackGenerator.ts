// src/utils/feedbackGenerator.ts - Dyslexia-friendly feedback system

import { PronunciationResult, SyllableScore, PhonemeScore } from '../types';

export class FeedbackGenerator {
  /**
   * Generate complete pronunciation result with supportive feedback
   */
  public generateResult(
    overallScore: number,
    syllableScores: SyllableScore[],
    phonemeScores: PhonemeScore[]
  ): PronunciationResult {
    const { feedback, emoji, encouragement } = this.generateFeedback(overallScore);

    return {
      overallScore: Math.round(overallScore),
      syllableScores,
      phonemeScores,
      feedback,
      emoji,
      encouragement,
    };
  }

  /**
   * Generate supportive feedback based on score
   */
  private generateFeedback(score: number): { 
    feedback: string; 
    emoji: string; 
    encouragement: string;
  } {
    if (score >= 85) {
      return {
        feedback: "Excellent! Sounds very clear! 🌟",
        emoji: "🌟",
        encouragement: "You're doing amazing! Keep it up!",
      };
    } else if (score >= 70) {
      return {
        feedback: "Good try! Almost there! 👍",
        emoji: "👍",
        encouragement: "You're getting better with each try!",
      };
    } else if (score >= 50) {
      return {
        feedback: "Nice effort! Let's try again slowly 🎯",
        emoji: "🎯",
        encouragement: "Practice makes progress! You can do it!",
      };
    } else {
      return {
        feedback: "Let's listen once more and repeat together 🤝",
        emoji: "🤝",
        encouragement: "Every practice helps! Let's try again!",
      };
    }
  }

  /**
   * Generate specific feedback for syllables
   */
  public generateSyllableFeedback(syllableScore: SyllableScore): string {
    if (syllableScore.score >= 85) {
      return `Perfect pronunciation of "${syllableScore.syllable}"! 🌟`;
    } else if (syllableScore.score >= 70) {
      return `"${syllableScore.syllable}" was good! Try holding the sounds a bit longer.`;
    } else if (syllableScore.score >= 50) {
      return `Let's practice "${syllableScore.syllable}" together. Listen carefully.`;
    } else {
      return `Let's break down "${syllableScore.syllable}" into smaller parts.`;
    }
  }

  /**
   * Generate phoneme-specific tips
   */
  public generatePhonemeTip(phoneme: string, score: number): string {
    const tips: { [key: string]: string } = {
      'AE': 'Open your mouth wide, like saying "aaah" at the doctor',
      'EH': 'Relax your jaw and smile slightly',
      'IH': 'Keep your mouth more closed, short sound',
      'OW': 'Round your lips like making an "O" shape',
      'R': 'Curl your tongue back slightly',
      'L': 'Touch your tongue to the roof of your mouth',
      'S': 'Keep your tongue behind your teeth',
      'TH': 'Put your tongue between your teeth gently',
      'SH': 'Round your lips and push air out softly',
    };

    if (score >= 70) {
      return `Great ${phoneme} sound!`;
    }

    return tips[phoneme] || `Let's practice the ${phoneme} sound together!`;
  }

  /**
   * Generate progress message
   */
  public generateProgressMessage(
    currentScore: number,
    previousScore: number | null
  ): string {
    if (previousScore === null) {
      return "Great start! Keep practicing! 🎯";
    }

    const improvement = currentScore - previousScore;

    if (improvement > 10) {
      return `Wow! You improved by ${improvement} points! 🚀`;
    } else if (improvement > 0) {
      return `Nice progress! You're getting better! 📈`;
    } else if (improvement === 0) {
      return "Keep practicing! You're doing great! 💪";
    } else {
      return "That's okay! Every practice helps! Keep trying! 🌈";
    }
  }

  /**
   * Generate achievement message
   */
  public generateAchievementMessage(wordsCompleted: number): string | null {
    const achievements = [
      { count: 5, message: "5 words practiced! You're on fire! 🔥" },
      { count: 10, message: "10 words! You're becoming a pronunciation pro! ⭐" },
      { count: 25, message: "25 words! Amazing dedication! 🏆" },
      { count: 50, message: "50 words! You're a pronunciation champion! 👑" },
      { count: 100, message: "100 words! Incredible achievement! 🎉" },
    ];

    const achievement = achievements.find(a => a.count === wordsCompleted);
    return achievement?.message || null;
  }

  /**
   * Generate encouraging random message
   */
  public getRandomEncouragement(): string {
    const messages = [
      "You're doing great! 🌟",
      "Keep up the good work! 💪",
      "Every practice makes you better! 📈",
      "You're a star! ⭐",
      "Believe in yourself! 🌈",
      "You're learning so fast! 🚀",
      "Amazing effort! 🎯",
      "You're improving every day! 🌱",
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export default FeedbackGenerator;
