import db from "../lib/prisma.js"
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { sendInviteEmail } from '../services/emailService.js'

// GET ALL MEMBERS
export const getMembers = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    const members = await db.users.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined,
        role: 'member'
      },
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ministry_group: true,
        status: true,
        joined: true,
        address: true,
        birthdate: true
      }
    })

    // Map ministry_group to group for the response
    const formattedMembers = members.map(m => ({
      ...m,
      group: m.ministry_group,
      ministry_group: undefined
    }))

    res.json(formattedMembers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
}

// CREATE MEMBER (INVITE-BASED FLOW)
export const createMember = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
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
    const newUser = await db.users.create({
      data: {
        name,
        email,
        phone,
        ministry_group: group,
        address,
        birthdate: birthdate ? new Date(birthdate) : null,
        role: 'member',
        status: 'Pending',
        tenant_id: tenantId ? parseInt(tenantId) : null,
        invite_token: inviteToken,
        invite_expires: inviteExpires
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ministry_group: true,
        status: true,
        joined: true,
        address: true,
        birthdate: true
      }
    })

    // 📧 Send invite email
    if (sendInvite && inviteToken) {
      await sendInviteEmail(email, inviteToken)
    }

    res.json({
      ...newUser,
      group: newUser.ministry_group,
      ministry_group: undefined
    })

  } catch (error) {
    console.error('Database Error:', error)

    if (error.code === 'P2002') {
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
    const user = await db.users.findFirst({
      where: { invite_token: token }
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid token' })
    }

    // ⏳ Check if expired
    if (user.invite_expires && new Date(user.invite_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expired' })
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // ✅ Update user and their tenant (if they are a church-admin) atomically
    const updatedUser = await db.$transaction(async (tx) => {
      const u = await tx.users.update({
        where: { id: user.id },
        data: {
          password_hash: hashedPassword,
          invite_token: null,
          invite_expires: null,
          status: 'Active'
        }
      })

      if (u.role === 'church-admin' && u.tenant_id) {
        await tx.tenants.update({
          where: { id: u.tenant_id },
          data: { status: 'Active' }
        })
      }

      return u
    })

    res.json({
      message: 'Password set successfully',
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        tenantId: updatedUser.tenant_id,
        status: updatedUser.status
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to set password' })
  }
}

// UPDATE MEMBER
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params
    const tenantId = req.headers['x-tenant-id'];
    const { name, email, phone, group, status } = req.body

    const updatedUser = await db.users.update({
      where: { 
        id: parseInt(id),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      data: {
        name,
        email,
        phone,
        ministry_group: group,
        status
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ministry_group: true,
        status: true,
        joined: true,
        address: true,
        birthdate: true
      }
    })

    res.json({
      ...updatedUser,
      group: updatedUser.ministry_group,
      ministry_group: undefined
    })
  } catch (error) {
    console.error(error)
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Member not found' })
    }
    res.status(500).json({ error: 'Failed to update member' })
  }
}

// DELETE MEMBER
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params
    const tenantId = req.headers['x-tenant-id'];

    await db.users.delete({
      where: { 
        id: parseInt(id),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Member not found' })
    }
    res.status(500).json({ error: 'Failed to delete member' })
  }
}
