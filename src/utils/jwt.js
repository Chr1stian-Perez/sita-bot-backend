// Decode JWT token and extract user ID (sub)
function extractUserIdFromToken(token) {
  if (!token || token === "demo-token") {
    return "demo-user"
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split(".")
    if (parts.length !== 3) {
      console.error("[JWT] Invalid token format")
      return "demo-user"
    }

    // Decode base64 payload
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())

    // Extract sub (user ID) from payload
    const userId = payload.sub || payload.username || "demo-user"
    console.log(`[JWT] Extracted user ID: ${userId}`)

    return userId
  } catch (error) {
    console.error("[JWT] Error decoding token:", error.message)
    return "demo-user"
  }
}

module.exports = { extractUserIdFromToken }
