# Dead Code & Leftover Cleanup

Artifacts remaining after the BoardGraph refactor (PR 1–3). Organized by severity.

---

## Dead Files (never imported anywhere)

| File | Last modified | Notes |
|------|---------------|-------|
| `src/components/Board.tsx` | Nov 2025 | Old CSS-grid board, replaced by `pixi/PixiBoard.tsx` |
| `src/components/PlayerToken.tsx` | Nov 2025 | Old HTML player token, replaced by `pixi/PixiPlayerToken.tsx` |
| `src/components/Tile.tsx` | Nov 2025 | Old HTML tile, replaced by `pixi/PixiTile.tsx` |
| `src/game/engine/GameActions.ts` | — | Redux-style action union type, never imported. The `GameAction` enum in `enums.ts` is also unused |

---

## Dead Functions / Methods

| Location | Function | Why dead |
|----------|----------|----------|
| `src/game/systems/BoardSystem.ts:107` | `getTileAt()` | Never called — `GameEngine` accesses `this.state.tiles[position]` directly |
| `src/game/systems/BoardSystem.ts:114` | `isCornerTile()` | Never called — corner detection now handled by graph linking |

---

## Dead Enum Members

| Location | Item | Why dead |
|----------|------|----------|
| `src/game/constants/enums.ts:46-69` | `GameAction` enum (entire thing) | Was for a reducer pattern that was replaced by `GameEngine` class methods. Never imported |

---

## Dead Interface / Unused Fields

| Location | Item | Notes |
|----------|------|-------|
| `src/types/game.ts:22-31` | `GameState` interface | This interface (with `boardSize`, `maxRounds`, `diceValue` etc.) is **never imported**. The real `GameState` lives in `src/game/engine/GameState.ts`. This is a stale duplicate |

---

## Unused Variables

| Location | Variable | Issue |
|----------|----------|-------|
| `src/game/debug/devtools.ts:59` | `freshState` | Declared via `this.engine.getState()` but never read |

---

## Unreachable Code

| Location | Lines | Description |
|----------|-------|-------------|
| `src/game/engine/GameEngine.ts:426-455` | Corner Bonus/Challenge handlers | `handleTileLanding` has special handlers for `SpecialTilePosition.Bonus` (index 10) and `SpecialTilePosition.Challenge` (index 20). These are corner tiles, which are **not in the traversal chain** — players can never land on them via normal movement. The only way to reach them is via teleporter or devtools, but `devtools.ts:62` already guards against corner tile landings. **Options:** remove the handlers, or keep them with a comment explaining they're defensive |

---

## Hardcoded Corner-Tile Arrays (redundant with graph)

These are `[0, 10, 20, 30]` arrays that duplicate knowledge now encoded in the graph (corners aren't linked). They still work correctly but are redundant.

| Location | Lines | Context |
|----------|-------|---------|
| `src/game/debug/devtools.ts:60-62` | `const cornerTiles = [0, 10, 20, 30]` | Guards tile landing — could use `boardGraph.getTileByIndex(i)?.next === null` instead |

---

## Stale Comments

| Location | Line | Issue |
|----------|------|-------|
| `src/game/board/BoardLayout.ts:24` | "Compute pixel positions for all 40 board tiles" | Loop creates 39 tiles (0–38), not 40 |
| `src/game/systems/BoardSystem.ts:9` | `@param boardSize Number of tiles on the board (default 40)` | Default is 39, not 40 |
| `src/game/engine/GameEngine.ts:459` | "Tiles under the BONUS corner (tile 10, cols 1-2, rows 10-11) get x2 points" | References CSS grid positions — game logic shouldn't know about rendering layout. The `bonusTiles = [8, 9, 11]` array on line 460 is a hardcoded layout dependency |
