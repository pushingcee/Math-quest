/**
 * Ticker-based animation helpers for PixiJS sprites.
 */
import { Container, Ticker } from 'pixi.js';

/**
 * Continuous idle bob animation.
 * Returns a cleanup function to stop.
 */
export function startIdleAnimation(
  sprite: Container,
  baseY: number,
  ticker: Ticker
): () => void {
  let elapsed = 0;

  const tick = (t: Ticker) => {
    elapsed += t.deltaTime * 0.016;
    sprite.y = baseY + Math.sin(elapsed * 4) * 2;
  };

  ticker.add(tick);
  return () => { try { ticker.remove(tick); } catch { /* ticker already destroyed */ } };
}

/**
 * Slide the outer container from one position to another while the inner
 * sprite does a gentle hop (small arc up and back down). This is the
 * "walking" animation used when moving tile-to-tile.
 *
 * @param outerContainer - the container whose x/y we move across the board
 * @param innerSprite    - the sprite container that gets the vertical hop offset
 * @param fromX/fromY    - starting board position
 * @param toX/toY        - ending board position
 * @param durationMs     - how long the move takes
 * @param hopHeight      - peak height of the hop arc (pixels)
 */
export function playWalkAnimation(
  outerContainer: Container,
  hopContainer: Container,
  tiltTarget: Container | null,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  durationMs: number,
  ticker: Ticker,
  hopHeight: number = 8,
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;

    const tick = (t: Ticker) => {
      elapsed += t.deltaTime * (1000 / 60);
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);

      // Slide the outer container across the board
      outerContainer.x = fromX + (toX - fromX) * eased;
      outerContainer.y = fromY + (toY - fromY) * eased;

      // Gentle hop arc on the hop container (parabola: 0 → peak → 0)
      const hop = -hopHeight * Math.sin(progress * Math.PI);
      hopContainer.y = hop;

      // South Park-style left/right tilt on the sprite (anchored at center)
      if (tiltTarget) {
        const tiltAngle = 0.12; // ~7 degrees
        const tiltSpeed = 3; // full wobble cycles per step
        tiltTarget.rotation = Math.sin(progress * Math.PI * 2 * tiltSpeed) * tiltAngle;
      }

      if (progress >= 1) {
        outerContainer.x = toX;
        outerContainer.y = toY;
        hopContainer.y = 0;
        if (tiltTarget) tiltTarget.rotation = 0;
        ticker.remove(tick);
        resolve();
      }
    };

    ticker.add(tick);
  });
}

/**
 * Pulsing highlight animation for active player glow.
 */
export function startGlowPulse(
  glow: Container,
  ticker: Ticker
): () => void {
  let elapsed = 0;

  const tick = (t: Ticker) => {
    elapsed += t.deltaTime * 0.016;

    if (elapsed < 0.8) {
      const p = elapsed / 0.8;
      const scale = easeOutCubic(p);
      glow.scale.set(scale);
      glow.alpha = 0.6 * scale;
    } else {
      const pulseTime = elapsed - 0.8;
      const pulse = 1 + Math.sin(pulseTime * 2) * 0.1;
      glow.scale.set(pulse);
      glow.alpha = 0.6;
    }
  };

  ticker.add(tick);
  return () => { try { ticker.remove(tick); } catch { /* ticker already destroyed */ } };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
