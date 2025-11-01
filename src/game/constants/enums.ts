/**
 * Game enums - Single source of truth for all string/number constants
 */

export enum GameScreen {
  Setup = 'setup',
  AvatarSelection = 'avatarSelection',
  Playing = 'playing',
  GameOver = 'gameOver',
}

export enum MessageType {
  Success = 'success',
  Error = 'error',
}

export enum TileType {
  Corner = 'corner',
  Regular = 'regular',
}

export enum SpecialTilePosition {
  Start = 0,
  Bonus = 10,
  Challenge = 20,
  Penalty = 30,
}

export enum Difficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3,
}

export enum GameAction {
  StartGame = 'START_GAME',
  ResetGame = 'RESET_GAME',
  SetScreen = 'SET_SCREEN',
  InitializePlayers = 'INITIALIZE_PLAYERS',
  SetTiles = 'SET_TILES',
  SetCurrentPlayer = 'SET_CURRENT_PLAYER',
  SetRound = 'SET_ROUND',
  IncrementMovesInRound = 'INCREMENT_MOVES_IN_ROUND',
  ResetMovesInRound = 'RESET_MOVES_IN_ROUND',
  RollDiceStart = 'ROLL_DICE_START',
  RollDiceEnd = 'ROLL_DICE_END',
  SetMovingPlayer = 'SET_MOVING_PLAYER',
  UpdatePlayerPosition = 'UPDATE_PLAYER_POSITION',
  UpdatePlayerScore = 'UPDATE_PLAYER_SCORE',
  UpdatePlayerStreak = 'UPDATE_PLAYER_STREAK',
  ShowMathProblem = 'SHOW_MATH_PROBLEM',
  CloseMathProblem = 'CLOSE_MATH_PROBLEM',
  SetTimeLeft = 'SET_TIME_LEFT',
  TogglePause = 'TOGGLE_PAUSE',
  SetMessage = 'SET_MESSAGE',
  SetBannerMessage = 'SET_BANNER_MESSAGE',
  UpdateProblemPool = 'UPDATE_PROBLEM_POOL',
}

export enum TileLandingResult {
  Math = 'math',
  Special = 'special',
  Next = 'next',
}

/**
 * Special tile scoring constants
 */
export const TileScoring = {
  [SpecialTilePosition.Start]: {
    points: 50,
    label: 'START<br>+50pts',
    message: 'Landed on START! +50 points!',
  },
  [SpecialTilePosition.Bonus]: {
    difficulty: Difficulty.Medium,
    points: 2,
    label: 'BONUS<br>×2pts',
    message: 'BONUS! Your next correct answer worth double!',
  },
  [SpecialTilePosition.Challenge]: {
    difficulty: Difficulty.Hard,
    points: 100,
    label: 'CHALLENGE<br>±100pts',
    message: 'CHALLENGE! High risk, high reward!',
  },
  [SpecialTilePosition.Penalty]: {
    points: -30,
    label: 'PENALTY<br>-30pts',
    message: 'PENALTY! -30 points!',
    messageNoDeduct: 'PENALTY! (No points deducted)',
  },
  PassStart: {
    points: 50,
    message: 'Passed START! +50 points!',
  },
} as const;
