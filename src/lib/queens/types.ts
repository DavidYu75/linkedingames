export type CellState = "EMPTY" | "QUEEN" | "CROSS";

export interface Cell {
  row: number;
  col: number;
  color: number; // ID of the color region
  state: CellState;
}

export type Grid = Cell[][];

export type GameStatus = "PLAYING" | "WON" | "LOST";

export interface Level {
  size: number;
  grid: Grid; // Initial grid (usually empty but with colors defined)
}
