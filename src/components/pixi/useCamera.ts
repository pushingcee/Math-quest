/**
 * Camera system: smoothly pans/zooms a "world" container
 * so the active player is centered in the viewport.
 *
 * On large screens where the full board fits, the camera shows the whole board.
 * On small screens (tablets/phones), it zooms in and follows the active player.
 */
import { useEffect, useRef, useCallback } from 'react';
import { Container, Ticker } from 'pixi.js';

interface CameraTarget {
  x: number; // world-space x to center on
  y: number; // world-space y to center on
}

interface CameraConfig {
  viewportWidth: number;
  viewportHeight: number;
  worldSize: number;
  ticker: Ticker | null;
}

const LERP_SPEED = 0.08; // per-frame lerp factor — smooth but responsive
const SNAP_THRESHOLD = 0.5; // stop lerping when within this many pixels

export function useCamera(
  worldRef: React.RefObject<Container | null>,
  target: CameraTarget | null,
  config: CameraConfig
) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const currentX = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const currentScale = useRef<number | null>(null);

  const computeCamera = useCallback(
    (targetPoint: CameraTarget) => {
      const { viewportWidth, viewportHeight, worldSize } = config;

      const fitScale = Math.min(viewportWidth / worldSize, viewportHeight / worldSize);
      const needsCamera = fitScale < 0.95;

      if (!needsCamera) {
        // Board fits fully — center it, no zoom
        return {
          x: (viewportWidth - worldSize * fitScale) / 2,
          y: (viewportHeight - worldSize * fitScale) / 2,
          scale: fitScale,
          needsCamera: false,
        };
      }

      // Zoom in to show ~60% of the board for context
      const zoomScale = Math.min(fitScale * 1.6, 1);

      // Center viewport on target
      const idealX = -(targetPoint.x * zoomScale) + viewportWidth / 2;
      const idealY = -(targetPoint.y * zoomScale) + viewportHeight / 2;

      // Clamp to board edges
      const minX = viewportWidth - worldSize * zoomScale;
      const minY = viewportHeight - worldSize * zoomScale;

      return {
        x: Math.max(minX, Math.min(0, idealX)),
        y: Math.max(minY, Math.min(0, idealY)),
        scale: zoomScale,
        needsCamera: true,
      };
    },
    [config.viewportWidth, config.viewportHeight, config.worldSize]
  );

  useEffect(() => {
    const world = worldRef.current;
    const { ticker } = config;
    if (!world || !ticker || !target || config.viewportWidth === 0) return;

    const desired = computeCamera(target);

    if (!desired.needsCamera) {
      // Board fits — just set it directly, no animation
      cleanupRef.current?.();
      cleanupRef.current = null;
      world.scale.set(desired.scale);
      world.x = desired.x;
      world.y = desired.y;
      currentX.current = desired.x;
      currentY.current = desired.y;
      currentScale.current = desired.scale;
      return;
    }

    // First time: snap instantly to the target
    if (currentX.current === null) {
      currentX.current = desired.x;
      currentY.current = desired.y;
      currentScale.current = desired.scale;
      world.x = desired.x;
      world.y = desired.y;
      world.scale.set(desired.scale);
    }

    // Lerp toward the desired position each frame
    cleanupRef.current?.();

    const tick = () => {
      const dx = desired.x - currentX.current!;
      const dy = desired.y - currentY.current!;
      const ds = desired.scale - currentScale.current!;

      if (Math.abs(dx) < SNAP_THRESHOLD && Math.abs(dy) < SNAP_THRESHOLD && Math.abs(ds) < 0.001) {
        // Close enough — snap and stop
        currentX.current = desired.x;
        currentY.current = desired.y;
        currentScale.current = desired.scale;
      } else {
        currentX.current! += dx * LERP_SPEED;
        currentY.current! += dy * LERP_SPEED;
        currentScale.current! += ds * LERP_SPEED;
      }

      world.x = currentX.current!;
      world.y = currentY.current!;
      world.scale.set(currentScale.current!);
    };

    ticker.add(tick);
    cleanupRef.current = () => ticker.remove(tick);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [worldRef, target?.x, target?.y, config.viewportWidth, config.viewportHeight, config.worldSize, config.ticker, computeCamera]);
}
