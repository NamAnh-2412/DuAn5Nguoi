import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  if (compact) {
    return (
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? "Nền sáng" : "Nền tối"}
        title={theme === "dark" ? "Nền sáng" : "Nền tối"}
      >
        {theme === "dark" ? "Sáng" : "Tối"}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={`rounded-lg px-4 py-2 text-sm font-extrabold ${theme === "dark" ? "bg-yellow-400 text-zinc-900" : "border border-zinc-600 text-zinc-100"}`}
        onClick={() => setTheme("dark")}
      >
        Tối
      </button>
      <button
        type="button"
        className={`rounded-lg px-4 py-2 text-sm font-extrabold ${theme === "light" ? "bg-yellow-400 text-zinc-900" : "border border-zinc-600 text-zinc-100"}`}
        onClick={() => setTheme("light")}
      >
        Sáng
      </button>
    </div>
  );
}
