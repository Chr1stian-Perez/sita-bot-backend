const express = require("express")
const router = express.Router()
const { loadChatsFromS3, saveChatToS3, getChatFromS3 } = require("../services/s3")
const { extractUserIdFromToken } = require("../utils/jwt")

// GET /api/chats - List all chats for a user
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = extractUserIdFromToken(token)

    console.log(`[API] Loading chats for user: ${userId}`)

    const chats = await loadChatsFromS3(userId)

    res.json({ chats })
  } catch (error) {
    console.error("[API] Error loading chats:", error)
    res.status(500).json({ error: "Failed to load chats", details: error.message })
  }
})

// POST /api/chats/save - Save a chat to S3
router.post("/save", async (req, res) => {
  try {
    const { chatId, messages } = req.body
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = extractUserIdFromToken(token)

    if (!chatId || !messages) {
      return res.status(400).json({ error: "chatId and messages are required" })
    }

    console.log(`[API] Saving chat ${chatId} for user: ${userId}`)

    const result = await saveChatToS3(userId, chatId, messages)

    res.json({ success: true, ...result })
  } catch (error) {
    console.error("[API] Error saving chat:", error)
    res.status(500).json({ error: "Failed to save chat", details: error.message })
  }
})

// GET /api/chats/:chatId - Get a specific chat
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = extractUserIdFromToken(token)

    console.log(`[API] Getting chat ${chatId} for user: ${userId}`)

    const chat = await getChatFromS3(userId, chatId)

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" })
    }

    res.json(chat)
  } catch (error) {
    console.error("[API] Error getting chat:", error)
    res.status(500).json({ error: "Failed to get chat", details: error.message })
  }
})

module.exports = router
