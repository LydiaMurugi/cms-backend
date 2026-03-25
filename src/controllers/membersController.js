import pool from '../db.js'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { sendInviteEmail } from '../services/emailService.js'

// GET ALL MEMBERS
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

// CREATE MEMBER (INVITE-BASED FLOW)
export const createMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      group,
      address = null,
      birthdate = null,
      sendInvite = true
    } = req.body

    let inviteToken = null
    let inviteExpires = null

    // 🔐 Generate invite token if needed
    if (sendInvite) {
      inviteToken = uuidv4()
      inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }

    // 🗄️ Insert user WITHOUT password
    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, phone, ministry_group, address, birthdate, role, status, invite_token, invite_expires)
      VALUES ($1, $2, $3, $4, $5, $6, 'member', 'Pending', $7, $8)
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
      [name, email, phone, group, address, birthdate, inviteToken, inviteExpires]
    )

    const newUser = result.rows[0]

    // 📧 Send invite email
    if (sendInvite) {
      await sendInviteEmail(email, inviteToken)
    }

    res.json(newUser)

  } catch (error) {
    console.error('Database Error:', error)

    if (error.code === '23505') {
      return res.status(400).json({ error: 'A member with this email already exists.' })
    }

    res.status(500).json({ error: 'Failed to create member' })
  }
}

// SET PASSWORD (FROM INVITE LINK)
export const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    // 🔍 Find user by token
    const result = await pool.query(
      `SELECT * FROM users WHERE invite_token = $1`,
      [token]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ error: 'Invalid token' })
    }

    // ⏳ Check if expired
    if (new Date(user.invite_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expired' })
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // ✅ Update user
    await pool.query(
      `
      UPDATE users
      SET password_hash=$1,
          invite_token=NULL,
          invite_expires=NULL,
          status='Active'
      WHERE id=$2
      `,
      [hashedPassword, user.id]
    )

    res.json({ message: 'Password set successfully' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to set password' })
  }
}

// UPDATE MEMBER
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
        birthdate
      `,
      [name, email, phone, group, status, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update member' })
  }
}

// DELETE MEMBER
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params

    await pool.query('DELETE FROM users WHERE id=$1', [id])

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete member' })
  }
}