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
  Modifier = 'modifier',
}

export enum ObstacleType {
  Slip = 'slip',
  Trap = 'trap',
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
 * Game-rule scoring constants (not tile-specific — tile scoring is in board configs)
 */
export const TileScoring = {
  PassStart: {
    points: 50,
    message: 'Passed START! +50 points!',
  },
} as const;
