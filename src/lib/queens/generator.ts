import { Grid, Level } from "./types";

/**
 * Generates a valid Queens puzzle with color regions
 */
export function generateLevel(size: number = 8): Level {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    // Generate color regions
    const colorGrid = generateColorRegions(size);

    // Try to find a valid solution
    const solution = findValidSolution(colorGrid, size);

    if (solution) {
      // We found a valid puzzle, create the grid
      const grid: Grid = Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => ({
          row,
          col,
          color: colorGrid[row][col],
          state: "EMPTY",
        }))
      );

      return {
        size,
        grid,
      };
    }
  }

  // Fallback: return a simple column-based region layout
  // This is guaranteed to be solvable
  return generateFallbackLevel(size);
}

/**
 * Generates color regions using a growing algorithm
 * Each region should have exactly 'size' cells
 */
function generateColorRegions(size: number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(-1)
  );

  const regionSizes = Array(size).fill(0);
  const targetSize = size;

  // Start with random seed points for each region
  const seeds: Array<{ row: number; col: number }> = [];
  const available = new Set<string>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      available.add(`${r},${c}`);
    }
  }

  // Place initial seeds
  for (let color = 0; color < size; color++) {
    const availableArray = Array.from(available);
    if (availableArray.length === 0) break;

    const randomIndex = Math.floor(Math.random() * availableArray.length);
    const [row, col] = availableArray[randomIndex].split(",").map(Number);

    grid[row][col] = color;
    regionSizes[color]++;
    available.delete(`${row},${col}`);
    seeds.push({ row, col });
  }

  // Grow regions using a queue-based approach
  const queue: Array<{ row: number; col: number; color: number }> = seeds.map(
    (seed, color) => ({ ...seed, color })
  );

  while (queue.length > 0) {
    const { row, col, color } = queue.shift()!;

    // If this region is full, skip
    if (regionSizes[color] >= targetSize) continue;

    // Try to expand to neighbors
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    // Shuffle neighbors for randomness
    neighbors.sort(() => Math.random() - 0.5);

    for (const [nr, nc] of neighbors) {
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        grid[nr][nc] === -1 &&
        regionSizes[color] < targetSize
      ) {
        grid[nr][nc] = color;
        regionSizes[color]++;
        available.delete(`${nr},${nc}`);
        queue.push({ row: nr, col: nc, color });
      }
    }
  }

  // Fill any remaining cells (shouldn't happen with proper algorithm)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === -1) {
        // Assign to neighbor's color or smallest region
        const neighborColors = [
          r > 0 ? grid[r - 1][c] : -1,
          r < size - 1 ? grid[r + 1][c] : -1,
          c > 0 ? grid[r][c - 1] : -1,
          c < size - 1 ? grid[r][c + 1] : -1,
        ].filter((c) => c !== -1);

        if (neighborColors.length > 0) {
          grid[r][c] = neighborColors[0];
        } else {
          // Find smallest region
          const minColor = regionSizes.indexOf(Math.min(...regionSizes));
          grid[r][c] = minColor;
        }
      }
    }
  }

  return grid;
}

/**
 * Finds a valid queen placement using backtracking
 * Returns the solution grid or null if unsolvable
 */
function findValidSolution(
  colorGrid: number[][],
  size: number
): number[][] | null {
  const solution: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  if (solveQueens(solution, colorGrid, 0, size)) {
    return solution;
  }

  return null;
}

/**
 * Backtracking algorithm to place queens
 * Places one queen per row
 */
function solveQueens(
  solution: number[][],
  colorGrid: number[][],
  row: number,
  size: number
): boolean {
  if (row === size) {
    // All queens placed successfully
    return true;
  }

  // Try placing queen in each column of this row
  for (let col = 0; col < size; col++) {
    if (isValidPlacement(solution, colorGrid, row, col, size)) {
      solution[row][col] = 1;

      if (solveQueens(solution, colorGrid, row + 1, size)) {
        return true;
      }

      solution[row][col] = 0; // Backtrack
    }
  }

  return false;
}

/**
 * Checks if placing a queen at (row, col) is valid
 */
function isValidPlacement(
  solution: number[][],
  colorGrid: number[][],
  row: number,
  col: number,
  size: number
): boolean {
  // Check column
  for (let r = 0; r < row; r++) {
    if (solution[r][col] === 1) return false;
  }

  // Check touching diagonally (only need to check previous row)
  // LinkedIn Queens rule: Queens cannot touch, not even diagonally
  if (row > 0) {
    // Top-left
    if (col > 0 && solution[row - 1][col - 1] === 1) return false;
    // Top-right
    if (col < size - 1 && solution[row - 1][col + 1] === 1) return false;
  }

  // Check color region
  const currentColor = colorGrid[row][col];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (
        colorGrid[r][c] === currentColor &&
        solution[r][c] === 1 &&
        !(r === row && c === col)
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Fallback level generator with simple column-based regions
 * Guaranteed to be solvable
 */
function generateFallbackLevel(size: number): Level {
  const grid: Grid = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      color: col, // Each column is a different color region
      state: "EMPTY",
    }))
  );

  return {
    size,
    grid,
  };
}
