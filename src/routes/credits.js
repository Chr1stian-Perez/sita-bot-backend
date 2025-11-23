const express = require("express")
const router = express.Router()
const { getUserCredits } = require("../services/rds")

router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = token || "demo-user"

    const credits = await getUserCredits(userId)
    res.json({ credits })
  } catch (error) {
    console.error("[API Credits Error]:", error)
    res.status(500).json({ error: "Failed to get credits", details: error.message })
  }
})

module.exports = router
