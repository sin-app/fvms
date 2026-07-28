import { describe, it, expect } from "vitest";

describe("authorization — isPrivileged", () => {
  async function getModule() {
    return import("@/lib/auth/authorization");
  }

  it("returns true for admin", async () => {
    const { isPrivileged } = await getModule();
    expect(isPrivileged("admin")).toBe(true);
  });

  it("returns true for qc", async () => {
    const { isPrivileged } = await getModule();
    expect(isPrivileged("qc")).toBe(true);
  });

  it("returns false for produksi", async () => {
    const { isPrivileged } = await getModule();
    expect(isPrivileged("produksi")).toBe(false);
  });
});

describe("authorization — qcKabupatenScope", () => {
  async function getModule() {
    return import("@/lib/auth/authorization");
  }

  it("returns null for admin role", async () => {
    const { qcKabupatenScope } = await getModule();
    expect(qcKabupatenScope({ userId: "u1", role: "admin", assignedKabupatenIds: ["kab-a"] })).toBeNull();
  });

  it("returns null for produksi role", async () => {
    const { qcKabupatenScope } = await getModule();
    expect(qcKabupatenScope({ userId: "u1", role: "produksi", assignedKabupatenIds: [] })).toBeNull();
  });

  it("returns assigned kabupaten ids for qc", async () => {
    const { qcKabupatenScope } = await getModule();
    const result = qcKabupatenScope({ userId: "u1", role: "qc", assignedKabupatenIds: ["kab-a", "kab-b"] });
    expect(result).toEqual(["kab-a", "kab-b"]);
  });

  it("returns empty array for qc with no assignments", async () => {
    const { qcKabupatenScope } = await getModule();
    const result = qcKabupatenScope({ userId: "u1", role: "qc", assignedKabupatenIds: [] });
    expect(result).toEqual([]);
  });
});
