// controllers/notificationController.js
import pool from '../db.js'          // your pg Pool instance
// (you could also import it as `import { pool } from '../db.js'` depending
//  on how you export it)

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;              // auth middleware sets req.user

    const result = await pool.query(
      `SELECT id, title, message, read, created_at
         FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
          SET read = true
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications
          SET read = true
        WHERE user_id = $1`,
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};