import type { Tool } from "@/data/tools";
import { cn } from "@/lib/utils";

const styles: Record<Tool["category"], string> = {
  finance: "bg-blue-50 text-blue-800 ring-blue-100",
  writing: "bg-violet-50 text-violet-800 ring-violet-100",
  daily: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  developer: "bg-sky-50 text-sky-900 ring-sky-100",
  education: "bg-amber-50 text-amber-800 ring-amber-100",
  health: "bg-rose-50 text-rose-800 ring-rose-100",
  legal: "bg-slate-100 text-slate-800 ring-slate-200",
};

const labels: Record<Tool["category"], string> = {
  finance: "Finance",
  writing: "Writing",
  daily: "Daily",
  developer: "Developer",
  education: "Education",
  health: "Health",
  legal: "Legal",
};

export default function CategoryBadge({ category }: { category: Tool["category"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[category],
      )}
    >
      {labels[category]}
    </span>
  );
}
