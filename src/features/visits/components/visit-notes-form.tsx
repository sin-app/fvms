"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSaveVisitNotes } from "../hooks/use-visit";
import type { VisitNotes } from "@/types";

interface VisitNotesFormProps {
  scheduleId: string;
  defaultValues?: VisitNotes | null;
}

export function VisitNotesForm({ scheduleId, defaultValues }: VisitNotesFormProps) {
  const saveNotes = useSaveVisitNotes();
  const [observation, setObservation] = useState(defaultValues?.observation ?? "");
  const [problem, setProblem] = useState(defaultValues?.problem ?? "");
  const [recommend, setRecommend] = useState(defaultValues?.recommend ?? "");
  const [additional, setAdditional] = useState(defaultValues?.additional ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveNotes.mutateAsync({
      schedule_id: scheduleId,
      observation: observation || undefined,
      problem: problem || undefined,
      recommend: recommend || undefined,
      additional: additional || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="observation">Hasil Observasi</Label>
        <Textarea
          id="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Deskripsikan hasil observasi lapangan..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problem">Permasalahan</Label>
        <Textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Catat permasalahan yang ditemukan..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommend">Rekomendasi</Label>
        <Textarea
          id="recommend"
          value={recommend}
          onChange={(e) => setRecommend(e.target.value)}
          placeholder="Berikan rekomendasi tindak lanjut..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional">Catatan Tambahan</Label>
        <Textarea
          id="additional"
          value={additional}
          onChange={(e) => setAdditional(e.target.value)}
          placeholder="Catatan tambahan (opsional)..."
          rows={2}
        />
      </div>

      <Button type="submit" disabled={saveNotes.isPending}>
        {saveNotes.isPending ? "Menyimpan..." : "Simpan Catatan"}
      </Button>
    </form>
  );
}
