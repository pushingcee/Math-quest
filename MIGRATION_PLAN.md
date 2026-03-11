# PixiJS Migration Plan — Math Quest Board Game

## Goal

Replace the DOM-based board rendering (CSS Grid + absolute-positioned tokens) with a PixiJS canvas using `@pixi/react`. Keep all game logic in `GameEngine.ts` untouched. Keep all HTML modals/overlays (MathModal, MessageModal, ShopDrawer, etc.) as DOM — only the **board + tiles + player tokens** move to canvas.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│ MathQuest.tsx (orchestrator — mostly unchanged) │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │ <PixiBoard>  (NEW — replaces Board)  │    │
│  │  ├─ Background + Grid lines          │    │
│  │  ├─ TileSprites (40 tiles)           │    │
│  │  │   ├─ Corner tiles                 │    │
│  │  │   ├─ Shop tiles                   │    │
│  │  │   ├─ Obstacle tiles               │    │
│  │  │   └─ Regular tiles (math text)    │    │
│  │  ├─ PlayerSprites (1-4 players)      │    │
│  │  │   ├─ SVG→Texture conversion       │    │
│  │  │   ├─ Idle animation (ticker)      │    │
│  │  │   ├─ Bounce animation (ticker)    │    │
│  │  │   └─ Active glow (Graphics)       │    │
│  │  └─ Teleporter overlay (highlight)   │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  ┌──── DOM Overlays (UNCHANGED) ────────┐    │
│  │ MathModal, MessageModal, ShopDrawer, │    │
│  │ Dice, PlayerCards, TeleporterPrompt, │    │
│  │ ItemPrompt, DiceChoicePrompt,        │    │
│  │ BannerMessage                        │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## What Changes vs What Stays

| Component | Action | Notes |
|-----------|--------|-------|
| `GameEngine.ts` | **NO CHANGE** | Game logic is rendering-agnostic |
| `GameState.ts` | **NO CHANGE** | State shape stays the same |
| `MathQuest.tsx` | **MODIFY** | Remove DOM position calculation, swap `<Board>` for `<PixiBoard>`, remove `playerPositions` state |
| `Board.tsx` | **DELETE** (or keep as fallback) | Replaced by `PixiBoard` |
| `PlayerToken.tsx` | **DELETE** (or keep as fallback) | Replaced by `PixiPlayerToken` inside PixiBoard |
| `PlayerSprites.tsx` | **KEEP** | SVG strings still needed — converted to PixiJS textures |
| `svgColorizer.ts` | **KEEP** | Still used to colorize SVGs before texture conversion |
| `Dice.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `MathModal.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `MessageModal.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `ShopDrawer.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `TeleporterPrompt.tsx` | **MODIFY** | Keep the confirmation modal as DOM; tile selection highlighting moves to PixiBoard |
| `ItemPrompt.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `DiceChoicePrompt.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `PlayerCard.tsx` | **NO CHANGE** | Stays as DOM overlay |
| `globals.css` | **KEEP** | Animations still needed for DOM modals; board-specific ones (`idle`, `bounce-token`, `highlight-grow`) will be reimplemented in PixiJS tickers |

---

## Step-by-Step Implementation

### Phase 0: Install Dependencies

```bash
pnpm add pixi.js @pixi/react
```

**Verify compatibility**: PixiJS v8+ and `@pixi/react` v8+. Both must match major versions.

Create a test file to confirm PixiJS renders in the Next.js environment:

```tsx
// src/components/pixi/PixiTest.tsx
'use client';
import { Application, extend, Graphics } from '@pixi/react';
import { Container, Graphics as PixiGraphics } from 'pixi.js';

extend({ Container, Graphics: PixiGraphics });

export default function PixiTest() {
  return (
    <Application width={200} height={200} background="#1e293b">
      <Graphics draw={(g) => { g.rect(50, 50, 100, 100).fill(0xff0000); }} />
    </Application>
  );
}
```

Render this from a page to confirm it works. Fix any SSR issues (PixiJS is client-only — the component must use `'use client'` and may need dynamic import with `ssr: false`).

