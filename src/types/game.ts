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

export interface GameState {
  players: Player[];
  currentPlayer: number;
  round: number;
  maxRounds: number;
  boardSize: number;
  diceValue: number;
  mathProblem: MathProblem | null;
  movesInRound: number;
}

export { GameScreen, Difficulty, TileType };

export interface TileData {
  index: number;
  difficulty?: Difficulty;
  points?: number;
  type: TileType;
  label?: string;
  question?: string;
  answer?: number;
  obstacleType?: ObstacleType;
}
