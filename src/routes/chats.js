const express = require("express")
const router = express.Router()
const { loadChatsFromS3, saveChatToS3 } = require("../services/s3")

router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = token || "demo-user"

    const chats = await loadChatsFromS3(userId)
    res.json({ chats })
  } catch (error) {
    console.error("[API Chats Error]:", error)
    res.status(500).json({ error: "Failed to load chats", details: error.message })
  }
})

router.post("/save", async (req, res) => {
  try {
    const { chatId, messages } = req.body
    const token = req.headers.authorization?.replace("Bearer ", "")
    const userId = token || "demo-user"

    await saveChatToS3(userId, chatId, messages)
    res.json({ success: true })
  } catch (error) {
    console.error("[API Save Chat Error]:", error)
    res.status(500).json({ error: "Failed to save chat", details: error.message })
  }
})

module.exports = router
