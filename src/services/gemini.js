async function callGeminiAPI(prompt, conversationHistory = []) {
  const models = [process.env.GEMINI_MODEL || "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

  const apiKeys = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2].filter(Boolean)

  for (const apiKey of apiKeys) {
    for (const model of models) {
      try {
        console.log(`[Gemini] Trying API with model: ${model}`)

        const contents = [
          ...conversationHistory.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.text }],
          })),
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ]

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              },
            }),
          },
        )

        const data = await response.json()

        if (!response.ok) {
          const errorMessage = data.error?.message || "Unknown error"
          console.error(`[Gemini] Error with ${model}:`, errorMessage)

          if (errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            continue
          }

          throw new Error(errorMessage)
        }

        const textResponse =
          data.candidates?.[0]?.content?.parts?.[0]?.text || data.candidates?.[0]?.content?.text || data.text || null

        if (textResponse) {
          console.log(`[Gemini] ✅ Success with model: ${model}`)
          return textResponse
        }
      } catch (error) {
        console.error(`[Gemini] Failed with ${model}:`, error.message)
        continue
      }
    }
  }

  throw new Error("All Gemini API attempts failed")
}

async function streamChat(messages, userId, res) {
  const models = [process.env.GEMINI_MODEL || "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
  const apiKeys = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2].filter(Boolean)

  for (const apiKey of apiKeys) {
    for (const model of models) {
      try {
        console.log(`[Gemini Stream] Trying model: ${model}`)

        const contents = messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }))

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              },
            }),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`[Gemini Stream] Error with ${model}:`, errorData)
          continue
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let chunkCount = 0

        console.log("[Gemini Stream] Starting to read chunks...")

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log(`[Gemini Stream] Stream ended. Total chunks: ${chunkCount}`)
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim()
              if (!jsonStr || jsonStr === "[DONE]") continue

              try {
                const data = JSON.parse(jsonStr)
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text

                if (text) {
                  chunkCount++
                  console.log(`[Gemini Stream] Chunk ${chunkCount}: ${text.substring(0, 50)}...`)
                  res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
                }
              } catch (e) {
                console.error("[Gemini Stream] Parse error:", e.message)
              }
            }
          }
        }

        res.write("data: [DONE]\n\n")
        res.end()
        console.log(`[Gemini Stream] ✅ Success with model: ${model}`)
        return
      } catch (error) {
        console.error(`[Gemini Stream] Failed with ${model}:`, error.message)
        continue
      }
    }
  }

  res.write(`data: ${JSON.stringify({ error: "All Gemini API attempts failed" })}\n\n`)
  res.end()
}

module.exports = { callGeminiAPI, streamChat }
