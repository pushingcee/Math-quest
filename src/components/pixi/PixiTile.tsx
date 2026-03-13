'use client';

import { useCallback, useMemo, useState, useEffect, memo } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics as PixiGraphics, Text as PixiText, Sprite as PixiSprite, Rectangle, Texture, Assets } from 'pixi.js';
import { TileData } from '@/types/game';
import { TileType, ObstacleType } from '@/game/constants/enums';
import { TileLayout } from '@/game/board/BoardLayout';
import { assetPath } from '@/utils/assetPath';

extend({ Container, Graphics: PixiGraphics, Text: PixiText, Sprite: PixiSprite });

// Shared textures — loaded once
let bronzeTexturePromise: Promise<Texture> | null = null;
function loadBronzeTexture(): Promise<Texture> {
  if (!bronzeTexturePromise) {
    bronzeTexturePromise = Assets.load(assetPath('/bronze-tile.jpg'));
  }
  return bronzeTexturePromise;
}

let shopTexturePromise: Promise<Texture> | null = null;
function loadShopTexture(): Promise<Texture> {
  if (!shopTexturePromise) {
    shopTexturePromise = Assets.load(assetPath('/shop-3.jpg'));
  }
  return shopTexturePromise;
}

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

export default memo(function PixiTile({
  tile,
  layout,
  teleporterMode = false,
  teleporterSelected = false,
  onTeleportClick,
}: PixiTileProps) {
  const { index, type, points, question, label } = tile;
  const { x, y, width, height } = layout;
  const isCorner = [0, 10, 20, 30].includes(index);
  const isRegular = type !== TileType.Corner && type !== TileType.Shop && type !== TileType.Obstacle;
  const isShop = type === TileType.Shop;


  const [bronzeTexture, setBronzeTexture] = useState<Texture | null>(null);
  useEffect(() => {
    if (isRegular) {
      loadBronzeTexture().then(setBronzeTexture);
    }
  }, [isRegular]);

  const [shopTexture, setShopTexture] = useState<Texture | null>(null);
  useEffect(() => {
    if (isShop) {
      loadShopTexture().then(setShopTexture);
    }
  }, [isShop]);

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
        // Regular tiles use the bronze texture sprite — skip solid fill
        bgColor = COLORS.regular;
      }

      const hasTextureSprite = (isRegular && bronzeTexture) || (isShop && shopTexture);
      if (!hasTextureSprite) {
        g.rect(x, y, width, height).fill({ color: bgColor, alpha: bgAlpha });
      }

      // Border (not on corners — they have their own styling)
      if (!isCorner) {
        g.rect(x, y, width, height).stroke({ color: COLORS.border, width: 1 });
      }
    },
    [x, y, width, height, type, tile.obstacleType, isCorner, isRegular, bronzeTexture, isShop, shopTexture, teleporterMode, teleporterSelected]
  );

  const drawTextBackground = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const padX = width * 0.1;
      const padY = height * 0.1;
      g.roundRect(x + padX, y + padY, width - padX * 2, height - padY * 2, 4)
        .fill({ color: 0x000000, alpha: 0.45 });
    },
    [x, y, width, height]
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
    // Shop tiles use image textures — only show text as fallback
    if (!shopTexture) {
      mainText = '🏪';
      mainFontSize = Math.max(12, width * 0.35);
      secondaryText = 'SHOP';
    }
  } else if (type === TileType.Obstacle) {
    mainText = tile.obstacleType === ObstacleType.Slip ? '🧊' : '⚠️';
    mainFontSize = Math.max(12, width * 0.35);
  } else {
    // Regular tile — show points number (or ? if no points)
    mainText = points ? `${points}` : '?';
    mainFontSize = Math.max(8, width * 0.22 * 1.05);
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

      {/* Bronze texture for regular tiles */}
      {isRegular && bronzeTexture && (
        <pixiSprite texture={bronzeTexture} x={x} y={y} width={width} height={height} />
      )}

      {/* Shop texture */}
      {isShop && shopTexture && (
        <pixiSprite texture={shopTexture} x={x} y={y} width={width} height={height} />
      )}

      {/* Semi-transparent background behind text on question tiles */}
      {isRegular && bronzeTexture && (
        <pixiGraphics draw={drawTextBackground} />
      )}

      {/* Main text */}
      <pixiText
        text={mainText}
        x={x + width / 2}
        y={y + height / 2 - (secondaryText ? mainFontSize * 0.4 : 0)}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{
          fontFamily: 'Arial',
          fontSize: mainFontSize,
          fill: (type === TileType.Corner || isRegular) ? COLORS.white : COLORS.tileText,
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
});
