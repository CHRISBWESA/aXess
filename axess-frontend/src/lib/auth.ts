// src/lib/auth.ts
export async function logoutRequest(): Promise<void> {
  try {
    // best-effort server logout (if you later implement it)
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch {
    // ignore network errors
  }
}

export function clearLocalAuthState(): void {
  try { localStorage.removeItem('authToken'); } catch {}
  try { localStorage.removeItem('currentUser'); } catch {}
  try { sessionStorage.removeItem('authToken'); } catch {}
}

export async function performLogout(): Promise<void> {
  await logoutRequest();
  clearLocalAuthState();
}