const { pool } = require("./rds")

// Verificar si un usuario es administrador
async function isUserAdmin(userId) {
  const query = "SELECT role, email FROM admin_users WHERE user_id = $1"
  const result = await pool.query(query, [userId])
  return result.rows.length > 0 ? result.rows[0] : null
}

// Obtener métricas del dashboard
async function getDashboardMetrics() {
  const totalUsersQuery = "SELECT COUNT(*) as count FROM user_credits"
  const totalCreditsQuery = "SELECT SUM(credits) as total FROM user_credits"
  const activeUsersQuery = "SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE created_at > NOW() - INTERVAL '24 hours'"
  
  const [totalUsers, totalCredits, activeUsers] = await Promise.all([
    pool.query(totalUsersQuery),
    pool.query(totalCreditsQuery),
    pool.query(activeUsersQuery),
  ])

  return {
    totalUsers: parseInt(totalUsers.rows[0].count),
    totalCredits: parseInt(totalCredits.rows[0].total) || 0,
    activeUsersToday: parseInt(activeUsers.rows[0].count),
  }
}

// Obtener lista de usuarios con sus datos
async function getAllUsers(limit = 100, offset = 0) {
  const query = `
    SELECT user_id, credits, created_at, updated_at 
    FROM user_credits 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `
  const result = await pool.query(query, [limit, offset])
  return result.rows
}

// Actualizar créditos de un usuario (por admin)
async function updateUserCredits(userId, newCredits, adminId) {
  const getCurrentQuery = "SELECT credits FROM user_credits WHERE user_id = $1"
  const currentResult = await pool.query(getCurrentQuery, [userId])
  
  if (currentResult.rows.length === 0) {
    throw new Error("User not found")
  }

  const creditsBefore = currentResult.rows[0].credits
  
  const updateQuery = "UPDATE user_credits SET credits = $1, updated_at = NOW() WHERE user_id = $2 RETURNING credits"
  const result = await pool.query(updateQuery, [newCredits, userId])
  
  // Registrar actividad
  await logUserActivity(userId, "ADMIN_CREDIT_UPDATE", `Admin ${adminId} updated credits`, creditsBefore, newCredits)
  
  return result.rows[0].credits
}

// Obtener planes de suscripción
async function getSubscriptionPlans() {
  const query = "SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC"
  const result = await pool.query(query)
  return result.rows
}

// Crear plan de suscripción
async function createSubscriptionPlan(name, credits, price, description) {
  const query = "INSERT INTO subscription_plans (name, credits, price, description) VALUES ($1, $2, $3, $4) RETURNING *"
  const result = await pool.query(query, [name, credits, price, description])
  return result.rows[0]
}

// Actualizar plan de suscripción
async function updateSubscriptionPlan(planId, updates) {
  const { name, credits, price, description, is_active } = updates
  const query = `
    UPDATE subscription_plans 
    SET name = COALESCE($1, name),
        credits = COALESCE($2, credits),
        price = COALESCE($3, price),
        description = COALESCE($4, description),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
    WHERE id = $6
    RETURNING *
  `
  const result = await pool.query(query, [name, credits, price, description, is_active, planId])
  return result.rows[0]
}

// Eliminar plan
async function deleteSubscriptionPlan(planId) {
  const query = "UPDATE subscription_plans SET is_active = false WHERE id = $1"
  await pool.query(query, [planId])
}

// Registrar actividad de usuario
async function logUserActivity(userId, action, details, creditsBefore, creditsAfter) {
  const query = "INSERT INTO user_activity (user_id, action, details, credits_before, credits_after) VALUES ($1, $2, $3, $4, $5)"
  await pool.query(query, [userId, action, details, creditsBefore, creditsAfter])
}

// Obtener actividad reciente
async function getRecentActivity(limit = 50) {
  const query = "SELECT * FROM user_activity ORDER BY created_at DESC LIMIT $1"
  const result = await pool.query(query, [limit])
  return result.rows
}

// Obtener logs del sistema
async function getSystemLogs(level = null, limit = 100) {
  let query = "SELECT * FROM system_logs"
  const params = []
  
  if (level) {
    query += " WHERE level = $1"
    params.push(level)
  }
  
  query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1)
  params.push(limit)
  
  const result = await pool.query(query, params)
  return result.rows
}

// Crear log del sistema
async function createSystemLog(level, message, userId = null, metadata = null) {
  const query = "INSERT INTO system_logs (level, message, user_id, metadata) VALUES ($1, $2, $3, $4)"
  await pool.query(query, [level, message, userId, metadata])
}

module.exports = {
  isUserAdmin,
  getDashboardMetrics,
  getAllUsers,
  updateUserCredits,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  logUserActivity,
  getRecentActivity,
  getSystemLogs,
  createSystemLog,
}
