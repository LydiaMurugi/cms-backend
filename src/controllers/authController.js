import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from "../lib/prisma.js"
import { v4 as uuidv4 } from 'uuid'
import { sendInviteEmail } from '../services/emailService.js'

export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const result = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        created_at: true,
        role: true,
        tenant_id: true,
        permissions: true
      }
    })

    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json(result);
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await db.users.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' })
    }

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
    const { name, email, role, tenantId, permissions, sendInvite = true } = req.body

    // 1. Check if user already exists
    const existing = await db.users.findUnique({
      where: { email }
    })

    if (existing) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // 2. Prepare Invite Token (valid for 24 hours)
    let inviteToken = null
    let inviteExpires = null

    if (sendInvite) {
      inviteToken = uuidv4()
      inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    // 3. Create User with 'Pending' status and NO password
    const user = await db.users.create({
      data: {
        name,
        email,
        role: role || 'member',
        tenant_id: tenantId || null,
        permissions: permissions || [],
        status: 'Pending',
        invite_token: inviteToken,
        invite_expires: inviteExpires
      }
    })

    // 4. Trigger Resend Email
    if (sendInvite && inviteToken) {
      try {
        await sendInviteEmail(email, inviteToken)
      } catch (emailErr) {
        console.error('Email failed to send, but user was created:', emailErr)
      }
    }

    // 5. Respond
    res.status(201).json({
      message: 'Invitation sent successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        tenantId: user.tenant_id
      },
    })
  } catch (error) {
    console.error('Registration/Invite Error:', error)
    res.status(500).json({ error: 'Failed to process invitation' })
  }
}

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { name, email, phone } = req.body

    if (email) {
      const existing = await db.users.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      })
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: updateData
    })

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
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' })
    }
    res.status(500).json({ error: 'Failed to update profile' })
  }
}
