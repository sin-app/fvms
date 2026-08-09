"use client";

import { memo, useCallback, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";

interface MultiFilterSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  options: string[] | undefined;
  className?: string;
}

const FilterOptionRow = memo(function FilterOptionRow({
  opt,
  checked,
  onToggle,
}: {
  opt: string;
  checked: boolean;
  onToggle: (opt: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={() => onToggle(opt)} />
      <span className="truncate">{opt}</span>
    </label>
  );
});

/** Multi-select nilai unik ala Excel: popover berisi daftar checkbox + pencarian. [] = Semua. */
export function MultiFilterSelect({
  value,
  onChange,
  label,
  options,
  className,
}: MultiFilterSelectProps) {
  const opts = options ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? opts.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : opts;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setQuery("");
  }

  const toggle = useCallback(
    (opt: string) => {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    },
    [value, onChange],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={className}>
        <div className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm sm:w-44">
          <span className={value.length === 0 ? "text-muted-foreground" : ""}>
            {value.length === 0 ? label : `${label} (${value.length})`}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Cari ${label}...`}
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <div className="max-h-64 overflow-auto flex flex-col gap-0.5">
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
            <Checkbox
              checked={value.length === 0}
              onCheckedChange={() => onChange([])}
            />
            <span className="font-medium">Semua {label}</span>
          </label>
          {filtered.map((opt) => (
            <FilterOptionRow
              key={opt}
              opt={opt}
              checked={value.includes(opt)}
              onToggle={toggle}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}