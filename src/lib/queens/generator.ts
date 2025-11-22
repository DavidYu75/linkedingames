import { Grid, Level } from "./types";

export function generateLevel(size: number = 8): Level {
  // TODO: Implement actual level generation with backtracking/CSP
  // For now, return a dummy grid with random colors
  
  const grid: Grid = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      color: Math.floor(Math.random() * size), // Placeholder: random colors
      state: "EMPTY",
    }))
  );

  return {
    size,
    grid,
  };
}