**Important SSR note**: PixiJS accesses `window`/`document` on import. If Next.js SSR fails, wrap the PixiBoard import with:
```tsx
import dynamic from 'next/dynamic';
const PixiBoard = dynamic(() => import('./pixi/PixiBoard'), { ssr: false });
```

---

### Phase 1: Board Layout Engine (Pure Math, No Rendering)

**Create file**: `src/game/board/BoardLayout.ts`

This is a pure function that computes tile positions and sizes given a board pixel dimension. No PixiJS dependency — just math.

```typescript
export interface TileLayout {
  index: number;
  x: number;       // top-left x in pixels
  y: number;       // top-left y in pixels
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface BoardLayoutResult {
  tiles: TileLayout[];
  boardWidth: number;
  boardHeight: number;
  tileSize: number;       // regular tile size
  cornerSize: number;     // corner tile size (2x)
}

export function computeBoardLayout(boardPixelSize: number): BoardLayoutResult
```

**Layout rules** (match the current 11x11 CSS grid):
- The board is square: `boardPixelSize × boardPixelSize`
- Corner tiles occupy 2×2 grid cells → `cornerSize = 2 * tileSize`
- `tileSize = boardPixelSize / 11`
- 40 tiles total arranged as a perimeter loop:
  - **Tiles 0 (Start/bottom-right corner)**: position `(9*tileSize, 9*tileSize)`, size `2×tileSize`
  - **Tiles 1-9 (bottom row, right→left)**: row y = `9*tileSize + (cornerSize - tileSize)/2` (vertically centered in corner row), x decreasing from `8*tileSize` to `0` — wait, let me be more precise:

Actually, replicate the exact CSS grid logic. The current grid is 11 columns × 11 rows. Each cell is equal size. Corner tiles span 2 cols × 2 rows.

**Grid cell mapping** (from `Board.tsx`):
- Tile 0 (corner): gridCol 10-11, gridRow 10-11 → cells (10,10) to (11,11) → bottom-right
- Tiles 1-9 (bottom): gridRow 11, gridCol 9→1 (right to left)
- Tile 10 (corner): gridCol 1-2, gridRow 10-11 → bottom-left
- Tiles 11-19 (left): gridCol 1, gridRow 9→1 (bottom to top)
- Tile 20 (corner): gridCol 1-2, gridRow 1-2 → top-left
- Tiles 21-29 (top): gridRow 1, gridCol 3→11 (left to right)
- Tile 30 (corner): gridCol 10-11, gridRow 1-2 → top-right
- Tiles 31-39 (right): gridCol 11, gridRow 3→9 (top to bottom)

Convert grid positions to pixel positions: `x = (gridCol - 1) * cellSize`, `y = (gridRow - 1) * cellSize`. Corner tiles have `width = height = 2 * cellSize`, regular tiles have `width = height = cellSize`.

**Important**: The grid columns and rows in `Board.tsx` use 1-based indexing. Double check by reading the actual grid position logic in Board.tsx (the `getGridPosition` function or equivalent).

---

### Phase 2: Tile Rendering Components

**Create file**: `src/components/pixi/PixiTile.tsx`

Each tile is rendered as a PixiJS `Container` with:

1. **Background** (`Graphics`):
   - Corner tiles: pink-to-rose gradient → approximate with a solid rose color `0xfda4af` (or use a simple two-color gradient via `Graphics.beginTextureFill` if desired)
   - Shop tiles: yellow `0xfbbf24`
   - Obstacle slip tiles: blue `0x3b82f6`
   - Obstacle trap tiles: red `0xef4444`
   - Regular tiles: white `0xffffff` with a 1px gray border stroke

2. **Border** (`Graphics`): 1px stroke around each tile

3. **Text labels** (`Text`):
   - Corner tiles: label text (e.g., "START +50pts", "BONUS ×2pts")
   - Shop tiles: "SHOP" + 🏪
   - Obstacle tiles: ⚠️ or 🧊
   - Regular tiles: points badge (e.g., "5pts")

