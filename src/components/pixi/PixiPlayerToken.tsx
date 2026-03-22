'use client';

import { useEffect, useRef, useCallback, useState, memo } from 'react';
import { extend, useApplication } from '@pixi/react';
import {
  Container,
  Graphics as PixiGraphics,
  Sprite as PixiSprite,
  Texture,
} from 'pixi.js';
import { Player } from '@/types/game';
import { TileLayout } from '@/game/board/BoardLayout';
import { getPlayerTexture } from './textureUtils';
import {
  startIdleAnimation,
  playWalkAnimation,
  startGlowPulse,
} from './animations';

extend({ Container, Graphics: PixiGraphics, Sprite: PixiSprite });

interface PixiPlayerTokenProps {
  player: Player;
  tileLayout: TileLayout;
  slotOffset: { x: number; y: number };
  isMoving: boolean;
  isActive: boolean;
  teleporterMode?: boolean;
}

const TOKEN_SIZE = 64;

export default memo(function PixiPlayerToken({
  player,
  tileLayout,
  slotOffset,
  isMoving,
  isActive,
  teleporterMode = false,
}: PixiPlayerTokenProps) {
  const { app } = useApplication();
  const [texture, setTexture] = useState<Texture | null>(null);
  const containerRef = useRef<Container>(null);
  const spriteContainerRef = useRef<Container>(null);
  const spriteRef = useRef<PixiSprite>(null);
  const glowRef = useRef<PixiGraphics>(null);
  const cleanupIdleRef = useRef<(() => void) | null>(null);
  const cleanupGlowRef = useRef<(() => void) | null>(null);
  const isAnimatingRef = useRef(false);
  const initializedRef = useRef(false);

  // Target position — slot offset is relative to tile center, -15 lifts the pawn visually
  const targetX = tileLayout.centerX - TOKEN_SIZE / 2 + slotOffset.x;
  const targetY = tileLayout.centerY - TOKEN_SIZE / 2 + slotOffset.y - 15;

  // Load texture
  useEffect(() => {
    let cancelled = false;
    getPlayerTexture(player.avatarIndex, player.color).then((tex) => {
      if (!cancelled) setTexture(tex);
    });
    return () => { cancelled = true; };
  }, [player.avatarIndex, player.color]);

  // Set initial position once (imperative, not via JSX props)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;
    container.x = targetX;
    container.y = targetY;
    initializedRef.current = true;
  }, [texture, targetX, targetY]);

  // Idle animation
  useEffect(() => {
    const spriteContainer = spriteContainerRef.current;
    if (!spriteContainer || !app?.ticker) return;

    cleanupIdleRef.current?.();
    cleanupIdleRef.current = startIdleAnimation(spriteContainer, 0, app.ticker);

    return () => {
      cleanupIdleRef.current?.();
      cleanupIdleRef.current = null;
    };
  }, [app?.ticker]);

  // Movement: slide + hop when target position changes while isMoving
  useEffect(() => {
    const container = containerRef.current;
    const spriteContainer = spriteContainerRef.current;
    if (!container || !spriteContainer || !app?.ticker || !initializedRef.current) return;

    if (isMoving) {
      // Grab current position before animating
      const fromX = container.x;
      const fromY = container.y;

      // Skip if already there
      if (fromX === targetX && fromY === targetY) return;

      // Wait for any in-progress animation to finish, then chain
      const doAnimate = () => {
        isAnimatingRef.current = true;
        cleanupIdleRef.current?.();

        playWalkAnimation(
          container,
          spriteContainer,
          spriteRef.current,
          fromX, fromY,
          targetX, targetY,
          300,
          app.ticker,
        ).then(() => {
          isAnimatingRef.current = false;
          if (spriteContainerRef.current && app?.ticker) {
            cleanupIdleRef.current = startIdleAnimation(spriteContainerRef.current, 0, app.ticker);
          }
        });
      };

      if (isAnimatingRef.current) {
        // Queue after current animation finishes — small delay
        const check = setInterval(() => {
          if (!isAnimatingRef.current) {
            clearInterval(check);
            doAnimate();
          }
        }, 16);
        return () => clearInterval(check);
      } else {
        doAnimate();
      }
    } else if (!isAnimatingRef.current) {
      // Snap when not moving (teleport, initial)
      container.x = targetX;
      container.y = targetY;
    }
  }, [targetX, targetY, isMoving, app?.ticker]);

  // Active player glow — controlled entirely via ref, never via JSX props
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    // Always reset first
    cleanupGlowRef.current?.();
    cleanupGlowRef.current = null;
    glow.scale.set(0);
    glow.alpha = 0;
    glow.visible = false;

    if (isActive && app?.ticker) {
      glow.visible = true;
      cleanupGlowRef.current = startGlowPulse(glow, app.ticker);
    }

    return () => {
      cleanupGlowRef.current?.();
      cleanupGlowRef.current = null;
    };
  }, [isActive, app?.ticker]);

  const drawGlow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const color = parseInt(player.color.replace('#', ''), 16);
      g.ellipse(TOKEN_SIZE / 2, TOKEN_SIZE + 5, TOKEN_SIZE * 0.45, TOKEN_SIZE * 0.3)
        .fill({ color, alpha: 0.6 });
    },
    [player.color]
  );

  if (!texture) return null;

  return (
    <pixiContainer ref={containerRef} zIndex={50} eventMode={teleporterMode ? 'none' : 'auto'}>
      {/* Active player glow ellipse — alpha/scale controlled imperatively by startGlowPulse */}
      <pixiGraphics ref={glowRef} draw={drawGlow} />

      {/* Sprite wrapper — walk animation applies hop here (no pivot) */}
      <pixiContainer ref={spriteContainerRef}>
        {/* Sprite anchored at center so rotation tilts from middle */}
        <pixiSprite
          ref={spriteRef}
          texture={texture}
          width={TOKEN_SIZE}
          height={TOKEN_SIZE}
          anchor={0.5}
          x={TOKEN_SIZE / 2}
          y={TOKEN_SIZE / 2}
        />
      </pixiContainer>
    </pixiContainer>
  );
});
