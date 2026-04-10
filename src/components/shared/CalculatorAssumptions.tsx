type Props = {
  title?: string;
  items: string[];
};

export default function CalculatorAssumptions({
  title = "Assumptions",
  items,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/60 p-4 text-sm text-text-secondary">
      <p className="font-medium text-text-primary">{title}</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
