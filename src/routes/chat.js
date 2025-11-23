const express = require("express")
const router = express.Router()
const { callGeminiAPI } = require("../services/gemini")
const { getUserCredits, deductCredits } = require("../services/rds")
const { saveChatToS3 } = require("../services/s3")

router.post("/", async (req, res) => {
  try {
    const { message, conversationHistory, chatId } = req.body
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    const userId = token && token !== "demo-token" ? token : "demo-user"

    const credits = await getUserCredits(userId)
    if (credits <= 0) {
      return res.status(403).json({ error: "Insufficient credits" })
    }

    const responseText = await callGeminiAPI(message, conversationHistory || [])

    await deductCredits(userId, 1)

    res.json({
      message: responseText,
      creditsRemaining: credits - 1,
    })
  } catch (error) {
    console.error("[API Chat Error]:", error)
    res.status(500).json({ error: "Failed to process chat", details: error.message })
  }
})

module.exports = router
