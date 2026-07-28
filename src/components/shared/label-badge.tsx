const LABEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  hijau: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  kuning: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-400" },
  merah: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export function LabelBadge({ label }: { label: string | null | undefined }) {
  if (!label) return <span className="text-xs text-muted-foreground">—</span>;

  const style = LABEL_STYLES[label];
  if (!style) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${style.bg} ${style.text} rounded-full px-2 py-0.5`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}
