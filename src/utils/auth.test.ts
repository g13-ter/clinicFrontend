import { describe, expect, it, beforeEach } from "vitest";
import {
  clearCurrentSession,
  getCurrentUser,
  getCurrentRole,
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
});
