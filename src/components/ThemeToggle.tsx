"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const CYCLE = ["light", "dark", "system"] as const;
type ThemeChoice = (typeof CYCLE)[number];

const ICON: Record<ThemeChoice, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: SunMoon,
};

const LABEL: Record<ThemeChoice, string> = {
  light: "Tema claro",
  dark: "Tema escuro",
  system: "Tema do sistema",
};

const noopSubscribe = () => () => {};

/**
 * Cycles light → dark → system. Reads `mounted` before trusting `theme`:
 * next-themes only knows the resolved value after hydration, so rendering it
 * earlier would mismatch the server markup. `useSyncExternalStore` returns the
 * server snapshot during hydration and the client one afterwards, without the
 * extra render a setState-in-effect would cause.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const current: ThemeChoice =
    mounted && CYCLE.includes(theme as ThemeChoice) ? (theme as ThemeChoice) : "system";
  const Icon = ICON[current];

  function cycle() {
    setTheme(CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={cycle}
      aria-label={`${LABEL[current]} — alternar tema`}
      title={LABEL[current]}
    >
      <Icon className="size-4" />
    </Button>
  );
}
