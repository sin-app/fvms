export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded" />
      </div>
      <div className="h-64 rounded-xl border bg-card p-6 space-y-4">
        <div className="h-6 w-24 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>
    </div>
  );
}
