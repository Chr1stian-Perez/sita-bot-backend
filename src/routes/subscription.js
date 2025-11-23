const express = require("express")
const router = express.Router()
const { publishUpgradeEvent } = require("../services/eventbridge")

router.post("/upgrade", async (req, res) => {
  try {
    const { planType } = req.body
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = token || "demo-user"

    const creditsToAdd = planType === "pro" ? 1000 : planType === "enterprise" ? 10000 : 0

    await publishUpgradeEvent(userId, planType, creditsToAdd)

    res.json({
      success: true,
      message: "Subscription upgrade event published",
    })
  } catch (error) {
    console.error("[API Subscription Error]:", error)
    res.status(500).json({ error: "Failed to upgrade subscription", details: error.message })
  }
})

module.exports = router
