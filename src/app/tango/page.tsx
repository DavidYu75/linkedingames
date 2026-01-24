"use client";

import { useState, useEffect, useCallback } from "react";
import {
  generatePuzzle,
  createGameGrid,
  checkSolution,
} from "@/lib/tango/generator";
import { validateGrid, updateErrorStates } from "@/lib/tango/validator";
import {
  Puzzle,
  Grid,
  Symbol,
  Difficulty,
  EdgeConstraint,
  GRID_SIZE,
} from "@/lib/tango/types";
import Link from "next/link";

// Sun Icon Component - Orange circle
function SunIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="#F5A623"
        stroke="#E8941C"
        strokeWidth="3"
      />
    </svg>
  );
}

// Moon Icon Component - Blue crescent (properly centered)
function MoonIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <mask id="crescentMask">
          <rect width="100" height="100" fill="white" />
          <circle cx="62" cy="50" r="32" fill="black" />
        </mask>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="#5B8DEF"
        stroke="#4A7CD9"
        strokeWidth="3"
        mask="url(#crescentMask)"
      />
    </svg>
  );
}

export default function TangoPage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showErrors, setShowErrors] = useState(true);
  const [moveHistory, setMoveHistory] = useState<Grid[]>([]);

  // Generate new puzzle
  const newGame = useCallback(
    (diff: Difficulty = difficulty) => {
      const newPuzzle = generatePuzzle(diff);
      setPuzzle(newPuzzle);
      setGrid(createGameGrid(newPuzzle));
      setTimer(0);
      setIsRunning(true);
      setIsComplete(false);
      setMoveHistory([]);
    },
    [difficulty],
  );

  // Initial load
  useEffect(() => {
    newGame();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isComplete]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle cell click - cycle through symbols
  const handleCellClick = (row: number, col: number) => {
    if (!grid || !puzzle || isComplete) return;

    const cell = grid[row][col];
    if (cell.isGiven) return;

    const cycleOrder: Symbol[] = [null, "sun", "moon"];
    const currentIndex = cycleOrder.indexOf(cell.value);
    const nextValue = cycleOrder[(currentIndex + 1) % 3];

    const newGrid = grid.map((r, rIdx) =>
      r.map((c, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return { ...c, value: nextValue };
        }
        return c;
      }),
    );

    const updatedGrid = showErrors
      ? updateErrorStates(newGrid, puzzle.constraints)
      : newGrid;

    // Save current grid to history before updating
    setMoveHistory((prev) => [...prev, grid]);
    setGrid(updatedGrid);

    const validation = validateGrid(updatedGrid, puzzle.constraints);
    if (validation.isComplete && validation.isValid) {
      if (checkSolution(updatedGrid, puzzle.solution)) {
        setIsComplete(true);
        setIsRunning(false);
      }
    }
  };

  // Get horizontal constraint (between col and col+1)
  const getHorizontalConstraint = (
    row: number,
    col: number,
    constraints: EdgeConstraint[],
  ): EdgeConstraint | null => {
    return (
      constraints.find(
        (c) =>
          c.orientation === "horizontal" &&
          ((c.cellA[0] === row &&
            c.cellA[1] === col &&
            c.cellB[0] === row &&
            c.cellB[1] === col + 1) ||
            (c.cellB[0] === row &&
              c.cellB[1] === col &&
              c.cellA[0] === row &&
              c.cellA[1] === col + 1)),
      ) || null
    );
  };

  // Get vertical constraint (between row and row+1)
  const getVerticalConstraint = (
    row: number,
    col: number,
    constraints: EdgeConstraint[],
  ): EdgeConstraint | null => {
    return (
      constraints.find(
        (c) =>
          c.orientation === "vertical" &&
          ((c.cellA[0] === row &&
            c.cellA[1] === col &&
            c.cellB[0] === row + 1 &&
            c.cellB[1] === col) ||
            (c.cellB[0] === row &&
              c.cellB[1] === col &&
              c.cellA[0] === row + 1 &&
              c.cellA[1] === col)),
      ) || null
    );
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    newGame(newDifficulty);
  };

  if (!puzzle || !grid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Cell size in pixels
  const cellSize = 80;
  const gridSize = cellSize * GRID_SIZE;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Tango
        </h1>
        <div className="text-lg font-mono text-gray-600 dark:text-gray-400">
          {formatTime(timer)}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div className="flex gap-2 mb-6">
        {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => handleDifficultyChange(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              difficulty === d
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Victory Banner */}
      {isComplete && (
        <div className="mb-6 px-8 py-4 bg-green-100 border-2 border-green-400 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-700">
            🎉 Puzzle Complete!
          </div>
          <div className="text-green-600">Time: {formatTime(timer)}</div>
        </div>
      )}

      {/* Game Grid Container */}
      <div
        className="relative border-2 border-gray-400 rounded-lg overflow-hidden bg-white"
        style={{ width: gridSize, height: gridSize }}
      >
        {/* Grid of cells */}
        {grid.map((row, rIndex) =>
          row.map((cell, cIndex) => {
            const hConstraint =
              cIndex < GRID_SIZE - 1
                ? getHorizontalConstraint(rIndex, cIndex, puzzle.constraints)
                : null;
            const vConstraint =
              rIndex < GRID_SIZE - 1
                ? getVerticalConstraint(rIndex, cIndex, puzzle.constraints)
                : null;

            return (
              <div
                key={`${rIndex}-${cIndex}`}
                className="absolute"
                style={{
                  left: cIndex * cellSize,
                  top: rIndex * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
              >
                {/* Cell button */}
                <button
                  onClick={() => handleCellClick(rIndex, cIndex)}
                  disabled={cell.isGiven}
                  style={{ width: cellSize, height: cellSize }}
                  className={`
                    border-r border-b border-gray-300
                    flex items-center justify-center
                    transition-colors
                    p-3
                    ${
                      cell.isGiven
                        ? "bg-stone-100 cursor-default"
                        : "bg-white cursor-pointer hover:bg-blue-50 active:bg-blue-100"
                    }
                    ${cell.hasError && showErrors ? "bg-red-100" : ""}
                  `}
                >
                  {cell.value === "sun" && <SunIcon />}
                  {cell.value === "moon" && <MoonIcon />}
                </button>

                {/* Horizontal constraint marker */}
                {hConstraint && (
                  <div
                    className="absolute z-20 flex items-center justify-center pointer-events-none"
                    style={{
                      right: 0,
                      top: "50%",
                      transform: "translate(50%, -50%)",
                    }}
                  >
                    <span
                      className="font-bold bg-white rounded shadow-sm px-1"
                      style={{ fontSize: 28, color: "#1f2937" }}
                    >
                      {hConstraint.type === "equals" ? "=" : "×"}
                    </span>
                  </div>
                )}

                {/* Vertical constraint marker */}
                {vConstraint && (
                  <div
                    className="absolute z-20 flex items-center justify-center pointer-events-none"
                    style={{
                      bottom: -16,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <span
                      className="font-bold bg-white rounded shadow-sm px-1"
                      style={{
                        fontSize: 28,
                        color: "#1f2937",
                        transform:
                          vConstraint.type === "equals"
                            ? "rotate(90deg)"
                            : "none",
                      }}
                    >
                      {vConstraint.type === "equals" ? "=" : "×"}
                    </span>
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => newGame()}
          className="px-8 py-3 bg-blue-500 text-white text-lg font-medium rounded-lg 
            hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          New Puzzle
        </button>

        <button
          onClick={() => {
            if (moveHistory.length > 0 && puzzle) {
              const previousGrid = moveHistory[moveHistory.length - 1];
              const restoredGrid = showErrors
                ? updateErrorStates(previousGrid, puzzle.constraints)
                : previousGrid;
              setGrid(restoredGrid);
              setMoveHistory((prev) => prev.slice(0, -1));
            }
          }}
          disabled={moveHistory.length === 0}
          className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
            moveHistory.length > 0
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Undo
        </button>

        <button
          onClick={() => setShowErrors(!showErrors)}
          className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
            showErrors
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {showErrors ? "Errors: On" : "Errors: Off"}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-gray-500">
        <p className="mb-2 text-lg">Fill the grid with suns and moons</p>
        <div className="flex justify-center gap-8 text-sm">
          <span>• 3 of each per row/column</span>
          <span>• No 3 in a row</span>
        </div>
        <div className="flex justify-center gap-6 mt-2 text-sm">
          <span>
            <strong>=</strong> cells must match
          </span>
          <span>
            <strong>×</strong> cells must differ
          </span>
        </div>
      </div>
    </div>
  );
}
