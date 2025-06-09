"use client";

interface DividerProps {
  darkMode: boolean;
}

export function Divider({ darkMode }: DividerProps) {
  const color = darkMode ? "#DDDDDD" : "#2E2E30";

  return (
    <span
      className="flex items-center text-xl font-bold"
      style={{ color }}
    >
      |
    </span>
  );
}
