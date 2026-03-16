import pool from "../db.js"

export const getResources = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        url,
        uploaded_by AS "uploadedBy",
        created_at AS "createdAt"
      FROM resources
      ORDER BY created_at DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch resources" })
  }
}

export const uploadResource = async (req, res) => {
  try {
    const { title } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: "File is required" })
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`

    const result = await pool.query(
      `
      INSERT INTO resources (title, url, uploaded_by)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        title,
        url,
        uploaded_by AS "uploadedBy",
        created_at AS "createdAt"
      `,
      [title, fileUrl, req.user?.id || 1] // fallback for testing
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to upload resource" })
  }
}