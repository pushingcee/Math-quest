export interface Player {
  id: number;
  name: string;
  position: number;
  score: number;
  color: string;
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

export type GameScreen = 'setup' | 'playing' | 'gameOver';

export interface TileData {
  index: number;
  difficulty?: number;
  points?: number;
  type: 'corner' | 'regular';
  label?: string;
}
