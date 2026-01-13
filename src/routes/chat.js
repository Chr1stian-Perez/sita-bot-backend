const express = require("express")
const router = express.Router()
const { streamChat } = require("../services/gemini")
const { extractUserIdFromToken } = require("../utils/jwt")
const { deductCredits, getUserCredits } = require("../services/rds")
const { logUserActivity } = require("../services/admin-rds")
const { searchSimilarDocuments, buildContextFromResults, isTechnicalSupportQuery } = require("../services/rag-search")

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

    let creditsBefore = 0
    try {
      creditsBefore = await getUserCredits(userId)
    } catch (error) {
      console.warn("[API Chat] Could not get credits before:", error)
    }

    try {
      await deductCredits(userId, 1)
      console.log("[API Chat] Deducted 1 credit for user:", userId)

      const creditsAfter = creditsBefore - 1
      await logUserActivity(userId, "CHAT_MESSAGE", `Sent ${messages.length} messages`, creditsBefore, creditsAfter)
    } catch (error) {
      console.error("[API Chat] Failed to deduct credits:", error)
      return res.status(402).json({ error: "Insufficient credits" })
    }

    let ragContext = null
    let ragSources = []
    const lastUserMessage = messages[messages.length - 1]?.content || ""

    if (isTechnicalSupportQuery(lastUserMessage)) {
      console.log("[API Chat] Technical support question detected, searching knowledge base...")
      try {
        const results = await searchSimilarDocuments(lastUserMessage, 3)
        if (results.length > 0) {
          const ragData = await buildContextFromResults(results)
          ragContext = ragData.context
          ragSources = ragData.sources
          console.log("[API Chat] RAG context prepared with", results.length, "documents")
        } else {
          console.log("[API Chat] No relevant documents found in knowledge base")
        }
      } catch (ragError) {
        console.error("[API Chat] RAG search failed:", ragError)
      }
    }

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    console.log("[API Chat] Starting stream...")
    await streamChat(messages, userId, res, ragContext, ragSources)
  } catch (error) {
    console.error("[API Chat Error]:", error)
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat", details: error.message })
    }
  }
})

module.exports = router
