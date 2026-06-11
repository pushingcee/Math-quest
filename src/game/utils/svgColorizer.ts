/**
 * Utility to dynamically color player sprite SVGs
 */

import { AVATAR_DEFAULT_COLORS } from '@/game/constants/colors';

/**
 * Replace accent colors in an SVG string with a custom color
 */
export function colorizePlayerSprite(spriteIndex: number, svgString: string, customColor: string): string {
  const defaultColor = AVATAR_DEFAULT_COLORS[spriteIndex];

  if (!defaultColor) {
    return svgString;
  }

  // Replace all instances of the default accent color with the custom color
  return svgString.replace(new RegExp(defaultColor, 'gi'), customColor);
}