4. **Math text on regular tiles**: The current implementation uses KaTeX to render math. In PixiJS, you have two options:
   - **Option A (recommended)**: Show "?" on all tiles and skip math rendering in tiles (simpler, and `displayProblemsInTiles` config already supports this)
   - **Option B**: Pre-render KaTeX to an offscreen DOM element, use `html2canvas` or `Texture.from(canvas)` to create textures. This is complex and slow — not recommended for initial migration.

   **Decision: Use Option A for the initial migration.** Math is already shown in the MathModal when a player lands on a tile. Tile math display is optional (`config.displayProblemsInTiles`).

5. **Teleporter highlight**: When `teleporterMode=true`, add a pulsing highlight overlay to clickable tiles, and attach `eventMode = 'static'` + `on('pointerdown')` handler.

**Props interface**:
```typescript
interface PixiTileProps {
  tile: TileData;
  layout: TileLayout;
  teleporterMode?: boolean;
  onTeleportClick?: (index: number) => void;
}
```

---

### Phase 3: Player Token Rendering

**Create file**: `src/components/pixi/PixiPlayerToken.tsx`

Each player token is a PixiJS `Container` containing:

1. **SVG Sprite as Texture**:
   - Take the SVG string from `PlayerSprites.tsx`
   - Colorize it via `colorizePlayerSprite()`
   - Convert to a PixiJS `Texture`:
     ```typescript
     function svgToTexture(svgString: string): Texture {
       const blob = new Blob([svgString], { type: 'image/svg+xml' });
       const url = URL.createObjectURL(blob);
       const texture = Texture.from(url);
       // Clean up blob URL after texture loads
       return texture;
     }
     ```
   - Render as a `Sprite` at 64×64 pixels
   - **Cache textures** — create them once per player (avatarIndex + color combo), not every frame

2. **Active player glow** (when `isActive=true`):
   - Render an ellipse below the sprite using `Graphics`
   - Fill with player color, alpha ~0.6
   - Apply `BlurFilter` with strength 2-4
   - Animate scale from 0→1 using a ticker (replaces `animate-highlight-grow`)

3. **Idle animation** (always running):
   - Use `app.ticker` to apply a gentle sine-wave vertical offset:
     ```typescript
     token.y = baseY + Math.sin(elapsed * 3) * 2; // 2px amplitude
     ```

4. **Bounce animation** (when `isMoving=true`):
   - Use ticker to play a bounce keyframe sequence over ~400ms:
     - 0%: y=0, scaleY=1
     - 30%: y=-5, scaleX=1.1, scaleY=0.9
     - 50%: y=-30, scaleX=0.95, scaleY=1.15
     - 70%: y=-10, scaleX=1.05, scaleY=0.95
     - 100%: y=0, scaleY=1
   - After bounce completes, return to idle animation

5. **Positioning**:
   - Position is calculated from the tile layout: `tileLayout.centerX - 32`, `tileLayout.centerY - 32`
   - Multiple players on same tile: apply stacking offset (same logic as current `calculateTokenPosition`)
   - Movement between tiles: use `gsap` (optional) or a simple linear interpolation in the ticker for smooth sliding

6. **`imageRendering: pixelated`** equivalent: Set `sprite.texture.source.scaleMode = 'nearest'` for crisp pixel art look

**Props interface**:
```typescript
interface PixiPlayerTokenProps {
  player: Player;
  tileLayout: TileLayout;
  stackOffset: { x: number; y: number };
  isMoving: boolean;
  isActive: boolean;
}
```

---

### Phase 4: Main PixiBoard Component

**Create file**: `src/components/pixi/PixiBoard.tsx`

This is the main component that replaces `Board.tsx`. It uses `@pixi/react` to render the PixiJS Application.

```typescript
'use client';

interface PixiBoardProps {
  tiles: TileData[];
  players: Player[];
  currentPlayer: number;
  movingPlayer: number | null;
  teleporterMode?: boolean;
  onTileTeleportClick?: (index: number) => void;
  boardSize?: number; // pixel size, default 600-800 based on viewport
}
```

