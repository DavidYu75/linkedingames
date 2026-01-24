// ============================================
// Tango Puzzle Validator
// Implements rule checking for the Tango game
// ============================================

import {
  Symbol,
  Grid,
  EdgeConstraint,
  ValidationError,
  ValidationResult,
  GRID_SIZE,
  SYMBOLS_PER_ROW,
} from "./types";

/**
 * Check if three consecutive cells have the same non-null symbol
 */
function isTriple(
  grid: Grid,
  startRow: number,
  startCol: number,
  direction: "horizontal" | "vertical",
): boolean {
  const cells: Symbol[] = [];

  for (let i = 0; i < 3; i++) {
    const row = direction === "vertical" ? startRow + i : startRow;
    const col = direction === "horizontal" ? startCol + i : startCol;
    cells.push(grid[row][col].value);
  }

  // All three must be non-null and the same
  if (cells[0] === null) return false;
  return cells[0] === cells[1] && cells[1] === cells[2];
}

/**
 * Find all horizontal triple violations
 */
function findHorizontalTriples(grid: Grid): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col <= GRID_SIZE - 3; col++) {
      if (isTriple(grid, row, col, "horizontal")) {
        errors.push({
          type: "triple",
          cells: [
            [row, col],
            [row, col + 1],
            [row, col + 2],
          ],
          message: `Three consecutive ${grid[row][col].value}s in row ${row + 1}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Find all vertical triple violations
 */
function findVerticalTriples(grid: Grid): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row <= GRID_SIZE - 3; row++) {
      if (isTriple(grid, row, col, "vertical")) {
        errors.push({
          type: "triple",
          cells: [
            [row, col],
            [row + 1, col],
            [row + 2, col],
          ],
          message: `Three consecutive ${grid[row][col].value}s in column ${col + 1}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Count symbols in an array of cells
 */
function countSymbols(cells: { value: Symbol }[]): {
  sun: number;
  moon: number;
} {
  let sun = 0;
  let moon = 0;

  for (const cell of cells) {
    if (cell.value === "sun") sun++;
    else if (cell.value === "moon") moon++;
  }

  return { sun, moon };
}

/**
 * Get all cells in a row
 */
function getRowCells(row: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let col = 0; col < GRID_SIZE; col++) {
    cells.push([row, col]);
  }
  return cells;
}

/**
 * Get all cells in a column
 */
function getColCells(col: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    cells.push([row, col]);
  }
  return cells;
}

/**
 * Find all row balance violations (more than 3 of one symbol)
 */
function findRowBalanceErrors(grid: Grid): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    const counts = countSymbols(grid[row]);

    if (counts.sun > SYMBOLS_PER_ROW) {
      errors.push({
        type: "balance",
        cells: getRowCells(row),
        message: `Row ${row + 1} has too many suns (${counts.sun} > ${SYMBOLS_PER_ROW})`,
      });
    }

    if (counts.moon > SYMBOLS_PER_ROW) {
      errors.push({
        type: "balance",
        cells: getRowCells(row),
        message: `Row ${row + 1} has too many moons (${counts.moon} > ${SYMBOLS_PER_ROW})`,
      });
    }
  }

  return errors;
}

/**
 * Find all column balance violations (more than 3 of one symbol)
 */
function findColumnBalanceErrors(grid: Grid): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let col = 0; col < GRID_SIZE; col++) {
    const column = grid.map((row) => row[col]);
    const counts = countSymbols(column);

    if (counts.sun > SYMBOLS_PER_ROW) {
      errors.push({
        type: "balance",
        cells: getColCells(col),
        message: `Column ${col + 1} has too many suns (${counts.sun} > ${SYMBOLS_PER_ROW})`,
      });
    }

    if (counts.moon > SYMBOLS_PER_ROW) {
      errors.push({
        type: "balance",
        cells: getColCells(col),
        message: `Column ${col + 1} has too many moons (${counts.moon} > ${SYMBOLS_PER_ROW})`,
      });
    }
  }

  return errors;
}

