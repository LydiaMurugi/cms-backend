import pool from "../db.js"

export const getMemberDashboard = async (req, res) => {
  try {
    const userId = req.user.userId // from JWT

    // Upcoming program (next event)
    const programResult = await pool.query(`
      SELECT id, title, date, category
      FROM programs
      WHERE date >= CURRENT_DATE
      ORDER BY date ASC
      LIMIT 1
    `)

    // Giving summary (from contributions table)
    const givingResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM contributions
      WHERE member_id = $1
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `,
      [userId]
    )

    // Programs list
    const programsResult = await pool.query(`
      SELECT id, title, date, category
      FROM programs
      ORDER BY date DESC
      LIMIT 5
    `)

    // Resources list
    const resourcesResult = await pool.query(`
      SELECT id, title, created_at AS date, url
      FROM resources
      ORDER BY created_at DESC
      LIMIT 5
    `)

    res.json({
      upcomingService: programResult.rows[0] || null,
      givingSummary: {
        totalThisYear: givingResult.rows[0].total,
        currency: "USD",
      },
      programs: programsResult.rows,
      resources: resourcesResult.rows,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load dashboard" })
  }
}