const { pool } = require("./rds")

async function getAllDocuments() {
  const query = `
    SELECT id, title, document_type, category, created_at 
    FROM documents 
    ORDER BY created_at DESC
  `
  const result = await pool.query(query)
  return result.rows
}

async function deleteDocument(documentId) {
  // Los chunks se eliminan automáticamente por CASCADE
  const query = "DELETE FROM documents WHERE id = $1"
  await pool.query(query, [documentId])
}

module.exports = {
  getAllDocuments,
  deleteDocument,
}
