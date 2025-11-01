import { Player, MathProblem, TileData } from '@/types/game';
import { ImportedProblemsData, ImportedProblem } from '@/types/imported-problems';
import { GameConfig } from './GameState';

export type GameAction =
  | { type: 'START_GAME'; payload: { playerCount: number; problems?: ImportedProblemsData; config: Partial<GameConfig> } }
  | { type: 'RESET_GAME' }
  | { type: 'SET_SCREEN'; payload: 'setup' | 'playing' | 'gameOver' }
  | { type: 'INITIALIZE_PLAYERS'; payload: Player[] }
  | { type: 'SET_TILES'; payload: TileData[] }
  | { type: 'SET_CURRENT_PLAYER'; payload: number }
  | { type: 'SET_ROUND'; payload: number }
  | { type: 'INCREMENT_MOVES_IN_ROUND' }
  | { type: 'RESET_MOVES_IN_ROUND' }
  | { type: 'ROLL_DICE_START' }
  | { type: 'ROLL_DICE_END'; payload: number }
  | { type: 'SET_MOVING_PLAYER'; payload: number | null }
  | { type: 'UPDATE_PLAYER_POSITION'; payload: { playerId: number; position: number } }
  | { type: 'UPDATE_PLAYER_SCORE'; payload: { playerId: number; score: number } }
  | { type: 'UPDATE_PLAYER_STREAK'; payload: { playerId: number; streak: number } }
  | { type: 'SHOW_MATH_PROBLEM'; payload: MathProblem }
  | { type: 'CLOSE_MATH_PROBLEM' }
  | { type: 'SET_TIME_LEFT'; payload: number }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_MESSAGE'; payload: { text: string; type: 'success' | 'error'; streak?: number } | null }
  | { type: 'SET_BANNER_MESSAGE'; payload: { text: string; type: 'success' | 'error' } | null }
  | { type: 'UPDATE_PROBLEM_POOL'; payload: { pool: ImportedProblem[]; usedIds: Set<number> } };
