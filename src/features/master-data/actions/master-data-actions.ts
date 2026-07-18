"use server";

import { revalidatePath } from "next/cache";
import {
  kabupatenSchema,
  kecamatanSchema,
  desaSchema,
} from "../schema/master-data-schema";
import {
  createKabupaten,
  updateKabupaten,
  deleteKabupaten,
  createKecamatan,
  updateKecamatan,
  deleteKecamatan,
  createDesa,
  updateDesa,
  deleteDesa,
} from "../services/master-data-service";
import type { ActionResponse } from "@/types/common";
import { requireAdmin } from "@/lib/auth/authorization";

export async function createKabupatenAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const raw = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const parsed = kabupatenSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await createKabupaten(parsed.data);
    revalidatePath("/master-data/kabupaten");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat kabupaten";
    return { success: false, error: msg };
  }
}

export async function updateKabupatenAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const parsed = kabupatenSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await updateKabupaten(id, { ...parsed.data, is_active: true });
    revalidatePath("/master-data/kabupaten");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate kabupaten";
    return { success: false, error: msg };
  }
}

export async function deleteKabupatenAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  try {
    await deleteKabupaten(id);
    revalidatePath("/master-data/kabupaten");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus kabupaten";
    return { success: false, error: msg };
  }
}

export async function createKecamatanAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const raw = {
    kabupaten_id: formData.get("kabupaten_id") as string,
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const parsed = kecamatanSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await createKecamatan(parsed.data);
    revalidatePath("/master-data/kecamatan");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat kecamatan";
    return { success: false, error: msg };
  }
}

export async function updateKecamatanAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    kabupaten_id: formData.get("kabupaten_id") as string,
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const parsed = kecamatanSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await updateKecamatan(id, { ...parsed.data, is_active: true });
    revalidatePath("/master-data/kecamatan");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate kecamatan";
    return { success: false, error: msg };
  }
}

export async function deleteKecamatanAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  try {
    await deleteKecamatan(id);
    revalidatePath("/master-data/kecamatan");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus kecamatan";
    return { success: false, error: msg };
  }
}

export async function createDesaAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const raw = {
    kecamatan_id: formData.get("kecamatan_id") as string,
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const parsed = desaSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await createDesa(parsed.data);
    revalidatePath("/master-data/desa");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat desa";
    return { success: false, error: msg };
  }
}

export async function updateDesaAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    kecamatan_id: formData.get("kecamatan_id") as string,
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };

  const parsed = desaSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await updateDesa(id, { ...parsed.data, is_active: true });
    revalidatePath("/master-data/desa");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate desa";
    return { success: false, error: msg };
  }
}

export async function deleteDesaAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  try {
    await deleteDesa(id);
    revalidatePath("/master-data/desa");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus desa";
    return { success: false, error: msg };
  }
}
