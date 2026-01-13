const express = require("express")
const router = express.Router()
const AWS = require("aws-sdk")
const { requireAdmin } = require("../middleware/admin-auth")
const { 
  getAllDocuments, 
  deleteDocument 
} = require("../services/knowledge-base-rds")

const s3 = new AWS.S3()
const BUCKET_NAME = "sita-bot-documents"

// Obtener lista de documentos
router.get("/", requireAdmin, async (req, res) => {
  try {
    console.log("[ADMIN] Knowledge base list requested")
    const documents = await getAllDocuments()
    res.json({ documents })
  } catch (error) {
    console.error("[ADMIN] Knowledge base list error:", error)
    res.status(500).json({ error: "Failed to fetch documents" })
  }
})

// Obtener URL firmada para subir a S3
router.post("/upload-url", requireAdmin, async (req, res) => {
  try {
    const { filename, contentType } = req.body
    const fileKey = `${Date.now()}-${filename}`

    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      Expires: 300, // 5 minutos
      ACL: 'private'
    })

    console.log("[ADMIN] Upload URL generated for:", fileKey)
    res.json({ uploadUrl, fileKey })
  } catch (error) {
    console.error("[ADMIN] Upload URL error:", error)
    res.status(500).json({ error: "Failed to generate upload URL" })
  }
})

// Eliminar documento
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    console.log("[ADMIN] Deleting document:", id)
    
    await deleteDocument(parseInt(id))
    res.json({ success: true })
  } catch (error) {
    console.error("[ADMIN] Delete document error:", error)
    res.status(500).json({ error: "Failed to delete document" })
  }
})

module.exports = router
