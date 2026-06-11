/**
 * Single source of truth for player colors.
 *
 * Used by avatar selection (pickable palette), sprite colorization
 * (replacing each avatar's default accent color), and player
 * initialization fallbacks.
 */

/** Colors a player can pick during avatar selection. */
export const PLAYER_COLOR_OPTIONS = [
  { nameKey: 'red', hex: '#e74c3c' },
  { nameKey: 'blue', hex: '#3498db' },
  { nameKey: 'green', hex: '#2ecc71' },
  { nameKey: 'orange', hex: '#f39c12' },
  { nameKey: 'purple', hex: '#9b59b6' },
  { nameKey: 'pink', hex: '#e91e63' },
  { nameKey: 'teal', hex: '#1abc9c' },
  { nameKey: 'yellow', hex: '#f1c40f' },
] as const;

/**
 * Default accent color per avatar index (Knight, Wizard, Archer, Rogue,
 * Jester). Also the color baked into each sprite's SVG that gets replaced
 * when a player picks a custom color.
 */
export const AVATAR_DEFAULT_COLORS: Record<number, string> = {
  0: '#e74c3c', // Knight - red
  1: '#3498db', // Wizard - blue
  2: '#2ecc71', // Archer - green
  3: '#f39c12', // Rogue - orange
  4: '#9b59b6', // Jester - purple
};
