// ============================================
// Tango Puzzle Generator
// Implements generate-then-minimize approach
// ============================================

import {
  Symbol,
  Grid,
  Cell,
  EdgeConstraint,
  Puzzle,
  Difficulty,
  GRID_SIZE,
  SYMBOLS_PER_ROW,
  DIFFICULTY_CONFIG,
} from "./types";
import { validateGrid } from "./validator";
import { hasUniqueSolution, createEmptyGrid, gridToSymbols } from "./solver";

/**
 * Generate a random ID for puzzles
 */
function generateId(): string {
  return `tango-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shuffle an array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if placing a symbol at position is valid for solution generation
 */
function isValidPlacement(
  solution: Symbol[][],
  row: number,
  col: number,
  symbol: Symbol,
): boolean {
  if (symbol === null) return true;

  // Check row balance
  let rowCount = 0;
  for (let c = 0; c < col; c++) {
    if (solution[row][c] === symbol) rowCount++;
  }
  if (rowCount >= SYMBOLS_PER_ROW) return false;

  // Check column balance
  let colCount = 0;
  for (let r = 0; r < row; r++) {
    if (solution[r][col] === symbol) colCount++;
  }
  if (colCount >= SYMBOLS_PER_ROW) return false;

  // Check horizontal triple (look back 2 cells)
  if (col >= 2) {
    if (
      solution[row][col - 1] === symbol &&
      solution[row][col - 2] === symbol
    ) {
      return false;
    }
  }

  // Check vertical triple (look up 2 cells)
  if (row >= 2) {
    if (
      solution[row - 1][col] === symbol &&
      solution[row - 2][col] === symbol
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a complete valid solution using backtracking
 */
function generateSolutionRecursive(
  solution: Symbol[][],
  row: number,
  col: number,
): boolean {
  // If we've filled all rows, we're done
  if (row >= GRID_SIZE) {
    return true;
  }

  // Calculate next position
  const nextCol = (col + 1) % GRID_SIZE;
  const nextRow = nextCol === 0 ? row + 1 : row;

  // Try both symbols in random order
  const symbols = shuffle(["sun", "moon"] as Symbol[]);

  for (const symbol of symbols) {
    if (isValidPlacement(solution, row, col, symbol)) {
      solution[row][col] = symbol;

      if (generateSolutionRecursive(solution, nextRow, nextCol)) {
        return true;
      }

      // Backtrack
      solution[row][col] = null;
    }
  }

  return false;
}

/**
 * Generate a complete valid solution
 */
export function generateSolution(): Symbol[][] {
  // Initialize empty solution
  const solution: Symbol[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    solution.push(new Array(GRID_SIZE).fill(null));
  }

  // Generate using backtracking
  const success = generateSolutionRecursive(solution, 0, 0);

  if (!success) {
    throw new Error("Failed to generate solution");
  }

  return solution;
}

/**
 * Generate edge constraints based on the solution
 */
function generateConstraints(
  solution: Symbol[][],
  count: number,
): EdgeConstraint[] {
  const constraints: EdgeConstraint[] = [];
  const possibleConstraints: EdgeConstraint[] = [];

  // Collect all possible horizontal constraints
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      const cellA = solution[row][col];
      const cellB = solution[row][col + 1];

      possibleConstraints.push({
        type: cellA === cellB ? "equals" : "not-equals",
        cellA: [row, col],
        cellB: [row, col + 1],
        orientation: "horizontal",
      });
    }
  }

  // Collect all possible vertical constraints
  for (let row = 0; row < GRID_SIZE - 1; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cellA = solution[row][col];
      const cellB = solution[row + 1][col];

      possibleConstraints.push({
        type: cellA === cellB ? "equals" : "not-equals",
        cellA: [row, col],
        cellB: [row + 1, col],
        orientation: "vertical",
      });
    }
  }

  // Shuffle and pick the requested count
  const shuffled = shuffle(possibleConstraints);

  // Try to balance equals and not-equals constraints
  const equalsConstraints = shuffled.filter((c) => c.type === "equals");
  const notEqualsConstraints = shuffled.filter((c) => c.type === "not-equals");

  // Interleave them for variety
  let eIdx = 0,
    nIdx = 0;
  while (
    constraints.length < count &&
    (eIdx < equalsConstraints.length || nIdx < notEqualsConstraints.length)
  ) {
    if (
      eIdx < equalsConstraints.length &&
      (constraints.length % 2 === 0 || nIdx >= notEqualsConstraints.length)
    ) {
      constraints.push(equalsConstraints[eIdx++]);
    } else if (nIdx < notEqualsConstraints.length) {
      constraints.push(notEqualsConstraints[nIdx++]);
    }
  }

  return constraints;
}

/**
 * Convert solution to a grid with all cells as givens
 */
function solutionToGrid(solution: Symbol[][]): Grid {
  const grid: Grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      rowCells.push({
        value: solution[row][col],
        isGiven: true,
        isLocked: false,
        hasError: false,
      });
    }
    grid.push(rowCells);
  }
  return grid;
}

/**
 * Count the number of given cells in a grid
 */
function countGivens(grid: Grid): number {
  let count = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].isGiven && grid[row][col].value !== null) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Deep clone a grid
 */
function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Minimize the puzzle by removing cells while maintaining unique solution
 * Uses iterative cell removal with uniqueness checking
 */
function minimizePuzzle(
  grid: Grid,
  solution: Symbol[][],
  constraints: EdgeConstraint[],
  targetGivens: { min: number; max: number },
): Grid {
  // Get all cell positions in random order
  const positions: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      positions.push([row, col]);
    }
  }

  // Shuffle positions (prefer removing from center first for harder puzzles)
  const shuffledPositions = shuffle(positions);

  let currentGrid = cloneGrid(grid);

  for (const [row, col] of shuffledPositions) {
    // Skip if already at minimum givens
    const currentGivens = countGivens(currentGrid);
    if (currentGivens <= targetGivens.min) {
      break;
    }

    // Try removing this cell
    const testGrid = cloneGrid(currentGrid);
    testGrid[row][col].value = null;
    testGrid[row][col].isGiven = false;

    // Check if puzzle still has unique solution
    if (hasUniqueSolution(testGrid, constraints)) {
      currentGrid = testGrid;
    }

    // Stop if we've reached target range
    if (countGivens(currentGrid) <= targetGivens.max) {
      // Continue removing to get to target, but don't go below min
      if (countGivens(currentGrid) <= targetGivens.min) {
        break;
      }
    }
  }

  return currentGrid;
}

/**
 * Generate a complete Tango puzzle
 */
export function generatePuzzle(difficulty: Difficulty = "medium"): Puzzle {
  const config = DIFFICULTY_CONFIG[difficulty];

  // Phase 1: Generate complete solution
  const solution = generateSolution();

  // Phase 2: Generate edge constraints
  const constraintCount = randomInt(
    config.minConstraints,
    config.maxConstraints,
  );
  const constraints = generateConstraints(solution, constraintCount);

  // Phase 3: Create full grid and minimize
  const fullGrid = solutionToGrid(solution);
  const puzzleGrid = minimizePuzzle(fullGrid, solution, constraints, {
    min: config.minGivens,
    max: config.maxGivens,
  });

  // Validate the generated puzzle
  const validation = validateGrid(puzzleGrid, constraints);
  if (!validation.isValid) {
    // This shouldn't happen, but retry if it does
    console.warn("Generated invalid puzzle, retrying...");
    return generatePuzzle(difficulty);
  }

  return {
    id: generateId(),
    grid: puzzleGrid,
    solution,
    constraints,
    difficulty,
    createdAt: new Date(),
  };
}

/**
 * Create an empty game grid (for starting a new game)
 */
export function createGameGrid(puzzle: Puzzle): Grid {
  return puzzle.grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      hasError: false,
    })),
  );
}

/**
 * Check if the current grid matches the solution
 */
export function checkSolution(grid: Grid, solution: Symbol[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].value !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
}
