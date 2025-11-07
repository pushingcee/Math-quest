/**
 * Utility to dynamically color player sprite SVGs
 */

// Map of default accent colors to replace
const ACCENT_COLOR_MAP: Record<number, string> = {
  0: '#e74c3c', // Knight - red
  1: '#3498db', // Wizard - blue
  2: '#2ecc71', // Archer - green
  3: '#f39c12', // Rogue - orange
  4: '#9b59b6', // Jester - purple
};

/**
 * Replace accent colors in an SVG string with a custom color
 */
export function colorizePlayerSprite(spriteIndex: number, svgString: string, customColor: string): string {
  const defaultColor = ACCENT_COLOR_MAP[spriteIndex];

  if (!defaultColor) {
    return svgString;
  }

  // Replace all instances of the default accent color with the custom color
  return svgString.replace(new RegExp(defaultColor, 'gi'), customColor);
}
