const { pool } = require("./rds")
const { GoogleGenerativeAI } = require("@google/generative-ai")

// <CHANGE> Eliminada inicialización global para evitar problemas con dotenv

async function searchSimilarDocuments(query, limit = 3) {
  try {
    // <CHANGE> Validación de seguridad para la API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY no está definida en las variables de entorno")
    }

    console.log("[RAG] Searching for:", query)
    
    // <CHANGE> Inicializar AQUÍ para asegurar que ENV ya cargó
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "models/embedding-001" })
    
    const result = await model.embedContent(query)
    const queryEmbedding = result.embedding.values

    console.log(`[RAG] Generated embedding with ${queryEmbedding.length} dimensions`)

    const searchQuery = `
      SELECT 
        dc.chunk_text,
        d.id as document_id,
        d.title,
        d.document_type,
        d.category,
        1 - (dc.embedding <=> $1::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE 1 - (dc.embedding <=> $1::vector) > 0.4
      ORDER BY similarity DESC
      LIMIT $2
    `

    const pgVector = `[${queryEmbedding.join(',')}]`
    const results = await pool.query(searchQuery, [pgVector, limit])

    console.log(`[RAG] Found ${results.rows.length} similar documents`)
if (results.rows.length > 0) {
      console.log(`[RAG] Best similarity score: ${results.rows[0].similarity}`)
    }
    return results.rows
  } catch (error) {
    console.error("[RAG] Error searching documents:", error.message)
    console.error("[RAG] Full error:", error)
    return []
  }
}

async function buildContextFromResults(results) {
  if (results.length === 0) return { context: null, sources: [] }

  let context = "\n\n=== CONTEXTO DE BASE DE CONOCIMIENTO ===\n\n"
  const sources = []
  
  results.forEach((result) => {
    context += `Documento ${result.document_id}: ${result.title} (${result.category})\n`
    context += `Contenido: ${result.chunk_text}\n\n`
    
    sources.push({
      id: result.document_id,
      title: result.title,
      category: result.category,
      similarity: result.similarity
    })
  })

  context += "=== FIN DEL CONTEXTO ===\n\n"
  context += "IMPORTANTE: Responde de forma CONCISA y DIRECTA. Máximo 2-3 párrafos.\n"
  context += "OBLIGATORIO: Al final de tu respuesta, agrega una línea en blanco y luego escribe:\n"
  context += "'Fuentes: Documento X, Documento Y' donde X e Y son los números de ID de los documentos consultados.\n"
  context += "Los documentos disponibles son: "
  context += sources.map(s => `Documento ${s.id}`).join(", ") + "\n"

  return { context, sources }
}

function isTechnicalSupportQuery(message) {
  const keywords = [
    "error", "problema", "fallo", "ayuda", "cómo", "como",
    "impresora", "computadora", "software", "hardware",
    "red", "internet", "wifi", "conexión", "contraseña",
    "instalar", "configurar", "arreglar", "solucionar",
  ]

  const messageLower = message.toLowerCase()
  return keywords.some((keyword) => messageLower.includes(keyword))
}

module.exports = {
  searchSimilarDocuments,
  buildContextFromResults,
  isTechnicalSupportQuery,
}
