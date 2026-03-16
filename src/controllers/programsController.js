import pool from "../db.js";

export const getPrograms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM programs
      ORDER BY date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch programs" });
  }
};

export const createProgram = async (req, res) => {
  try {
    const { title, date, time, location, category, image } = req.body;

    const result = await pool.query(
      `
      INSERT INTO programs (title, date, time, location, category, image)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [title, date, time, location, category, image]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create program" });
  }
};