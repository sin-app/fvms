import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRequestId, getRequestId, logger } from "@/lib/logger";

describe("withRequestId / getRequestId", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets request id within the scope", () => {
    withRequestId("req-123", () => {
      expect(getRequestId()).toBe("req-123");
    });
  });

  it("restores previous request id after scope", () => {
    withRequestId("req-outer", () => {
      withRequestId("req-inner", () => {
        expect(getRequestId()).toBe("req-inner");
      });
      expect(getRequestId()).toBe("req-outer");
    });
  });

  it("returns undefined outside any scope", () => {
    expect(getRequestId()).toBeUndefined();
  });

  it("returns the result of the fn", () => {
    const result = withRequestId("req-1", () => 42);
    expect(result).toBe(42);
  });
});

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.info calls console.log with JSON", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test message", { extra: "data" });
    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = JSON.parse(spy.mock.calls[0]![0]);
    expect(callArg.level).toBe("info");
    expect(callArg.msg).toBe("test message");
    expect(callArg.extra).toBe("data");
  });

  it("logger.warn calls console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("warning");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("warning"));
  });

  it("logger.error calls console.error with level error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("error message", { err: "something" });
    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = JSON.parse(spy.mock.calls[0]![0]);
    expect(callArg.level).toBe("error");
    expect(callArg.err).toBe("something");
  });

  it("includes request_id when set", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    withRequestId("req-xyz", () => {
      logger.info("with id");
    });
    const callArg = JSON.parse(spy.mock.calls[0]![0]);
    expect(callArg.request_id).toBe("req-xyz");
  });
});
