import pool from '../db.js'

export const getMembers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        ministry_group AS "group",
        status,
        joined,
        address,
        birthdate
      FROM users
      ORDER BY id DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
}
export const createMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      group,
      address,
      birthdate,
    } = req.body

    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, phone, ministry_group, address, birthdate, role)
      VALUES ($1,$2,$3,$4,$5,$6,'member')
      RETURNING
        id,
        name,
        email,
        phone,
        ministry_group AS "group",
        status,
        joined,
        address,
        birthdate
    `,
      [name, email, phone, group, address, birthdate]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create member' })
  }
}
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, group, status } = req.body

    const result = await pool.query(
      `
      UPDATE users
      SET
        name=$1,
        email=$2,
        phone=$3,
        ministry_group=$4,
        status=$5
      WHERE id=$6
      RETURNING
        id,
        name,
        email,
        phone,
        ministry_group AS "group",
        status,
        joined,
        address,
        birthdatea
    `,
      [name, email, phone, group, status, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member' })
  }
}
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params

    await pool.query('DELETE FROM users WHERE id=$1', [id])

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete member' })
  }
}
