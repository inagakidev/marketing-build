import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Consistent "nothing here yet" card, replacing ad-hoc centered text. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className={cn("space-y-1", !description && "space-y-0")}>
          <p className="font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
