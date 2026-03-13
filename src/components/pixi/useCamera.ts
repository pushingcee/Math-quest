/**
 * Camera system: scales the "world" container to fit the full board
 * centered in the viewport on any screen size.
 */
import { useEffect } from 'react';
import { Container, Ticker } from 'pixi.js';

interface CameraTarget {
  x: number;
  y: number;
}

interface CameraConfig {
  viewportWidth: number;
  viewportHeight: number;
  worldSize: number;
  ticker: Ticker | null;
}

export function useCamera(
  worldRef: React.RefObject<Container | null>,
  target: CameraTarget | null,
  config: CameraConfig
) {
  useEffect(() => {
    const world = worldRef.current;
    if (!world || config.viewportWidth === 0) return;

    const { viewportWidth, viewportHeight, worldSize } = config;
    const fitScale = Math.min(viewportWidth / worldSize, viewportHeight / worldSize);

    // Always show the full board, centered in the viewport
    world.scale.set(fitScale);
    world.x = (viewportWidth - worldSize * fitScale) / 2;
    world.y = (viewportHeight - worldSize * fitScale) / 2;
  }, [worldRef, config.viewportWidth, config.viewportHeight, config.worldSize]);
}
