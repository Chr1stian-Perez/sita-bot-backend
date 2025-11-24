const express = require("express")
const router = express.Router()
const { getUserCredits } = require("../services/rds")
const { extractUserIdFromToken } = require("../utils/jwt")

router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = extractUserIdFromToken(token)

    if (!userId) {
      return res.status(401).json({ error: "Invalid token" })
    }

    const credits = await getUserCredits(userId)
    res.json({ credits })
  } catch (error) {
    console.error("[API Credits Error]:", error)
    res.status(500).json({ error: "Failed to get credits", details: error.message })
  }
})

module.exports = router