**Structure**:
```tsx
<Application
  width={boardSize}
  height={boardSize}
  background={0x334155}  // slate-700
  antialias={true}
>
  {/* Board background with rounded corners */}
  <Graphics draw={drawBoardBackground} />

  {/* Tiles layer */}
  <Container>
    {tiles.map(tile => (
      <PixiTile
        key={tile.index}
        tile={tile}
        layout={boardLayout.tiles[tile.index]}
        teleporterMode={teleporterMode}
        onTeleportClick={onTileTeleportClick}
      />
    ))}
  </Container>

  {/* Players layer (above tiles) */}
  <Container>
    {players.map(player => (
      <PixiPlayerToken
        key={player.id}
        player={player}
        tileLayout={boardLayout.tiles[player.position]}
        stackOffset={computeStackOffset(player, players)}
        isMoving={movingPlayer === player.id}
        isActive={currentPlayer === player.id}
      />
    ))}
  </Container>
</Application>
```

**Responsive sizing**:
- Compute `boardSize` from container width (use a `ResizeObserver` or parent ref)
- Recompute `BoardLayout` when size changes
- The PixiJS `Application` resizes accordingly

**`@pixi/react` approach**: Use the `extend()` function to register PixiJS classes, then use them as JSX. Read `@pixi/react` v8 docs for the exact API — it changed significantly from v7. The v8 API uses `extend()` + intrinsic elements pattern:

```tsx
import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

// Then use as: <pixiContainer>, <pixiGraphics>, <pixiSprite>, <pixiText>
// OR uppercase depending on the @pixi/react version — check docs
```

---

### Phase 5: Integrate into MathQuest.tsx

**Modifications to `MathQuest.tsx`**:

1. **Remove** `playerPositions` state entirely — PixiBoard handles positioning internally
2. **Remove** `calculateTokenPosition()` function
3. **Remove** the `useEffect` that debounces position updates (lines 131-147)
4. **Remove** `getBoundingClientRect()` calls
5. **Replace** the `<Board>` + `PlayerToken` children render with:

```tsx
<PixiBoard
  tiles={gameState.tiles}
  players={gameState.players}
  currentPlayer={gameState.currentPlayer}
  movingPlayer={gameState.movingPlayer}
  teleporterMode={gameState.teleporterActive}
  onTileTeleportClick={(index) => engine.selectTeleportTile(index)}
/>
```

6. **Movement animation change**: Currently `handleMovePlayer` calls `movePlayerStep()` in a loop with `setTimeout(400ms)` between steps, and manually updates `playerPositions`. With PixiJS:
   - Still call `movePlayerStep()` to update `GameState.players[].position` one tile at a time
   - PixiBoard will detect position changes and animate the token smoothly between tiles
   - The 400ms delay between steps should remain (the engine drives the pace, PixiJS just animates the visual movement)
   - Inside `PixiPlayerToken`, when `player.position` changes, tween the sprite from old tile position to new tile position over ~350ms

7. **Keep all modal/overlay rendering exactly as-is** — they sit in the DOM above the canvas

---

### Phase 6: Animations in PixiJS

Replace CSS animations with PixiJS ticker-based animations.

**Create file**: `src/components/pixi/animations.ts`

```typescript
import { Ticker } from 'pixi.js';

// Idle bob: continuous sine wave
export function idleAnimation(sprite: Container, ticker: Ticker) {
  let elapsed = 0;
  const baseY = sprite.y;
  const tick = (delta: number) => {
    elapsed += delta.deltaTime * 0.016; // convert to seconds approx
    sprite.y = baseY + Math.sin(elapsed * 3) * 2;
  };
  ticker.add(tick);
  return () => ticker.remove(tick); // cleanup
}

// Bounce: one-shot keyframe sequence
export function bounceAnimation(sprite: Container, ticker: Ticker): Promise<void> {
  return new Promise((resolve) => {
    const duration = 400; // ms
    let elapsed = 0;
    const baseY = sprite.y;

    const tick = (delta: number) => {
      elapsed += delta.deltaTime * (1000 / 60);
      const t = Math.min(elapsed / duration, 1);

      // Keyframe interpolation
      if (t < 0.3) { /* squash down */ }
      else if (t < 0.5) { /* jump up */ }
      else if (t < 0.7) { /* come down */ }
      else { /* settle */ }

      if (t >= 1) {
        sprite.y = baseY;
        sprite.scale.set(1);
        ticker.remove(tick);
        resolve();
      }
    };
    ticker.add(tick);
  });
}

// Slide: smooth movement from A to B
export function slideAnimation(
  sprite: Container,
  fromX: number, fromY: number,
  toX: number, toY: number,
  duration: number,
  ticker: Ticker
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (delta: number) => {
      elapsed += delta.deltaTime * (1000 / 60);
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      sprite.x = fromX + (toX - fromX) * eased;
      sprite.y = fromY + (toY - fromY) * eased;
      if (t >= 1) {
        ticker.remove(tick);
        resolve();
      }
    };
    ticker.add(tick);
  });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
```

