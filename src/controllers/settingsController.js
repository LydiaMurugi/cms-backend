import pool from '../db.js';

export const saveSettings = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id']; // Provided by our Axios interceptor
        const { churchName, email, currency, taxId, primaryColor } = req.body;

        if (tenantId) {
            // SCENARIO A: Update Church-Specific Settings
            const result = await pool.query(
                `UPDATE tenants 
                 SET name = $1, email = $2, currency = $3, tax_id = $4, primary_color = $5
                 WHERE id = $6 RETURNING *`,
                [churchName, email, currency, taxId, primaryColor, tenantId]
            );
            return res.json(result.rows[0]);
        } else {
            // SCENARIO B: Update Global Platform Settings
            // You would typically have a 'system_settings' table for this
            console.log("Global platform settings update requested:", req.body);
            return res.json({ message: "Global settings updated (Mock)" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
};

export const getSettings = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (tenantId) {
            const result = await pool.query(
                'SELECT name as "churchName", email, currency, tax_id as "taxId", primary_color as "primaryColor" FROM tenants WHERE id = $1',
                [tenantId]
            );
            return res.json(result.rows[0]);
        }
        res.json({ churchName: "Platform Global", email: "admin@platform.com" });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};