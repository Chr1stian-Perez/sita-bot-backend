//version de chat github
const express = require("express")
const router = express.Router()
const { streamChat } = require("../services/gemini")

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = token || "demo-user"

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    await streamChat(messages, userId, res)
  } catch (error) {
    console.error("[API Chat Error]:", error)
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat", details: error.message })
    }
  }
})

module.exports = router
