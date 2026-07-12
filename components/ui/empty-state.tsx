// components/ui/empty-state.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    props?: any;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center bg-white dark:bg-slate-900/50",
        className
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button
          className="mt-4 cursor-pointer"
          onClick={action.onClick}
          asChild={!!action.href}
          {...(action.props as any)}
        >
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  );
}
