"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

interface MultiFilterSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  options: string[] | undefined;
  className?: string;
}

/** Multi-select nilai unik ala Excel: popover berisi daftar checkbox. [] = Semua. */
export function MultiFilterSelect({
  value,
  onChange,
  label,
  options,
  className,
}: MultiFilterSelectProps) {
  const opts = options ?? [];

  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }

  return (
    <Popover>
      <PopoverTrigger className={className}>
        <div className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm sm:w-44">
          <span className={value.length === 0 ? "text-muted-foreground" : ""}>
            {value.length === 0 ? label : `${label} (${value.length})`}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 overflow-auto">
        <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
          <Checkbox
            checked={value.length === 0}
            onCheckedChange={() => onChange([])}
          />
          <span className="font-medium">Semua {label}</span>
        </label>
        {opts.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
          >
            <Checkbox checked={value.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span className="truncate">{opt}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}