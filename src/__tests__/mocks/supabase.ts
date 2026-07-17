import { vi } from "vitest";

export function createMockQueryBuilder(): Record<string, ReturnType<typeof vi.fn>> {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
  const builder = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (!chainable[prop]) {
          chainable[prop] = vi.fn().mockReturnValue(builder);
        }
        return chainable[prop];
      },
    },
  );

  return builder as unknown as ReturnType<typeof createMockQueryBuilder>;
}

export function createMockSupabaseClient() {
  const queryBuilder = createMockQueryBuilder();

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/photo.jpg" } }),
        remove: vi.fn(),
      }),
    },
  };
}
