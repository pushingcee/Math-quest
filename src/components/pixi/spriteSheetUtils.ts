/**
 * Sprite-strip loader: slices a horizontal strip PNG into individual frame Textures.
 */
import { Texture, Rectangle, Assets } from 'pixi.js';
import { assetPath } from '@/utils/assetPath';

const stripCache = new Map<string, Texture[]>();

/**
 * Load a horizontal sprite strip and slice it into frame textures.
 * @param path  - public path to the strip image (e.g. '/sprites/knight/idle.png')
 * @param frameWidth  - width of each frame in pixels
 * @param frameHeight - height of each frame in pixels
 */
export async function loadSpriteStrip(
  path: string,
  frameWidth: number,
  frameHeight: number,
): Promise<Texture[]> {
  const key = path;
  if (stripCache.has(key)) return stripCache.get(key)!;

  const baseTexture = await Assets.load(assetPath(path));
  const frameCount = Math.floor(baseTexture.width / frameWidth);
  const frames: Texture[] = [];

  for (let i = 0; i < frameCount; i++) {
    const frame = new Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
    frames.push(new Texture({ source: baseTexture.source, frame }));
  }

  stripCache.set(key, frames);
  return frames;
}

/** Clean up all cached strip textures. */
export function destroySpriteStripCache(): void {
  stripCache.forEach((frames) => {
    frames.forEach((f) => f.destroy());
  });
  stripCache.clear();
}
