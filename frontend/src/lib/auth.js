// every localStorage key tied to a session. kept in one place because
// localStorage outlives the account: anything left behind is inherited by
// whoever logs in next on the same browser.
export const SESSION_KEYS = [
  'token',
  'userId',
  'username',
  'email',
  'location',
  'lat',
  'lng',
  'tempToken',
]

export function clearSession() {
  SESSION_KEYS.forEach(key => localStorage.removeItem(key))
}

// checks whether a JWT is present and not expired.
// returns false for missing, malformed, or expired tokens.
export function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return true // no expiry claim in token, treat as valid
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}