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