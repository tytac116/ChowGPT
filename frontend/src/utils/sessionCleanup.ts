// Session cleanup utilities
export const SESSION_DURATION = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

export interface SessionData {
  timestamp: number
  data: any
}

export function setSessionWithExpiry(key: string, value: any, ttl: number = SESSION_DURATION) {
  const sessionData: SessionData = {
    timestamp: Date.now(),
    data: value
  }
  
  try {
    sessionStorage.setItem(key, JSON.stringify(sessionData))
    sessionStorage.setItem(`${key}_ttl`, ttl.toString())
  } catch (error) {
    console.warn(`Failed to set session storage for key "${key}":`, error)
  }
}

export function getSessionWithExpiry(key: string): any | null {
  try {
    const item = sessionStorage.getItem(key)
    const ttl = sessionStorage.getItem(`${key}_ttl`)
    
    if (!item || !ttl) {
      return null
    }

    const sessionData: SessionData = JSON.parse(item)
    const timeToLive = parseInt(ttl)
    const now = Date.now()

    // Check if the session has expired
    if (now - sessionData.timestamp > timeToLive) {
      sessionStorage.removeItem(key)
      sessionStorage.removeItem(`${key}_ttl`)
      return null
    }

    return sessionData.data
  } catch (error) {
    console.warn(`Failed to get session storage for key "${key}":`, error)
    return null
  }
}

export function cleanupExpiredSessions() {
  const keys = Object.keys(sessionStorage)
  
  keys.forEach(key => {
    if (key.endsWith('_ttl')) {
      const dataKey = key.replace('_ttl', '')
      getSessionWithExpiry(dataKey) // This will automatically clean up expired items
    }
  })
}

// Clean up expired sessions on page load
if (typeof window !== 'undefined') {
  cleanupExpiredSessions()
  
  // Set up periodic cleanup (every 30 minutes)
  setInterval(cleanupExpiredSessions, 30 * 60 * 1000)
}