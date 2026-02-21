import { Circle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isRunning = status === "running";
  const isError = status === "error";

  let colorClass = "text-muted-foreground bg-muted border-border";
  let dotClass = "fill-muted-foreground";

  if (isRunning) {
    colorClass = "text-foreground bg-muted border-border";
    dotClass = "fill-foreground animate-pulse";
  } else if (isError) {
    colorClass = "text-foreground bg-muted border-border";
    dotClass = "fill-foreground";
  }

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1 rounded-full border
      text-sm font-mono font-medium uppercase tracking-wider
      ${colorClass}
    `}>
      <Circle className={`w-2 h-2 ${dotClass}`} />
      {status}
    </div>
  );
}
