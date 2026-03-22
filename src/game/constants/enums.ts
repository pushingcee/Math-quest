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
  Obstacle = 'obstacle',
  Shop = 'shop',
}

export enum ObstacleType {
  Slip = 'slip',
  Trap = 'trap',
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
