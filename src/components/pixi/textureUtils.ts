/**
 * SVG-to-PixiJS Texture conversion with caching.
 */
import { Texture } from 'pixi.js';
import { playerSprites } from '../PlayerSprites';
import { colorizePlayerSprite } from '@/game/utils/svgColorizer';

const textureCache = new Map<string, Texture>();

/**
 * Load an SVG string into an HTMLImageElement, then create a PixiJS Texture from it.
 */
function loadSvgAsTexture(svgString: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const texture = Texture.from(img);
      resolve(texture);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG as image: ${err}`));
    };

    img.src = url;
  });
}

/**
 * Get (or create and cache) a PixiJS texture for a player sprite.
 */
export async function getPlayerTexture(
  avatarIndex: number,
  color: string
): Promise<Texture> {
  const key = `player-${avatarIndex}-${color}`;

  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const svgString = colorizePlayerSprite(avatarIndex, playerSprites[avatarIndex], color);
  const texture = await loadSvgAsTexture(svgString);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Preload textures for all players at game start.
 */
export async function preloadPlayerTextures(
  players: { avatarIndex: number; color: string }[]
): Promise<Map<string, Texture>> {
  const results = new Map<string, Texture>();

  await Promise.all(
    players.map(async (p) => {
      const texture = await getPlayerTexture(p.avatarIndex, p.color);
      results.set(`player-${p.avatarIndex}-${p.color}`, texture);
    })
  );

  return results;
}

/**
 * Clean up all cached textures. Call on unmount.
 */
export function destroyTextureCache(): void {
  textureCache.forEach((texture) => {
    texture.destroy(true);
  });
  textureCache.clear();
}
