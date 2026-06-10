/**
 * SVG-to-PixiJS Texture conversion with caching.
 */
import { Texture } from 'pixi.js';
import { playerSprites } from '../PlayerSprites';
import { colorizePlayerSprite } from '@/game/utils/svgColorizer';

const textureCache = new Map<string, Texture>();

// Rasterization size for player sprite textures (2x the 64px on-board token
// size, so tokens stay crisp on high-DPI screens).
const SPRITE_TEXTURE_SIZE = 128;

/**
 * Load an SVG string into an HTMLImageElement, rasterize it onto a canvas,
 * then create a PixiJS Texture from the canvas.
 *
 * The SVG must be given explicit pixel dimensions and go through a 2D canvas:
 * uploading an SVG-backed <img> with no intrinsic size directly to WebGL
 * fails on Firefox and Android WebView/Chrome, rendering as a black square.
 */
function loadSvgAsTexture(svgString: string): Promise<Texture> {
  const sizedSvg = svgString.replace(
    /<svg([^>]*)>/,
    `<svg$1 width="${SPRITE_TEXTURE_SIZE}" height="${SPRITE_TEXTURE_SIZE}">`
  );

  return new Promise((resolve, reject) => {
    const blob = new Blob([sizedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = SPRITE_TEXTURE_SIZE;
      canvas.height = SPRITE_TEXTURE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context for sprite rasterization'));
        return;
      }
      ctx.drawImage(img, 0, 0, SPRITE_TEXTURE_SIZE, SPRITE_TEXTURE_SIZE);
      resolve(Texture.from(canvas));
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
