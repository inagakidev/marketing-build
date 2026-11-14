/**
 * Page header and body of the panel, after the DS v2 dashboards (frames
 * D1–D3): a full-width surface band with a 13px context line, a 28px title
 * and the page's actions, then the content capped at 1240px.
 */
export function PageHeader({
  context,
  title,
  meta,
  actions,
}: {
  /** Line above the title: where you are, or a back link. */
  context?: React.ReactNode;
  title: React.ReactNode;
  /** Status pills and counts under the title. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border bg-card px-4 py-5 md:px-8 md:py-6">
      <div className="flex max-w-[1240px] flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {context && <div className="text-[0.8125rem] text-muted-foreground">{context}</div>}
          <h1 className="text-[1.375rem] leading-[1.875rem] font-bold tracking-[-0.02em] break-words md:text-[1.75rem] md:leading-9">
            {title}
          </h1>
          {meta && <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[1240px] flex-col gap-6 px-4 pt-6 pb-12 md:px-8">{children}</div>
  );
}
