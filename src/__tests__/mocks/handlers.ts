import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("*/auth/v1/token*", () =>
    HttpResponse.json({
      access_token: "mock-token",
      user: {
        id: "mock-user-id",
        email: "admin@fvms.com",
        user_metadata: { name: "Admin" },
      },
    }),
  ),

  http.get("*/rest/v1/users*", () =>
    HttpResponse.json([
      { id: "1", name: "Admin", email: "admin@fvms.com", role: "admin", is_active: true },
      { id: "2", name: "Officer", email: "officer@fvms.com", role: "field_officer", is_active: true },
    ]),
  ),

  http.get("*/rest/v1/kabupaten*", () =>
    HttpResponse.json([
      { id: "kab-1", name: "Kabupaten A", code: "KA-01", is_active: true },
      { id: "kab-2", name: "Kabupaten B", code: "KA-02", is_active: true },
    ]),
  ),
];
