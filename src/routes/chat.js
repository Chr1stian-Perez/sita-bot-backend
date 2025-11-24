const express = require("express")
const router = express.Router()
const { streamChat } = require("../services/gemini")
const { extractUserIdFromToken } = require("../utils/jwt")
const { deductCredits } = require("../services/rds")

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body
    const token = req.headers.authorization?.replace("Bearer ", "")

    console.log("[API Chat] Request received:", { messageCount: messages?.length })

    if (!messages || !Array.isArray(messages)) {
      console.error("[API Chat] Invalid messages format:", messages)
      return res.status(400).json({ error: "messages array is required" })
    }

    const userId = extractUserIdFromToken(token)

    console.log("[API Chat] Processing chat request for user:", userId)

    try {
      await deductCredits(userId, 1)
      console.log("[API Chat] Deducted 1 credit for user:", userId)
    } catch (error) {
      console.error("[API Chat] Failed to deduct credits:", error)
      return res.status(402).json({ error: "Insufficient credits" })
    }

    // Set headers for SSE streaming
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    console.log("[API Chat] Starting stream...")
    await streamChat(messages, userId, res)
  } catch (error) {
    console.error("[API Chat Error]:", error)
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat", details: error.message })
    }
  }
})

module.exports = router