**Note**: Alternatively, you can use `gsap` with `@gsap/pixi` for easier tweening, but it adds a dependency. The manual ticker approach above keeps things lightweight.

---

### Phase 7: SVG-to-Texture Pipeline

**Create file**: `src/components/pixi/textureUtils.ts`

```typescript
import { Texture, Assets } from 'pixi.js';
import { getPlayerSprite } from '../PlayerSprites';
import { colorizePlayerSprite } from '@/game/utils/svgColorizer';

const textureCache = new Map<string, Texture>();

export async function getPlayerTexture(
  avatarIndex: number,
  color: string
): Promise<Texture> {
  const key = `${avatarIndex}-${color}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const svgString = colorizePlayerSprite(avatarIndex, getPlayerSprite(avatarIndex), color);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const texture = await Assets.load(url);
  URL.revokeObjectURL(url);

  textureCache.set(key, texture);
  return texture;
}
```

**Important**: `Assets.load()` is async. Load all player textures at game start (during `AvatarSelection → Playing` transition) and store them. Pass textures down as props or via a React context so `PixiPlayerToken` doesn't have to load them every render.

---

### Phase 8: Text Rendering in Tiles

PixiJS `Text` can render basic strings. For tile labels:

```typescript
import { Text, TextStyle } from 'pixi.js';

const tileTextStyle = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 10,
  fill: '#333',
  align: 'center',
  wordWrap: true,
  wordWrapWidth: tileSize - 4,
});
```

For tile point badges (e.g., "5pts"):
```typescript
const pointsStyle = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 8,
  fill: '#7c3aed',
  fontWeight: 'bold',
});
```

For corner tile labels that currently use HTML (`<br>` tags):
- Replace `<br>` with `\n` in the text string
- PixiJS `Text` handles `\n` natively

For emojis (🏪, ⚠️, 🧊): PixiJS `Text` renders emojis fine on most platforms. If rendering is inconsistent, pre-render emoji to a small canvas and use as texture.

**KaTeX/math in tiles**: As decided in Phase 2, skip math rendering in tiles for the initial migration. Use `"?"` placeholder. This can be revisited later using `HTMLText` from `@pixi/text-html` or offscreen rendering.

---

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `src/game/board/BoardLayout.ts` | Pure math: computes tile pixel positions from board size |
| `src/components/pixi/PixiBoard.tsx` | Main canvas component, replaces `Board.tsx` |
| `src/components/pixi/PixiTile.tsx` | Individual tile rendering (background, border, text) |
| `src/components/pixi/PixiPlayerToken.tsx` | Player sprite with animations |
| `src/components/pixi/animations.ts` | Ticker-based animation helpers (idle, bounce, slide) |
| `src/components/pixi/textureUtils.ts` | SVG→Texture conversion with caching |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/MathQuest.tsx` | Remove DOM position calculation, swap Board→PixiBoard, simplify movement handler |
| `src/components/TeleporterPrompt.tsx` | Remove tile highlighting (moved to PixiBoard), keep confirmation modal only |
| `package.json` | Add `pixi.js` and `@pixi/react` |

