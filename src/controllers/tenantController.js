import db from '../lib/prisma.js'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { sendInviteEmail } from '../services/emailService.js'

// Get all churches (Super Admin only)
export const getAllTenants = async (req, res) => {
    try {
        const tenants = await db.tenants.findMany({
            include: {
                users: {
                    where: { role: 'church-admin' },
                    take: 1,
                    select: { email: true }
                },
                _count: {
                    select: { users: true }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Format the response to match the previous SQL output
        const formattedTenants = tenants.map(t => ({
            ...t,
            admin_email: t.users[0]?.email || null,
            member_count: t._count.users,
            users: undefined,
            _count: undefined
        }));

        res.json(formattedTenants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
};

// Register a New Church + Initial Admin (Atomic Operation - Invite Based)
export const registerTenant = async (req, res) => {
    try {
        const { churchName, location, website, adminName, adminEmail } = req.body;

        // 1. Prepare Invite Token (valid for 24 hours)
        const inviteToken = uuidv4()
        const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

        const result = await db.$transaction(async (tx) => {
            // 2. Create the Tenant
            const tenant = await tx.tenants.create({
                data: {
                    name: churchName,
                    location,
                    website
                }
            });

            // 3. Create the Church Admin User (Invite-based)
            const admin = await tx.users.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    role: 'church-admin',
                    tenant_id: tenant.id,
                    status: 'Pending',
                    invite_token: inviteToken,
                    invite_expires: inviteExpires,
                    permissions: ['view_dashboard', 'manage_members', 'manage_finances', 'manage_settings']
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true
                }
            });

            return { tenant, admin };
        });

        // 4. Send the Invitation Email
        try {
            await sendInviteEmail(adminEmail, inviteToken);
        } catch (emailErr) {
            console.error('Church Admin Email failed to send:', emailErr);
        }

        res.status(201).json({
            message: 'Church registered and invitation sent successfully',
            tenant: { id: result.tenant.id, name: result.tenant.name },
            admin: result.admin
        });

    } catch (err) {
        console.error('Tenant Registration Error:', err);
        if (err.code === 'P2002') { // Unique violation for email
            return res.status(400).json({ error: 'Admin email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { churchName, location, status } = req.body;

        const updatedTenant = await db.tenants.update({
            where: { id: parseInt(id) },
            data: {
                name: churchName !== undefined ? churchName : undefined,
                location: location !== undefined ? location : undefined,
                status: status !== undefined ? status : undefined
            }
        });

        res.json(updatedTenant);
    } catch (err) {
        console.error(err);
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Church not found' });
        }
        res.status(500).json({ error: 'Update failed' });
    }
};

export const deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = parseInt(id);

        await db.$transaction(async (tx) => {
            // 1. Check if church exists
            const tenant = await tx.tenants.findUnique({
                where: { id: tenantId },
                select: { name: true }
            });

            if (!tenant) {
                throw new Error('NOT_FOUND');
            }

            // 2. Delete all related data (Cleanup)
            
            // Delete duties assigned to members of this tenant
            await tx.duties.deleteMany({
                where: {
                    users: {
                        tenant_id: tenantId
                    }
                }
            });

            // Delete all users belonging to this tenant
            await tx.users.deleteMany({
                where: { tenant_id: tenantId }
            });

            // 3. Delete the Tenant itself
            await tx.tenants.delete({
                where: { id: tenantId }
            });
            
            return tenant.name;
        });

        res.json({ success: true, message: 'Church and all associated data removed successfully' });

    } catch (err) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Church not found' });
        }
        console.error('Church Deletion Error:', err);
        res.status(500).json({ error: 'Failed to delete church. There may be unhandled data dependencies.' });
    }
};
