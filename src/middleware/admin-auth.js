const { isUserAdmin } = require("../services/admin-rds")
const { extractUserIdFromToken } = require("../utils/jwt")

async function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization
    
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" })
    }

    const userId = extractUserIdFromToken(token)
    const adminInfo = await isUserAdmin(userId)

    if (!adminInfo) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." })
    }

    // Agregar info del admin al request
    req.admin = {
      userId,
      role: adminInfo.role,
      email: adminInfo.email,
    }

    next()
  } catch (error) {
    console.error("[ADMIN AUTH] Error:", error)
    return res.status(401).json({ error: "Invalid authentication" })
  }
}

module.exports = { requireAdmin }
