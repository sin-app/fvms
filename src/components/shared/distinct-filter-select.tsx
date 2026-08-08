"use client";

interface DistinctFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[] | undefined;
  className?: string;
}

/** Select nilai unik ala Excel: opsi dari nilai distinct DB, "" = Semua. */
export function DistinctFilterSelect({
  value,
  onChange,
  label,
  options,
  className,
}: DistinctFilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-44 ${className ?? ""}`}
    >
      <option value="">{label}</option>
      {(options ?? []).map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}