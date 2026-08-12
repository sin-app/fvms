import "fake-indexeddb/auto";

export type CallRecord = { table: string; method: string; args: unknown[] };

export function createFakeSupabase(scripts: { [table: string]: unknown[] | (() => unknown[]) }) {
  const calls: CallRecord[] = [];

  function builder(table: string, resolver: () => unknown) {
    const target: Record<string, unknown> = {};
    const b = new Proxy(target, {
      get(_, prop: string) {
        if (prop === "then") {
          return (onFulfilled?: (v: unknown) => unknown) => {
            const result = resolver();
            return Promise.resolve(result).then(onFulfilled);
          };
        }
        if (prop === "select" || prop === "is" || prop === "limit" || prop === "eq" || prop === "in" || prop === "order" || prop === "range" || prop === "maybeSingle" || prop === "single") {
          return (...args: unknown[]) => {
            calls.push({ table, method: prop, args });
            return b;
          };
        }
        if (prop === "upsert" || prop === "update" || prop === "delete" || prop === "insert") {
          return (...args: unknown[]) => {
            calls.push({ table, method: prop, args });
            return b;
          };
        }
        return undefined;
      },
    });
    return b;
  }

  const supabase: Record<string, unknown> = {
    from: (table: string) => {
      calls.push({ table, method: "from", args: [] });
      const script = scripts[table] ?? [];
      const rows = typeof script === "function" ? script() : script;
      return builder(table, () => ({ data: rows, error: null }));
    },
    storage: {
      from: (bucket: string) => ({
        upload: (...args: unknown[]) => {
          calls.push({ table: `storage:${bucket}`, method: "upload", args });
          return Promise.resolve({ data: { path: args[0] }, error: null });
        },
        remove: (...args: unknown[]) => {
          calls.push({ table: `storage:${bucket}`, method: "remove", args });
          return Promise.resolve({ data: {}, error: null });
        },
      }),
    },
  };

  return { supabase: supabase as never, calls };
}