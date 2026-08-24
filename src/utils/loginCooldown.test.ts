import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearLoginCooldown,
  getRemainingCooldownSeconds,
  loadLoginCooldown,
  saveLoginCooldown,
} from "./loginCooldown";

describe("login cooldown", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("restores the remaining cooldown after a page reload", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    saveLoginCooldown(120);

    vi.spyOn(Date, "now").mockReturnValue(1_030_000);
    const restoredDeadline = loadLoginCooldown();

    expect(getRemainingCooldownSeconds(restoredDeadline)).toBe(90);
  });

  it("removes an expired cooldown", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    saveLoginCooldown(10);

    vi.spyOn(Date, "now").mockReturnValue(1_011_000);

    expect(loadLoginCooldown()).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("can clear a stored cooldown", () => {
    saveLoginCooldown(120);
    clearLoginCooldown();

    expect(loadLoginCooldown()).toBe(0);
  });
});
