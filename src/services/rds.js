const { Pool } = require("pg")

const pool = new Pool({
  host: process.env.RDS_HOST,
  port: Number.parseInt(process.env.RDS_PORT || "5432"),
  database: process.env.RDS_DATABASE,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

async function getUserCredits(userId) {
  if (process.env.BYPASS_RDS === "true") {
    return 999
  }

  try {
    const result = await pool.query("SELECT credits FROM user_credits WHERE user_id = $1", [userId])

    if (result.rows.length === 0) {
      await pool.query("INSERT INTO user_credits (user_id, credits) VALUES ($1, $2)", [userId, 50])
      return 50
    }

    return result.rows[0].credits
  } catch (error) {
    console.error("[RDS Error]:", error)
    throw error
  }
}

async function deductCredits(userId, amount) {
  if (process.env.BYPASS_RDS === "true") {
    return
  }

  try {
    await pool.query("UPDATE user_credits SET credits = credits - $1 WHERE user_id = $2", [amount, userId])
  } catch (error) {
    console.error("[RDS Error]:", error)
    throw error
  }
}

module.exports = { getUserCredits, deductCredits }
