import { GameScreen, TileType, Difficulty, ObstacleType } from '@/game/constants/enums';
import { PlayerItem } from './items';

export interface Player {
  id: number;
  name: string;
  position: number;
  score: number;
  color: string;
  streak?: number;
  avatarIndex: number;
  coins: number;
  inventory: PlayerItem[];
}

export interface MathProblem {
  question: string;
  answer: number;
  points: number;
}

export { GameScreen, Difficulty, TileType };

export interface TileLandingEffect {
  scoreChange: number;
  message: string;
  messageNoDeduct?: string;
}

export interface TileData {
  index: number;
  type: TileType;
  label?: string;
  // Math problem (Regular tiles)
  difficulty?: Difficulty;
  points?: number;
  question?: string;
  answer?: number;
  // Obstacle
  obstacleType?: ObstacleType;
  // Landing effect (e.g. Start +50pts, Penalty -30pts)
  onLand?: TileLandingEffect;
  // Points multiplier for math problems on this tile (default 1)
  pointsMultiplier?: number;
}
