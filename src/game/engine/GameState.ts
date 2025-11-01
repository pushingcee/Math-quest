import { Player, MathProblem, TileData, GameScreen } from '@/types/game';
import { ImportedProblemsData, ImportedProblem } from '@/types/imported-problems';
import { MessageType } from '@/game/constants/enums';

export interface GameConfig {
  negativePointsEnabled: boolean;
  timerEnabled: boolean;
  timerDuration: number;
  autoCloseModal: boolean;
  maxRounds: number;
  boardSize: number;
}

export interface GameMessage {
  text: string;
  type: MessageType;
  streak?: number;
}

export interface BannerMessage {
  text: string;
  type: MessageType;
}

export interface GameState {
  // Screen & Flow
  screen: GameScreen;
  currentPlayer: number;
  round: number;
  movesInRound: number;

  // Players
  players: Player[];

  // Board
  tiles: TileData[];

  // Dice
  diceValue: number;
  isRolling: boolean;

  // Math Problem
  mathProblem: MathProblem | null;
  timeLeft: number;
  isPaused: boolean;

  // Movement
  movingPlayer: number | null;

  // Imported Problems
  importedProblems: ImportedProblemsData | null;
  problemPool: ImportedProblem[];
  usedProblemIds: Set<number>;

  // Configuration
  config: GameConfig;

  // Messages
  message: GameMessage | null;
  bannerMessage: BannerMessage | null;
}

export const createInitialState = (): GameState => ({
  screen: GameScreen.Setup,
  currentPlayer: 0,
  round: 1,
  movesInRound: 0,
  players: [],
  tiles: [],
  diceValue: 0,
  isRolling: false,
  mathProblem: null,
  timeLeft: 0,
  isPaused: false,
  movingPlayer: null,
  importedProblems: null,
  problemPool: [],
  usedProblemIds: new Set(),
  config: {
    negativePointsEnabled: true,
    timerEnabled: false,
    timerDuration: 30,
    autoCloseModal: true,
    maxRounds: 10,
    boardSize: 40,
  },
  message: null,
  bannerMessage: null,
});
