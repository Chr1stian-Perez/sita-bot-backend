require("dotenv").config()
const express = require("express")
const cors = require("cors")
const chatRoutes = require("./routes/chat")
const chatsRoutes = require("./routes/chats")
const creditsRoutes = require("./routes/credits")
const subscriptionRoutes = require("./routes/subscription")
const authRoutes = require("./routes/auth")

const app = express()
const PORT = process.env.PORT || 8000

app.use(
  cors({
    origin: ["https://d3ay28hwrswqzz.cloudfront.net", "http://localhost:3000"],
    credentials: true,
  }),
)
app.use(express.json())

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() })
})

app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/chats", chatsRoutes)
app.use("/api/credits", creditsRoutes)
app.use("/api/subscription", subscriptionRoutes)

app.use((err, req, res, next) => {
  console.error("[Server Error]:", err)
  res.status(500).json({ error: "Internal server error", message: err.message })
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(` SITA Bot Backend listening on port ${PORT}`)
  console.log(` Health check: http://localhost:${PORT}/health`)
})
