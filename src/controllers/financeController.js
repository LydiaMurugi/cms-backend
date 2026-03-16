import pool from "../db.js";

// Get all contributions
export const getContributions = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contributions ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
};

// Get contributions for a member
export const getMemberContributions = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const result = await pool.query(
      "SELECT * FROM contributions WHERE member_id=$1 ORDER BY date DESC",
      [memberId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch member contributions" });
  }
};

// Add a contribution
export const addContribution = async (req, res) => {
  try {
    const { memberId, memberName, amount, date, category, method, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO contributions
        (member_id, member_name, amount, date, category, method, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [memberId, memberName, amount, date || new Date(), category, method, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contribution" });
  }
};

// Update contribution
export const updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, method, notes, date } = req.body;

    const result = await pool.query(
      `UPDATE contributions
       SET amount=$1, category=$2, method=$3, notes=$4, date=$5
       WHERE id=$6
       RETURNING *`,
      [amount, category, method, notes, date, id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Contribution not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update contribution" });
  }
};

// Delete contribution
export const deleteContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM contributions WHERE id=$1 RETURNING *", [id]);

    if (!result.rows[0]) return res.status(404).json({ error: "Contribution not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete contribution" });
  }
};