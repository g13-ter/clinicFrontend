import { describe, expect, it, beforeEach } from "vitest";
import { getCurrentUser, getCurrentRole } from "./auth";

const makeToken = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe("auth utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getCurrentUser()).toBeNull();
    expect(getCurrentRole()).toBeNull();
  });

  it("decodes a valid token payload", () => {
    localStorage.setItem(
      "token",
      makeToken({ id: "abc123", role: "nurse", exp: Math.floor(Date.now() / 1000) + 3600 })
    );

    expect(getCurrentUser()).toEqual({
      id: "abc123",
      role: "nurse",
      exp: expect.any(Number),
    });
    expect(getCurrentRole()).toBe("nurse");
  });

  it("rejects expired tokens", () => {
    localStorage.setItem(
      "token",
      makeToken({ id: "abc123", role: "staff", exp: Math.floor(Date.now() / 1000) - 10 })
    );

    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("rejects tokens with an invalid role claim", () => {
    localStorage.setItem(
      "token",
      makeToken({ id: "abc123", role: "superadmin", exp: Math.floor(Date.now() / 1000) + 3600 })
    );

    expect(getCurrentUser()).toBeNull();
  });
});
