const express = require("express")
const axios = require("axios")
const { logUserActivity } = require("../services/admin-rds")
const { extractUserIdFromToken } = require("../utils/jwt")

const router = express.Router()

// GET /api/auth/callback - Intercambiar código por tokens
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ error: "No authorization code provided" })
    }

    const cognitoDomain = process.env.COGNITO_DOMAIN
    const clientId = process.env.COGNITO_CLIENT_ID
    const clientSecret = process.env.COGNITO_CLIENT_SECRET
    const redirectUri = process.env.COGNITO_REDIRECT_URI || "https://d5ka2kad2zert.cloudfront.net/auth/callback"

    // Intercambiar código por tokens
    const tokenUrl = `https://${cognitoDomain}/oauth2/token`

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
    })

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
    })

    try {
      const userId = extractUserIdFromToken(response.data.access_token)
      await logUserActivity(userId, "USER_LOGIN", "OAuth2 login", 0, 0)
    } catch (logError) {
      console.error("[Auth] Failed to log login activity:", logError)
    }

    res.json({
      access_token: response.data.access_token,
      id_token: response.data.id_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    })
  } catch (error) {
    console.error("[v0] Error en /api/auth/callback:", error.response?.data || error.message)
    res.status(500).json({
      error: "Failed to exchange code for tokens",
      details: error.response?.data || error.message,
    })
  }
})

// POST /api/auth/validate - Validar token
router.post("/validate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" })
    }

    const token = authHeader.split(" ")[1]

    // Validar token con Cognito
    const cognitoDomain = process.env.COGNITO_DOMAIN
    const userInfoUrl = `https://${cognitoDomain}/oauth2/userInfo`

    const response = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    res.json({
      valid: true,
      user: response.data,
    })
  } catch (error) {
    console.error("[v0] Error en /api/auth/validate:", error.response?.data || error.message)
    res.status(401).json({
      valid: false,
      error: "Invalid token",
    })
  }
})

module.exports = router
