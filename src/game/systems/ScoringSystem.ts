import { Player } from '@/types/game';
import { SpecialTilePosition, TileScoring } from '../constants/enums';

export interface AnswerResult {
  correct: boolean;
  scoreChange: number;
  coinReward: number;
  newStreak: number;
  message: string;
}

export class ScoringSystem {
  /**
   * Calculate score change and streak for a submitted answer
   */
  static calculateAnswerResult(
    userAnswer: number,
    correctAnswer: number,
    points: number,
    currentStreak: number,
    negativePointsEnabled: boolean
  ): AnswerResult {
    const correct = userAnswer === correctAnswer;

    if (correct) {
      return {
        correct: true,
        scoreChange: points,
        coinReward: 15,
        newStreak: currentStreak + 1,
        message: `+${points} points!`
      };
    } else {
      return {
        correct: false,
        scoreChange: negativePointsEnabled ? -points : 0,
        coinReward: 0,
        newStreak: 0,
        message: negativePointsEnabled
          ? `The answer was ${correctAnswer}. -${points} points!`
          : `The answer was ${correctAnswer}.`
      };
    }
  }

  /**
   * Calculate timeout result (wrong answer due to time running out)
   */
  static calculateTimeoutResult(
    correctAnswer: number,
    points: number,
    negativePointsEnabled: boolean
  ): AnswerResult {
    return {
      correct: false,
      scoreChange: negativePointsEnabled ? -points : 0,
      coinReward: 0,
      newStreak: 0,
      message: negativePointsEnabled
        ? `⏰ You ran out of time! The correct answer was ${correctAnswer}. -${points} points!`
        : `⏰ You ran out of time! The correct answer was ${correctAnswer}.`
    };
  }

  /**
   * Calculate score for special tiles
   */
  static calculateSpecialTileScore(position: number): { scoreChange: number; message: string } | null {
    switch (position) {
      case SpecialTilePosition.Start:
        return {
          scoreChange: TileScoring[SpecialTilePosition.Start].points,
          message: TileScoring[SpecialTilePosition.Start].message
        };
      case SpecialTilePosition.Penalty:
        return {
          scoreChange: TileScoring[SpecialTilePosition.Penalty].points,
          message: TileScoring[SpecialTilePosition.Penalty].message
        };
      default:
        return null;
    }
  }

  /**
   * Calculate bonus for passing START
   */
  static calculatePassStartBonus(): { scoreChange: number; coinReward: number; message: string } {
    return {
      scoreChange: TileScoring.PassStart.points,
      coinReward: 30,
      message: TileScoring.PassStart.message
    };
  }

  /**
   * Check if player should get celebration (streak >= 3)
   */
  static shouldCelebrate(streak: number): boolean {
    return streak >= 3;
  }

  /**
   * Apply score change to player (ensures score doesn't go negative)
   */
  static applyScoreChange(player: Player, scoreChange: number): Player {
    return {
      ...player,
      score: Math.max(0, player.score + scoreChange)
    };
  }
}
