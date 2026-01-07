const express = require("express")
const router = express.Router()
const { requireAdmin } = require("../middleware/admin-auth")
const { extractUserIdFromToken } = require("../utils/jwt")
const {
  isUserAdmin,
  getDashboardMetrics,
  getAllUsers,
  updateUserCredits,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getRecentActivity,
  getSystemLogs,
  createSystemLog,
} = require("../services/admin-rds")

// Verificar si usuario es admin (sin protección, solo para verificar)
router.post("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization
    if (!token) {
      return res.json({ isAdmin: false, role: null })
    }

    const userId = extractUserIdFromToken(token)
console.log("[ADMIN] Checking user ID:", userId)
    const adminInfo = await isUserAdmin(userId)
console.log("[ADMIN] Admin info:", adminInfo)
    if (adminInfo) {
      return res.json({ isAdmin: true, role: adminInfo.role, email: adminInfo.email })
    }

    res.json({ isAdmin: false, role: null })
  } catch (error) {
    console.error("[ADMIN] Verify error:", error)
    res.json({ isAdmin: false, role: null })
  }
})

// Obtener métricas del dashboard
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    console.log("[ADMIN] Dashboard metrics requested by:", req.admin.userId)
    const metrics = await getDashboardMetrics()
    res.json(metrics)
  } catch (error) {
    console.error("[ADMIN] Dashboard error:", error)
    res.status(500).json({ error: "Failed to fetch dashboard metrics" })
  }
})

// Obtener lista de usuarios
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const offset = parseInt(req.query.offset) || 0
    
    console.log("[ADMIN] Users list requested")
    const users = await getAllUsers(limit, offset)
    res.json({ users })
  } catch (error) {
    console.error("[ADMIN] Users list error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Actualizar créditos de usuario
router.patch("/users/:userId/credits", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { credits } = req.body

    console.log(`[ADMIN] Updating credits for ${userId} to ${credits}`)
    
    const newCredits = await updateUserCredits(userId, credits, req.admin.userId)
    
    await createSystemLog("INFO", `Admin ${req.admin.email} updated credits for user ${userId}`, req.admin.userId, { userId, newCredits })
    
    res.json({ success: true, credits: newCredits })
  } catch (error) {
    console.error("[ADMIN] Update credits error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Obtener planes de suscripción
router.get("/plans", requireAdmin, async (req, res) => {
  try {
    const plans = await getSubscriptionPlans()
    res.json({ plans })
  } catch (error) {
    console.error("[ADMIN] Plans error:", error)
    res.status(500).json({ error: "Failed to fetch plans" })
  }
})

// Crear plan de suscripción
router.post("/plans", requireAdmin, async (req, res) => {
  try {
    const { name, credits, price, description } = req.body
    
    console.log("[ADMIN] Creating new plan:", name)
    const plan = await createSubscriptionPlan(name, credits, price, description)
    
    await createSystemLog("INFO", `Admin ${req.admin.email} created plan: ${name}`, req.admin.userId, { plan })
    
    res.json({ success: true, plan })
  } catch (error) {
    console.error("[ADMIN] Create plan error:", error)
    res.status(500).json({ error: "Failed to create plan" })
  }
})

// Actualizar plan de suscripción
router.put("/plans/:planId", requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params
    const updates = req.body
    
    console.log(`[ADMIN] Updating plan ${planId}`)
    const plan = await updateSubscriptionPlan(planId, updates)
    
    await createSystemLog("INFO", `Admin ${req.admin.email} updated plan ${planId}`, req.admin.userId, { plan })
    
    res.json({ success: true, plan })
  } catch (error) {
    console.error("[ADMIN] Update plan error:", error)
    res.status(500).json({ error: "Failed to update plan" })
  }
})

// Eliminar plan
router.delete("/plans/:planId", requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params
    
    console.log(`[ADMIN] Deleting plan ${planId}`)
    await deleteSubscriptionPlan(planId)
    
    await createSystemLog("INFO", `Admin ${req.admin.email} deleted plan ${planId}`, req.admin.userId, { planId })
    
    res.json({ success: true })
  } catch (error) {
    console.error("[ADMIN] Delete plan error:", error)
    res.status(500).json({ error: "Failed to delete plan" })
  }
})

// Obtener logs del sistema
router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const level = req.query.level
    const limit = parseInt(req.query.limit) || 100
    
    const logs = await getSystemLogs(level, limit)
    res.json({ logs })
  } catch (error) {
    console.error("[ADMIN] Logs error:", error)
    res.status(500).json({ error: "Failed to fetch logs" })
  }
})

// Obtener actividad reciente
router.get("/activity", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const activity = await getRecentActivity(limit)
    res.json({ activity })
  } catch (error) {
    console.error("[ADMIN] Activity error:", error)
    res.status(500).json({ error: "Failed to fetch activity" })
  }
})

module.exports = router
