import { Grid, Cell } from "./types";

export interface ValidationResult {
  isValid: boolean;
  conflicts: Set<string>; // Set of "row,col" strings for conflicting cells
}

export function validateBoard(grid: Grid): ValidationResult {
  const conflicts = new Set<string>();
  const size = grid.length;
  const queens: Cell[] = [];

  // Collect all queens
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].state === "QUEEN") {
        queens.push(grid[r][c]);
      }
    }
  }

  // Check each queen against every other queen
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const q1 = queens[i];
      const q2 = queens[j];

      let isConflict = false;

      // Row conflict
      if (q1.row === q2.row) isConflict = true;
      
      // Column conflict
      if (q1.col === q2.col) isConflict = true;

      // Color region conflict
      if (q1.color === q2.color) isConflict = true;

      // Diagonal touching conflict (King's move)
      if (Math.abs(q1.row - q2.row) === 1 && Math.abs(q1.col - q2.col) === 1) {
        isConflict = true;
      }

      if (isConflict) {
        conflicts.add(`${q1.row},${q1.col}`);
        conflicts.add(`${q2.row},${q2.col}`);
      }
    }
  }

  return {
    isValid: conflicts.size === 0 && queens.length === size,
    conflicts,
  };
}
