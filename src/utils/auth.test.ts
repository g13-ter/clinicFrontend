import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCurrentSession,
  getCurrentUser,
  getCurrentRole,
  restoreCurrentSession,
  saveCurrentSession,
} from "./auth";

describe("auth utils", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getCurrentUser()).toBeNull();
    expect(getCurrentRole()).toBeNull();
  });

  it("reads valid cached session metadata", () => {
    saveCurrentSession(
      { id: "abc123", role: "nurse" },
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    );

    expect(getCurrentUser()).toEqual({
      id: "abc123",
      role: "nurse",
      exp: expect.any(Number),
    });
    expect(getCurrentRole()).toBe("nurse");
  });

  it("rejects expired session metadata", () => {
    saveCurrentSession(
      { id: "abc123", role: "staff" },
      new Date(Date.now() - 10_000).toISOString(),
    );

    expect(getCurrentUser()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects cached sessions with an invalid role", () => {
    sessionStorage.setItem("clinic_session", JSON.stringify({
      id: "abc123",
      role: "superadmin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));

    expect(getCurrentUser()).toBeNull();
  });

  it("clears legacy browser tokens during logout", () => {
    localStorage.setItem("token", "legacy-token");
    clearCurrentSession();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("restores a valid server session and caches only safe metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        user: { id: "doctor-1", role: "doctor" },
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    const result = await restoreCurrentSession();

    expect(result).toEqual(expect.objectContaining({ status: "authenticated" }));
    expect(getCurrentRole()).toBe("doctor");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("distinguishes a service outage from an expired session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(restoreCurrentSession()).resolves.toEqual({
      status: "unavailable",
      message: "Cannot connect to the clinic service. Check your connection and try again.",
    });
  });
});
