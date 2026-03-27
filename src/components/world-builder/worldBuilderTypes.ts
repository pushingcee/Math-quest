export interface EditorTile {
  id: string;
  row: number;        // 1-based
  col: number;        // 1-based
  span: number;       // 1 or 2
  type: 'regular' | 'shop' | 'obstacle' | 'corner' | 'modifier';
  connectsTo: string | null;
  obstacleType?: 'slip' | 'trap';
  label?: string;
  onLand?: { scoreChange: number; message: string };
  modifierEffect?: { pointsMultiplier?: number };
}

export type PaletteType =
  | 'regular'
  | 'obstacle-slip'
  | 'obstacle-trap'
  | 'shop'
  | 'corner'
  | 'modifier'
  | 'eraser';

export interface EditorState {
  boardId: string;
  boardName: string;
  gridCols: number;
  gridRows: number;
  startTileId: string;
  tiles: EditorTile[];
  selectedTileIds: string[];
  connectMode: boolean;
  activePalette: PaletteType;
}

export interface GroupOffset {
  tileId: string;
  dRow: number;   // offset from anchor tile's row
  dCol: number;   // offset from anchor tile's col
}

export interface DragState {
  tileId: string;
  startX: number;   // pointer clientX at drag start
  startY: number;   // pointer clientY at drag start
  isDragging: boolean;
  groupOffsets: GroupOffset[];
}