/**
 * Check if an edge constraint is satisfied
 */
function isConstraintSatisfied(
  grid: Grid,
  constraint: EdgeConstraint,
): boolean {
  const [rowA, colA] = constraint.cellA;
  const [rowB, colB] = constraint.cellB;

  const valueA = grid[rowA][colA].value;
  const valueB = grid[rowB][colB].value;

  // If either cell is empty, constraint is not violated (yet)
  if (valueA === null || valueB === null) {
    return true;
  }

  if (constraint.type === "equals") {
    return valueA === valueB;
  } else {
    // not-equals
    return valueA !== valueB;
  }
}

/**
 * Find all edge constraint violations
 */
function findConstraintErrors(
  grid: Grid,
  constraints: EdgeConstraint[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const constraint of constraints) {
    if (!isConstraintSatisfied(grid, constraint)) {
      const typeSymbol = constraint.type === "equals" ? "=" : "×";
      errors.push({
        type: "constraint",
        cells: [constraint.cellA, constraint.cellB],
        message: `Constraint ${typeSymbol} violated between cells`,
      });
    }
  }

  return errors;
}

/**
 * Check if the grid is completely filled
 */
function isGridComplete(grid: Grid): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].value === null) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if the grid is a valid complete solution
 * (all cells filled, all constraints satisfied, balanced rows/columns)
 */
export function isValidSolution(
  grid: Grid,
  constraints: EdgeConstraint[] = [],
): boolean {
  if (!isGridComplete(grid)) {
    return false;
  }

  const result = validateGrid(grid, constraints);
  return result.isValid;
}

/**
 * Main validation function
 * Checks all rules and returns detailed validation result
 */
export function validateGrid(
  grid: Grid,
  constraints: EdgeConstraint[] = [],
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for triple violations
  errors.push(...findHorizontalTriples(grid));
  errors.push(...findVerticalTriples(grid));

  // Check row/column balance
  errors.push(...findRowBalanceErrors(grid));
  errors.push(...findColumnBalanceErrors(grid));

  // Check edge constraints
  errors.push(...findConstraintErrors(grid, constraints));

  const isComplete = isGridComplete(grid);

  return {
    isValid: errors.length === 0,
    isComplete,
    errors,
  };
}

/**
 * Get cells that are currently in error state
 * Returns a Set of "row,col" strings for easy lookup
 */
export function getErrorCells(
  grid: Grid,
  constraints: EdgeConstraint[] = [],
): Set<string> {
  const result = validateGrid(grid, constraints);
  const errorCells = new Set<string>();

  for (const error of result.errors) {
    for (const [row, col] of error.cells) {
      errorCells.add(`${row},${col}`);
    }
  }

  return errorCells;
}

/**
 * Update the hasError flag on all cells in the grid
 * Returns a new grid with updated error states
 */
export function updateErrorStates(
  grid: Grid,
  constraints: EdgeConstraint[] = [],
): Grid {
  const errorCells = getErrorCells(grid, constraints);

  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => ({
      ...cell,
      hasError: errorCells.has(`${rowIndex},${colIndex}`),
    })),
  );
}

/**
 * Check if placing a symbol at a position would immediately violate rules
 * Useful for real-time feedback while playing
 */
export function wouldViolateRules(
  grid: Grid,
  row: number,
  col: number,
  value: Symbol,
  constraints: EdgeConstraint[] = [],
): boolean {
  if (value === null) return false;

  // Create a temporary grid with the new value
  const tempGrid = grid.map((r, rowIdx) =>
    r.map((cell, colIdx) => ({
      ...cell,
      value: rowIdx === row && colIdx === col ? value : cell.value,
    })),
  );

  const result = validateGrid(tempGrid, constraints);

  // Check if any of the new errors involve the placed cell
  for (const error of result.errors) {
    for (const [errRow, errCol] of error.cells) {
      if (errRow === row && errCol === col) {
        return true;
      }
    }
  }

  return false;
}
