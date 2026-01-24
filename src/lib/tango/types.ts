// ============================================
// Core Types for LinkedIn Tango Puzzle Game
// ============================================

/**
 * Symbol representing the value in a cell
 * - 'sun': ☀️ symbol
 * - 'moon': 🌙 symbol
 * - null: empty cell
 */
export type Symbol = "sun" | "moon" | null;

/**
 * Represents a single cell in the 6x6 grid
 */
export interface Cell {
  value: Symbol;
  isGiven: boolean; // Pre-filled by puzzle (cannot be changed)
  isLocked: boolean; // Locked by user (prevent accidental changes)
  hasError: boolean; // Currently violating rules
}

/**
 * The game grid - 6x6 array of cells
 */
export type Grid = Cell[][];

/**
 * Type of edge constraint between two adjacent cells
 * - 'equals': Both cells must have the same symbol (=)
 * - 'not-equals': Cells must have opposite symbols (×)
 */
export type ConstraintType = "equals" | "not-equals";

/**
 * Represents a constraint between two adjacent cells
 */
export interface EdgeConstraint {
  type: ConstraintType;
  cellA: [row: number, col: number];
  cellB: [row: number, col: number];
  orientation: "horizontal" | "vertical";
}

/**
 * Difficulty levels for puzzle generation
 */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * Complete puzzle definition
 */
export interface Puzzle {
  id: string;
  grid: Grid;
  solution: Symbol[][]; // For validation
  constraints: EdgeConstraint[];
  difficulty: Difficulty;
  createdAt: Date;
}

/**
 * Represents a single move made by the player
 */
export interface Move {
  row: number;
  col: number;
  previousValue: Symbol;
  newValue: Symbol;
  timestamp: number;
}

/**
 * Current state of the game
 */
export interface GameState {
  puzzle: Puzzle;
  currentGrid: Grid;
  timer: number; // Seconds elapsed
  isComplete: boolean;
  isPaused: boolean;
  moveHistory: Move[]; // For undo/redo
}

/**
 * Statistics for a specific difficulty level
 */
export interface DifficultyStats {
  played: number;
  won: number;
  avgTime: number;
  bestTime: number;
}

/**
 * Overall game statistics
 */
export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  averageTime: number;
  bestTime: number;
  currentStreak: number;
  longestStreak: number;
  byDifficulty: {
    easy: DifficultyStats;
    medium: DifficultyStats;
    hard: DifficultyStats;
  };
}

/**
 * Result of validation check
 */
export interface ValidationError {
  type: "triple" | "balance" | "constraint";
  cells: [number, number][]; // Array of [row, col] pairs
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean; // All cells filled
  errors: ValidationError[];
}

/**
 * Game settings stored in local storage
 */
export interface GameSettings {
  difficulty: Difficulty;
  soundEnabled: boolean;
  showTimer: boolean;
  showErrors: boolean;
  darkMode: boolean;
}

/**
 * Data stored in local storage
 */
export interface StoredData {
  version: string;
  currentGame: GameState | null;
  stats: Stats;
  settings: GameSettings;
  history: {
    puzzleId: string;
    completed: boolean;
    time: number;
    date: string; // ISO date string
  }[];
}

// ============================================
// Constants
// ============================================

export const GRID_SIZE = 6;
export const SYMBOLS_PER_ROW = 3; // Each row/column must have exactly 3 of each symbol
export const STORAGE_KEY = "tango-unlimited-v1";

/**
 * Difficulty configuration
 */
export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    minGivens: number;
    maxGivens: number;
    minConstraints: number;
    maxConstraints: number;
  }
> = {
  easy: {
    minGivens: 16,
    maxGivens: 18,
    minConstraints: 6,
    maxConstraints: 8,
  },
  medium: {
    minGivens: 12,
    maxGivens: 14,
    minConstraints: 4,
    maxConstraints: 6,
  },
  hard: {
    minGivens: 10,
    maxGivens: 12,
    minConstraints: 2,
    maxConstraints: 4,
  },
};