### Unchanged Files
| File | Why |
|------|-----|
| `GameEngine.ts` | Rendering-agnostic |
| `GameState.ts` | State shape unchanged |
| `PlayerSprites.tsx` | SVG strings still used |
| `svgColorizer.ts` | Still used for colorization |
| `Dice.tsx` | DOM overlay |
| `MathModal.tsx` | DOM overlay |
| `MessageModal.tsx` | DOM overlay |
| `ShopDrawer.tsx` | DOM overlay |
| `ItemPrompt.tsx` | DOM overlay |
| `DiceChoicePrompt.tsx` | DOM overlay |
| `PlayerCard.tsx` | DOM overlay |
| `globals.css` | Modal animations still used |

### Deletable After Migration
| File | Replaced By |
|------|-------------|
| `src/components/Board.tsx` | `PixiBoard.tsx` |
| `src/components/PlayerToken.tsx` | `PixiPlayerToken.tsx` |

---

## Implementation Order

Execute phases in this order. Each phase should be testable before moving on.

1. **Phase 0** — Install deps, confirm PixiJS renders in Next.js
2. **Phase 1** — `BoardLayout.ts` — write unit tests to verify tile positions match the current CSS grid
3. **Phase 2** — `PixiTile.tsx` — render static tiles, visually compare against current board
4. **Phase 8** — Text rendering in tiles (do this with Phase 2, it's part of tile rendering)
5. **Phase 4** — `PixiBoard.tsx` — assemble tiles into a full board, render from MathQuest
6. **Phase 7** — `textureUtils.ts` — SVG→Texture pipeline
7. **Phase 3** — `PixiPlayerToken.tsx` — render players on the board
8. **Phase 6** — `animations.ts` — add idle, bounce, slide animations
9. **Phase 5** — Integrate into MathQuest.tsx, wire up all interactions
10. **Cleanup** — Remove old Board.tsx/PlayerToken.tsx, remove unused CSS animations, test all flows

---

## Testing Checklist

After full migration, verify every interaction:

- [ ] Board renders with correct tile layout (matches original grid)
- [ ] All 4 tile types render with correct colors and labels
- [ ] Player tokens appear at correct starting positions
- [ ] Dice roll triggers movement animation (bounce + slide per tile)
- [ ] Multiple players on same tile are visually stacked
- [ ] Active player has glow indicator
- [ ] Teleporter mode highlights clickable tiles
- [ ] Clicking a tile in teleporter mode calls `selectTeleportTile`
- [ ] Passing START shows banner
- [ ] All modals still appear correctly above the canvas
- [ ] Board is responsive (resizes with viewport)
- [ ] No SSR errors in Next.js
- [ ] Audio still plays correctly during movement
- [ ] Game over screen works
- [ ] Shop tiles trigger shop drawer

---

## Gotchas & Warnings

1. **SSR**: PixiJS will crash during server-side rendering. Always use `'use client'` and `dynamic(() => import(...), { ssr: false })`.

2. **@pixi/react v8 API**: The API changed significantly from v7. Do NOT use the v7 `<Stage>` component pattern. v8 uses `<Application>` and `extend()`. Check the docs at https://github.com/pixijs/pixi-react.

3. **Texture memory leaks**: Always destroy textures when components unmount. Use `texture.destroy(true)` in cleanup.

4. **Text performance**: Creating many `Text` objects is expensive. For 40 tiles, this is fine. If performance is an issue, use `BitmapText` instead.

5. **Event propagation**: PixiJS events don't bubble to the DOM. The canvas captures clicks. For teleporter tile clicks, use PixiJS's `eventMode = 'static'` + `on('pointerdown')` on tile containers.

6. **Canvas stacking**: The canvas should have `position: relative` in the layout. DOM overlays (modals) sit above it via `z-index`. This should work naturally since modals already use `fixed` positioning with high z-index.

7. **Pixel art**: Set `texture.source.scaleMode = 'nearest'` on player sprites to match the current `image-rendering: pixelated` behavior.

8. **React strict mode**: PixiJS Application may initialize twice in development due to React strict mode. Handle this gracefully (idempotent setup, proper cleanup in useEffect return).
