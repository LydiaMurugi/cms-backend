import pool from "../db.js";

export const getDuties = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.name AS assigned_name
      FROM duties d
      LEFT JOIN users u ON u.id = d.assigned_id
      ORDER BY date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch duties" });
  }
};

export const createDuty = async (req, res) => {
  try {
    const { title, assigned_id, date, category, notes } = req.body;

    const result = await pool.query(
      `
      INSERT INTO duties (title, assigned_id, date, status, category, notes)
      VALUES ($1, $2, $3, 'Pending', $4, $5)
      RETURNING *
      `,
      [title, assigned_id, date, category, notes]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create duty" });
  }
};

export const updateDutyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE duties
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update duty" });
  }
};