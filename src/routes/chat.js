import express from "express"
import { callGeminiAPI } from "../services/gemini.js"

const router = express.Router()

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body
    const userId = req.user.userId

    if (!message) {
      return res.status(400).json({ error: "Mensaje vacío" })
    }

    // Llamar a Gemini API
    const response = await callGeminiAPI(message)

    // Log a S3 (en EC2)
    // await logChatToS3(userId, message, response);

    res.json({
      success: true,
      message: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en /api/chat:", error)
    res.status(500).json({ error: "Error procesando mensaje" })
  }
})

export { router as chatRoutes }
