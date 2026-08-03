"use client";

import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className={`
        fixed top-4 right-4 z-50
        w-10 h-10 rounded-full
        flex items-center justify-center
        shadow-lg
        transition-all duration-300
        ${
          theme === "dark"
            ? "bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600"
            : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
        }
      `}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
