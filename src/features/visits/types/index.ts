import type { VisitNotes, VisitPhoto } from "@/types";

export interface VisitDetailData {
  schedule: import("@/types").Schedule & {
    kabupaten?: { name: string };
    kecamatan?: { name: string };
    desa?: { name: string };
    users?: { name: string; email: string } | null;
    visit_notes?: VisitNotes | VisitNotes[];
    visit_photos?: VisitPhoto[];
  };
}

export interface VisitNotesFormData {
  observation?: string;
  problem?: string;
  recommend?: string;
  additional?: string;
}

export interface UploadPhotoResult {
  url: string;
  thumbnail: string | null;
  file_size: number;
  mime_type: string;
}
