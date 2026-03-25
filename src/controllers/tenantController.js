 import pool from '../db.js'
 import bcrypt from 'bcrypt'
   
  // Get all churches (Super Admin only)
  export const getAllTenants = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, 
                (SELECT email FROM users u WHERE u.tenant_id = t.id AND u.role = 'church-admin' LIMIT 1) as admin_email,
                (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as member_count
             FROM tenants t
             ORDER BY t.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
};
  
 // Register a New Church + Initial Admin (Atomic Operation)
 export const registerTenant = async (req, res) => {
      const client = await pool.connect();
     try {
         const { churchName, location, website, adminName, adminEmail, initialPassword } = req.body;

      await client.query('BEGIN');

        // 1. Create the Tenant
        const tenantResult = await client.query(
            'INSERT INTO tenants (name, location, website) VALUES ($1, $2, $3) RETURNING id',
            [churchName, location, website]
        );
        const tenantId = tenantResult.rows[0].id;

       // 2. Hash the admin password
          const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(initialPassword, salt);

          // 3. Create the Church Admin User
        const userResult = await client.query(
               `INSERT INTO users (name, email, password_hash, role, tenant_id, permissions) 
               VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, email`,
              [
                adminName,
                adminEmail,
                hashedPassword,
                'church-admin',
                tenantId,
                JSON.stringify(['view_dashboard', 'manage_members', 'manage_finances', 'manage_settings'])
             ]
         );

        await client.query('COMMIT');
  
    res.status(201).json({
              message: 'Church and Admin registered successfully',
               tenant: { id: tenantId, name: churchName },
               admin: userResult.rows[0]
          });
  
     } catch (err) {
         await client.query('ROLLBACK');
         console.error(err);
         if (err.code === '23505') { // Unique violation for email
             return res.status(400).json({ error: 'Admin email already exists' });
         }
         res.status(500).json({ error: 'Registration failed' });
      } finally {
        client.release();
        }
    };
    export const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { churchName, location, status } = req.body;

        const result = await pool.query(
            `UPDATE tenants 
             SET name = COALESCE($1, name),
                 location = COALESCE($2, location),
                 status = COALESCE($3, status)
             WHERE id = $4
             RETURNING *`,
            [churchName, location, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Church not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
};