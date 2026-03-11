'use client';

import { useCallback, useMemo } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics as PixiGraphics, Text as PixiText, Rectangle } from 'pixi.js';
import { TileData } from '@/types/game';
import { TileType, ObstacleType } from '@/game/constants/enums';
import { TileLayout } from '@/game/board/BoardLayout';

extend({ Container, Graphics: PixiGraphics, Text: PixiText });

interface PixiTileProps {
  tile: TileData;
  layout: TileLayout;
  teleporterMode?: boolean;
  teleporterSelected?: boolean;
  onTeleportClick?: (index: number) => void;
}

// Color constants
const COLORS = {
  corner: 0xfb7185,      // rose-400
  shop: 0xfbbf24,        // yellow-400
  shopText: 0x7e22ce,    // purple-700
  obstacleSlip: 0xdbeafe, // blue-100
  obstacleTrap: 0xfee2e2, // red-100
  regular: 0xffffff,
  border: 0x475569,       // slate-600
  pointsText: 0x7c3aed,  // purple-600
  tileText: 0x333333,
  teleportHighlight: 0x22d3ee, // cyan-400
  white: 0xffffff,
};

export default function PixiTile({
  tile,
  layout,
  teleporterMode = false,
  teleporterSelected = false,
  onTeleportClick,
}: PixiTileProps) {
  const { index, type, points, question, label } = tile;
  const { x, y, width, height } = layout;
  const isCorner = [0, 10, 20, 30].includes(index);

  const drawTileBackground = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      // Teleporter highlight
      if (teleporterMode) {
        g.rect(x - 2, y - 2, width + 4, height + 4)
          .fill({ color: COLORS.teleportHighlight, alpha: teleporterSelected ? 0.6 : 0.3 });
      }

      // Background fill
      let bgColor: number;
      let bgAlpha = 1;

      if (type === TileType.Corner) {
        bgColor = COLORS.corner;
        bgAlpha = teleporterMode ? 0.5 : 0.3;
      } else if (type === TileType.Shop) {
        bgColor = COLORS.shop;
      } else if (type === TileType.Obstacle) {
        bgColor = tile.obstacleType === ObstacleType.Slip
          ? COLORS.obstacleSlip
          : COLORS.obstacleTrap;
      } else {
        bgColor = COLORS.regular;
      }

      g.rect(x, y, width, height).fill({ color: bgColor, alpha: bgAlpha });

      // Border (not on corners — they have their own styling)
      if (!isCorner) {
        g.rect(x, y, width, height).stroke({ color: COLORS.border, width: 1 });
      }
    },
    [x, y, width, height, type, tile.obstacleType, isCorner, teleporterMode, teleporterSelected]
  );

  // Determine text content
  let mainText = '';
  let mainFontSize = Math.max(8, width * 0.18);
  let secondaryText = '';

  if (type === TileType.Corner) {
    // Strip HTML tags from label, replace <br> with newline
    mainText = (label || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '');
    mainFontSize = Math.max(8, width * 0.12);
  } else if (type === TileType.Shop) {
    mainText = '🏪';
    mainFontSize = Math.max(12, width * 0.35);
    secondaryText = 'SHOP';
  } else if (type === TileType.Obstacle) {
    mainText = tile.obstacleType === ObstacleType.Slip ? '🧊' : '⚠️';
    mainFontSize = Math.max(12, width * 0.35);
  } else {
    // Regular tile
    mainText = question ? '?' : '?';
    mainFontSize = Math.max(8, width * 0.22);
    secondaryText = points ? `${points}pts` : '';
  }

  const handlePointerDown = useCallback(() => {
    if (teleporterMode && onTeleportClick) {
      onTeleportClick(index);
    }
  }, [teleporterMode, onTeleportClick, index]);

  // Hit area so PixiJS knows where clicks land
  const hitArea = useMemo(() => new Rectangle(x, y, width, height), [x, y, width, height]);

  return (
    <pixiContainer
      eventMode={teleporterMode ? 'static' : 'auto'}
      cursor={teleporterMode ? 'pointer' : 'auto'}
      hitArea={hitArea}
      zIndex={isCorner ? 10 : 1}
      onPointerDown={handlePointerDown}
    >
      <pixiGraphics draw={drawTileBackground} />

      {/* Main text */}
      <pixiText
        text={mainText}
        x={x + width / 2}
        y={y + height / 2 - (secondaryText ? mainFontSize * 0.4 : 0)}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{
          fontFamily: 'Arial',
          fontSize: mainFontSize,
          fill: type === TileType.Corner ? COLORS.white : COLORS.tileText,
          align: 'center',
          fontWeight: type === TileType.Corner ? 'bold' : 'normal',
          wordWrap: true,
          wordWrapWidth: width - 4,
        }}
      />

      {/* Secondary text (points badge or "SHOP" label) */}
      {secondaryText && (
        <pixiText
          text={secondaryText}
          x={x + width / 2}
          y={y + height / 2 + mainFontSize * 0.6}
          anchor={{ x: 0.5, y: 0.5 }}
          style={{
            fontFamily: 'Arial',
            fontSize: Math.max(6, width * 0.12),
            fill: type === TileType.Shop ? COLORS.shopText : COLORS.pointsText,
            fontWeight: 'bold',
            align: 'center',
          }}
        />
      )}
    </pixiContainer>
  );
}
