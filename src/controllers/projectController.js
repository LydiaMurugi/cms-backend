import pool from "../db.js"

/* ================= GET ALL PROJECTS ================= */
export const getProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        status,
        progress,
        priority,
        start_date AS "startDate",
        end_date AS "endDate",
        assigned_to AS "assignedTo",
        budget,
        spent
      FROM projects
      ORDER BY start_date DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch projects" })
  }
}

/* ================= CREATE PROJECT ================= */
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      startDate,
      endDate,
      assignedTo,
      budget
    } = req.body

    const result = await pool.query(
      `
      INSERT INTO projects
      (title, description, status, progress, priority, start_date, end_date, assigned_to, budget, spent)
      VALUES ($1,$2,'To Do',0,$3,$4,$5,$6,$7,0)
      RETURNING *
      `,
      [title, description, priority, startDate, endDate, assignedTo, budget]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create project" })
  }
}
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const { status, progress, spent } = req.body

    const result = await pool.query(
      `
      UPDATE projects
      SET 
        status = COALESCE($1, status),
        progress = COALESCE($2, progress),
        spent = COALESCE($3, spent)
      WHERE id = $4
      RETURNING 
        id,
        title,
        description,
        status,
        progress,
        priority,
        start_date AS "startDate",
        end_date AS "endDate",
        assigned_to AS "assignedTo",
        budget,
        spent
      `,
      [status, progress, spent, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update project" })
  }
}
/* ================= DELETE PROJECT ================= */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params

    await pool.query(
      `DELETE FROM projects WHERE id = $1`,
      [id]
    )

    res.json({ message: "Project deleted" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to delete project" })
  }
}



