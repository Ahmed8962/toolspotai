import { cn } from "@/lib/utils";

const sizes = {
  leaderboard: "min-h-[90px] w-full",
  rectangle: "h-[280px] w-[336px] max-w-full",
  sidebar: "h-[600px] w-[300px] max-w-full",
};

export default function AdSlot({
  size = "leaderboard",
}: {
  size?: keyof typeof sizes;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted",
        sizes[size],
      )}
    >
      <span className="text-xs text-text-muted">Advertisement</span>
    </div>
  );
}
