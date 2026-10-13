"use client";
import { useEffect, useState } from "react";
import { ToggleGroup } from "radix-ui";
import { Moon, Sun } from "lucide-react";

type Theme = "galvanized" | "night";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("galvanized");
  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) ?? "galvanized");
  }, []);

  const apply = (next: string) => {
    if (next !== "galvanized" && next !== "night") return; // ignore deselect
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("sk-theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <ToggleGroup.Root type="single" value={theme} onValueChange={apply} aria-label="Theme" className="seg">
      <ToggleGroup.Item value="galvanized" aria-label="Galvanized theme" className="seg-item">
        <Sun size={16} />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="night" aria-label="Night crib theme" className="seg-item">
        <Moon size={16} />
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
