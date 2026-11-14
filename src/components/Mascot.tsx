/**
 * The brand mascot (DS v2 frame 04, "Mascote nos estados"). Each expression
 * has one job; never use it in diagnosis results. Decorative: the copy next
 * to it carries the meaning.
 */
const MASCOTS = {
  /** Opening the public briefing, first access. */
  welcome: "/brand/mascot-welcome.svg",
  /** Briefing in progress, empty comments. */
  conversation: "/brand/mascot-conversation.svg",
  /** Empty state, invalid or expired link. */
  missing: "/brand/mascot-missing.svg",
  /** Briefing sent, project closed, account ready. */
  done: "/brand/mascot-done.svg",
} as const;

export type MascotName = keyof typeof MASCOTS;

export function Mascot({ name, className = "h-16" }: { name: MascotName; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static SVG, no optimization to gain
    <img src={MASCOTS[name]} alt="" aria-hidden="true" className={`w-auto dark:invert ${className}`} />
  );
}
