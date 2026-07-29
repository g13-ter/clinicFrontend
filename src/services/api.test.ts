import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("API client recovery", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a temporary development proxy failure", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("proxy error", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        message: "ok",
        data: { totalStudents: 5 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    const request = api.get<{ totalStudents: number }>("/dashboard/stats");
    await vi.advanceTimersByTimeAsync(300);
    const response = await request;

    expect(response.data.totalStudents).toBe(5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a useful error when a proxy response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("proxy error", { status: 400 })),
    );

    await expect(api.get("/dashboard/stats")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        message: "The API is temporarily unavailable (400)",
        status: 400,
      }),
    );
  });

  it("normalizes mutation network failures without retrying the write", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.post("/appointments", { reason: "Checkup" })).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        message: "Cannot connect to the clinic service. Check your connection and try again.",
        status: 503,
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
