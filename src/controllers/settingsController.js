import db from '../lib/prisma.js';

export const saveSettings = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id']; // Provided by our Axios interceptor
        const { churchName, email, currency, taxId, primaryColor } = req.body;

        if (tenantId) {
            // SCENARIO A: Update Church-Specific Settings
            const updatedTenant = await db.tenants.update({
                where: { id: parseInt(tenantId) },
                data: {
                    name: churchName,
                    email,
                    currency,
                    tax_id: taxId,
                    primary_color: primaryColor
                }
            });
            return res.json(updatedTenant);
        } else {
            // SCENARIO B: Update Global Platform Settings
            // You would typically have a 'system_settings' table for this
            console.log("Global platform settings update requested:", req.body);
            return res.json({ message: "Global settings updated (Mock)" });
        }
    } catch (err) {
        console.error(err);
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.status(500).json({ error: 'Failed to save settings' });
    }
};

export const getSettings = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (tenantId) {
            const tenant = await db.tenants.findUnique({
                where: { id: parseInt(tenantId) },
                select: {
                    name: true,
                    email: true,
                    currency: true,
                    tax_id: true,
                    primary_color: true
                }
            });

            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Map to the expected response format
            return res.json({
                churchName: tenant.name,
                email: tenant.email,
                currency: tenant.currency,
                taxId: tenant.tax_id,
                primaryColor: tenant.primary_color
            });
        }
        res.json({ churchName: "Platform Global", email: "admin@platform.com" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};
