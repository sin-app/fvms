import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../mocks/handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("MSW mock server", () => {
  it("intercepts Supabase auth requests", async () => {
    const res = await fetch(
      "https://nzpjoxndqhcvphydiyaq.supabase.co/auth/v1/token?grant_type=password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@fvms.com", password: "Admin123!" }),
      },
    );
    const data = await res.json();
    expect(data.access_token).toBe("mock-token");
    expect(data.user.email).toBe("admin@fvms.com");
  });

  it("intercepts Supabase table queries", async () => {
    const res = await fetch(
      "https://nzpjoxndqhcvphydiyaq.supabase.co/rest/v1/kabupaten?select=*",
    );
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Kabupaten A");
  });
});
