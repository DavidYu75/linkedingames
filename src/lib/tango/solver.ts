// ============================================
// Tango Puzzle Solver
// Implements solving algorithm with deduction and backtracking
// ============================================

import {
  Symbol,
  Grid,
  Cell,
  EdgeConstraint,
  GRID_SIZE,
  SYMBOLS_PER_ROW,
} from "./types";
import { validateGrid } from "./validator";

/**
 * Create a deep copy of the grid
 */
function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Create a simple symbol grid (for solution storage)
 */
export function gridToSymbols(grid: Grid): Symbol[][] {
  return grid.map((row) => row.map((cell) => cell.value));
}

/**
 * Count symbols in a row
 */
function countRowSymbols(
  grid: Grid,
  row: number,
): { sun: number; moon: number; empty: number } {
  let sun = 0,
    moon = 0,
    empty = 0;
  for (let col = 0; col < GRID_SIZE; col++) {
    const val = grid[row][col].value;
    if (val === "sun") sun++;
    else if (val === "moon") moon++;
    else empty++;
  }
  return { sun, moon, empty };
}

/**
 * Count symbols in a column
 */
function countColSymbols(
  grid: Grid,
  col: number,
): { sun: number; moon: number; empty: number } {
  let sun = 0,
    moon = 0,
    empty = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    const val = grid[row][col].value;
    if (val === "sun") sun++;
    else if (val === "moon") moon++;
    else empty++;
  }
  return { sun, moon, empty };
}

/**
 * Get the opposite symbol
 */
function opposite(symbol: Symbol): Symbol {
  if (symbol === "sun") return "moon";
  if (symbol === "moon") return "sun";
  return null;
}

/**
 * Apply deductive rules to fill in forced cells
 * Returns true if any changes were made
 */
