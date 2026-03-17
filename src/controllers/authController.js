import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    const result = await pool.query(
      `SELECT id, name, email, phone, avatar, created_at, role, tenant_id, permissions
       FROM users
       WHERE id = $1`,
      [userId]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Map DB column names to frontend camelCase
    res.json({
      ...user,
      tenantId: user.tenant_id
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await pool.query(
      `SELECT id, name, email, phone, avatar, created_at, role, password_hash, tenant_id, permissions
       FROM users
       WHERE email = $1`,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }

    const user = result.rows[0]

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Token now includes tenantId for backend scoping
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tenantId: user.tenant_id
        
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        avatar: user.avatar || null,
        created_at: user.created_at,
        role: user.role,
        tenantId: user.tenant_id,
        permissions: user.permissions
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const register = async (req, res) => {
  try {
    // Added tenantId and permissions to the registration body
    const { name, email, password, role, tenantId, permissions } = req.body

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, tenant_id, permissions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, avatar, created_at, role, tenant_id, permissions`,
      [name, email, passwordHash, role || 'member', tenantId || null, JSON.stringify(permissions || [])]
    )

    const user = result.rows[0]

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        avatar: user.avatar || null,
        created_at: user.created_at,
        role: user.role,
        tenantId: user.tenant_id,
        permissions: user.permissions
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { name, email, phone } = req.body

    if (email) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      )
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    const result = await pool.query(
      `UPDATE users
          SET name = COALESCE($1, name),
              email = COALESCE($2, email),
              phone = COALESCE($3, phone)
        WHERE id = $4
        RETURNING id, name, email, phone, avatar, created_at, role, tenant_id, permissions`,
      [name, email, phone, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updatedUser = result.rows[0]

    res.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || null,
        avatar: updatedUser.avatar || null,
        created_at: updatedUser.created_at,
        role: updatedUser.role,
        tenantId: updatedUser.tenant_id,
        permissions: updatedUser.permissions
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}