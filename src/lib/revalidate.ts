import { revalidatePath } from "next/cache";

export function revalidateSchedulePaths(id?: string) {
  revalidatePath("/schedules");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  if (id) revalidatePath(`/visits/${id}`);
}
