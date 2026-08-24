const LOGIN_COOLDOWN_KEY = "clinic_login_cooldown_until";

export function getRemainingCooldownSeconds(
  cooldownUntil: number,
  now = Date.now(),
): number {
  return Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
}

export function loadLoginCooldown(): number {
  try {
    const cooldownUntil = Number(sessionStorage.getItem(LOGIN_COOLDOWN_KEY));
    if (Number.isFinite(cooldownUntil) && cooldownUntil > Date.now()) {
      return cooldownUntil;
    }
    sessionStorage.removeItem(LOGIN_COOLDOWN_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return 0;
}

export function saveLoginCooldown(seconds: number): number {
  const cooldownUntil = Date.now() + Math.max(1, seconds) * 1000;
  try {
    sessionStorage.setItem(LOGIN_COOLDOWN_KEY, String(cooldownUntil));
  } catch {
    // The in-memory countdown still works if storage is unavailable.
  }
  return cooldownUntil;
}

export function clearLoginCooldown(): void {
  try {
    sessionStorage.removeItem(LOGIN_COOLDOWN_KEY);
  } catch {
    // Nothing else needs clearing when storage is unavailable.
  }
}
