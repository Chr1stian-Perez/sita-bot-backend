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

module.exports = { callGeminiAPI }
