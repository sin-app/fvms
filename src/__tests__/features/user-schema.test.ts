import { describe, it, expect } from "vitest";
import { userSchema } from "@/features/auth/schema/user-schema";

describe("userSchema", () => {
  it("validates a valid user", () => {
    const result = userSchema.parse({
      name: "John Doe",
      email: "john@example.com",
      role: "field_officer",
      is_active: true,
    });
    expect(result.name).toBe("John Doe");
    expect(result.role).toBe("field_officer");
  });

  it("accepts optional phone", () => {
    const result = userSchema.parse({
      name: "John",
      email: "john@example.com",
      role: "admin",
      phone: "08123456789",
      is_active: true,
    });
    expect(result.phone).toBe("08123456789");
  });

  it("rejects empty name", () => {
    expect(() =>
      userSchema.parse({ name: "", email: "a@b.com", role: "admin", is_active: true }),
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      userSchema.parse({ name: "John", email: "not-email", role: "admin", is_active: true }),
    ).toThrow();
  });

  it("rejects invalid role", () => {
    expect(() =>
      userSchema.parse({ name: "John", email: "a@b.com", role: "ceo", is_active: true }),
    ).toThrow();
  });
});
