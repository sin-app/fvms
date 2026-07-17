"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <Label>Tema Tampilan</Label>
      <RadioGroup
        value={theme}
        onValueChange={(v) => setTheme(v)}
        className="grid grid-cols-3 gap-3"
      >
        <div>
          <RadioGroupItem value="light" id="light" className="peer sr-only" />
          <Label
            htmlFor="light"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted peer-aria-checked:border-primary peer-aria-checked:bg-primary/5 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-yellow-100 border" />
            <span className="text-sm font-medium">Terang</span>
          </Label>
        </div>
        <div>
          <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
          <Label
            htmlFor="dark"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted peer-aria-checked:border-primary peer-aria-checked:bg-primary/5 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-slate-800 border" />
            <span className="text-sm font-medium">Gelap</span>
          </Label>
        </div>
        <div>
          <RadioGroupItem value="system" id="system" className="peer sr-only" />
          <Label
            htmlFor="system"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted peer-aria-checked:border-primary peer-aria-checked:bg-primary/5 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-100 to-slate-800 border" />
            <span className="text-sm font-medium">Sistem</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
