"use client";

import { useState, useEffect } from "react";
import { generateLevel } from "@/lib/queens/generator";
import { Level } from "@/lib/queens/types";
import Link from "next/link";

export default function QueensPage() {
  const [level, setLevel] = useState<Level | null>(null);

  useEffect(() => {
    setLevel(generateLevel(8));
  }, []);

  if (!level) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <Link href="/" className="text-sm hover:underline">
          ← Back to Hub
        </Link>
        <h1 className="text-3xl font-bold">Queens</h1>
        <div className="w-20" /> {/* Spacer */}
      </div>

      <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-lg">
        <div 
          className="grid gap-0 border-2 border-black dark:border-white"
          style={{ 
            gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` 
          }}
        >
          {level.grid.map((row, rIndex) =>
            row.map((cell, cIndex) => (
              <div
                key={`${rIndex}-${cIndex}`}
                className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 flex items-center justify-center text-xl cursor-pointer hover:bg-black/5"
                style={{
                  backgroundColor: getColor(cell.color),
                }}
              >
                {/* Cell Content */}
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => setLevel(generateLevel(8))}
        className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
      >
        New Game
      </button>
    </div>
  );
}

// Helper to generate consistent colors for regions
// In a real app, we'd have a predefined palette
function getColor(id: number): string {
  const hue = (id * 137.508) % 360; // Golden angle approximation for distinct colors
  return `hsl(${hue}, 70%, 90%)`;
}
