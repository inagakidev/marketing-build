/**
 * Initials avatar (DS v2 "Navegação e pessoas"). The tint comes from the name
 * so each person keeps the same color, and it's decorative: the name is
 * always written next to it.
 */
const TINTS = [
  "bg-(--brand-200) text-(--brand-800)",
  "bg-(--info-border) text-(--info-text)",
  "bg-(--success-border) text-(--success-text)",
  "bg-(--neutral-200) text-(--neutral-800)",
];

export function MemberAvatar({ name, muted = false }: { name: string; muted?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const tint = muted
    ? "bg-muted text-muted-foreground"
    : TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];

  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tint}`}
    >
      {initials || "?"}
    </span>
  );
}
