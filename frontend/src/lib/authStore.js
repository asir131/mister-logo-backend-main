const AUTH_KEY = "mister-logo-auth";
const PROFILE_KEY = "mister-logo-profile";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAuth() {
  return readJson(AUTH_KEY, {
    user: null,
    token: "",
    refreshToken: "",
    resetToken: "",
  });
}

export function setAuth(nextAuth) {
  writeJson(AUTH_KEY, {
    user: nextAuth.user ?? null,
    token: nextAuth.token ?? "",
    refreshToken: nextAuth.refreshToken ?? "",
    resetToken: nextAuth.resetToken ?? "",
  });
}

export function updateAuth(patch) {
  const current = getAuth();
  setAuth({ ...current, ...patch });
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

export function getProfile() {
  return readJson(PROFILE_KEY, { profile: null, completed: false });
}

export function setProfile(profile) {
  const completed = Boolean(profile);
  writeJson(PROFILE_KEY, { profile, completed });
}

export function setProfileCompleted(completed) {
  const current = getProfile();
  writeJson(PROFILE_KEY, { profile: current.profile, completed: Boolean(completed) });
}