function applyDeduction(grid: Grid, constraints: EdgeConstraint[]): boolean {
  let changed = false;

  // Rule 1: If a row/column has 3 of one symbol, fill remaining with opposite
  for (let i = 0; i < GRID_SIZE; i++) {
    const rowCounts = countRowSymbols(grid, i);
    if (rowCounts.sun === SYMBOLS_PER_ROW && rowCounts.empty > 0) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[i][col].value === null) {
          grid[i][col].value = "moon";
          changed = true;
        }
      }
    }
    if (rowCounts.moon === SYMBOLS_PER_ROW && rowCounts.empty > 0) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[i][col].value === null) {
          grid[i][col].value = "sun";
          changed = true;
        }
      }
    }

    const colCounts = countColSymbols(grid, i);
    if (colCounts.sun === SYMBOLS_PER_ROW && colCounts.empty > 0) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row][i].value === null) {
          grid[row][i].value = "moon";
          changed = true;
        }
      }
    }
    if (colCounts.moon === SYMBOLS_PER_ROW && colCounts.empty > 0) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row][i].value === null) {
          grid[row][i].value = "sun";
          changed = true;
        }
      }
    }
  }

  // Rule 2: Prevent triple - if two adjacent cells have same symbol, neighbor must be opposite
  // Horizontal: check XX_ and _XX patterns
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      const v1 = grid[row][col].value;
      const v2 = grid[row][col + 1].value;

      if (v1 !== null && v1 === v2) {
        // Check left neighbor
        if (col > 0 && grid[row][col - 1].value === null) {
          grid[row][col - 1].value = opposite(v1);
          changed = true;
        }
        // Check right neighbor
        if (col + 2 < GRID_SIZE && grid[row][col + 2].value === null) {
          grid[row][col + 2].value = opposite(v1);
          changed = true;
        }
      }
    }
  }

  // Horizontal: check X_X pattern (gap must be opposite)
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 2; col++) {
      const v1 = grid[row][col].value;
      const v2 = grid[row][col + 1].value;
      const v3 = grid[row][col + 2].value;

      if (v1 !== null && v1 === v3 && v2 === null) {
        grid[row][col + 1].value = opposite(v1);
        changed = true;
      }
    }
  }

  // Vertical: check XX_ and _XX patterns
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row < GRID_SIZE - 1; row++) {
      const v1 = grid[row][col].value;
      const v2 = grid[row + 1][col].value;

      if (v1 !== null && v1 === v2) {
        // Check top neighbor
        if (row > 0 && grid[row - 1][col].value === null) {
          grid[row - 1][col].value = opposite(v1);
          changed = true;
        }
        // Check bottom neighbor
        if (row + 2 < GRID_SIZE && grid[row + 2][col].value === null) {
          grid[row + 2][col].value = opposite(v1);
          changed = true;
        }
      }
    }
  }

  // Vertical: check X_X pattern
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row < GRID_SIZE - 2; row++) {
      const v1 = grid[row][col].value;
      const v2 = grid[row + 1][col].value;
      const v3 = grid[row + 2][col].value;

      if (v1 !== null && v1 === v3 && v2 === null) {
        grid[row + 1][col].value = opposite(v1);
        changed = true;
      }
    }
  }

  // Rule 3: Apply edge constraints
  for (const constraint of constraints) {
    const [rowA, colA] = constraint.cellA;
    const [rowB, colB] = constraint.cellB;
    const valA = grid[rowA][colA].value;
    const valB = grid[rowB][colB].value;

    if (constraint.type === "equals") {
      // If one is filled and other is empty, copy value
      if (valA !== null && valB === null) {
        grid[rowB][colB].value = valA;
        changed = true;
      } else if (valB !== null && valA === null) {
        grid[rowA][colA].value = valB;
        changed = true;
      }
    } else {
      // not-equals: if one is filled and other is empty, set opposite
      if (valA !== null && valB === null) {
        grid[rowB][colB].value = opposite(valA);
        changed = true;
      } else if (valB !== null && valA === null) {
        grid[rowA][colA].value = opposite(valB);
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Apply deduction rules repeatedly until no more changes
 */
function applyAllDeductions(grid: Grid, constraints: EdgeConstraint[]): void {
  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Safety limit

  while (changed && iterations < maxIterations) {
    changed = applyDeduction(grid, constraints);
    iterations++;
  }
}

/**
 * Check if current grid state is valid (no rule violations)
 */
function isCurrentStateValid(
  grid: Grid,
  constraints: EdgeConstraint[],
): boolean {
  const result = validateGrid(grid, constraints);
  return result.isValid;
}

/**
 * Find the first empty cell in the grid
 * Returns null if all cells are filled
 */
function findEmptyCell(grid: Grid): [number, number] | null {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].value === null) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * Check if grid is completely filled
 */
function isGridComplete(grid: Grid): boolean {
  return findEmptyCell(grid) === null;
}

/**
 * Recursive backtracking solver
 * Returns array of all solutions found (up to maxSolutions)
 */
function solveRecursive(
  grid: Grid,
  constraints: EdgeConstraint[],
  solutions: Symbol[][][],
  maxSolutions: number,
): void {
  // Early termination if we've found enough solutions
  if (solutions.length >= maxSolutions) {
    return;
  }

  // Apply deductive rules first
  applyAllDeductions(grid, constraints);

  // Check if current state is valid
  if (!isCurrentStateValid(grid, constraints)) {
    return; // Invalid state, backtrack
  }

  // Check if puzzle is complete
  if (isGridComplete(grid)) {
    solutions.push(gridToSymbols(grid));
    return;
  }

  // Find an empty cell to try
  const emptyCell = findEmptyCell(grid);
  if (!emptyCell) return;

  const [row, col] = emptyCell;

  // Try placing each symbol
  for (const symbol of ["sun", "moon"] as Symbol[]) {
    const gridCopy = cloneGrid(grid);
    gridCopy[row][col].value = symbol;

    solveRecursive(gridCopy, constraints, solutions, maxSolutions);

    if (solutions.length >= maxSolutions) {
      return;
    }
  }
}

/**
 * Solve the puzzle and return all solutions (up to maxSolutions)
 */
export function solvePuzzle(
  grid: Grid,
  constraints: EdgeConstraint[],
  maxSolutions: number = 2,
): Symbol[][][] {
  const solutions: Symbol[][][] = [];
  const gridCopy = cloneGrid(grid);

  solveRecursive(gridCopy, constraints, solutions, maxSolutions);

  return solutions;
}

/**
 * Check if puzzle has exactly one solution
 */
export function hasUniqueSolution(
  grid: Grid,
  constraints: EdgeConstraint[],
): boolean {
  const solutions = solvePuzzle(grid, constraints, 2);
  return solutions.length === 1;
}

/**
 * Check if puzzle has at least one solution
 */
export function isSolvable(grid: Grid, constraints: EdgeConstraint[]): boolean {
  const solutions = solvePuzzle(grid, constraints, 1);
  return solutions.length >= 1;
}

/**
 * Get the unique solution for a puzzle (if it exists)
 * Returns null if no solution or multiple solutions
 */
export function getUniqueSolution(
  grid: Grid,
  constraints: EdgeConstraint[],
): Symbol[][] | null {
  const solutions = solvePuzzle(grid, constraints, 2);
  if (solutions.length === 1) {
    return solutions[0];
  }
  return null;
}

/**
 * Create an empty grid
 */
export function createEmptyGrid(): Grid {
  const grid: Grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      rowCells.push({
        value: null,
        isGiven: false,
        isLocked: false,
        hasError: false,
      });
    }
    grid.push(rowCells);
  }
  return grid;
}

/**
 * Create a grid from a symbol array
 */
export function createGridFromSymbols(
  symbols: Symbol[][],
  asGivens: boolean = false,
): Grid {
  const grid: Grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = symbols[row]?.[col] ?? null;
      rowCells.push({
        value,
        isGiven: asGivens && value !== null,
        isLocked: false,
        hasError: false,
      });
    }
    grid.push(rowCells);
  }
  return grid;
}
