import db from "../lib/prisma.js";

// 1. GET ALL DUTIES (Scoped by Tenant)
export const getDuties = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']; // Provided by axios interceptor

    const duties = await db.duties.findMany({
      where: {
        // Filter by tenant to ensure data isolation
        tenant_id: tenantId ? parseInt(tenantId) : undefined 
      },
      include: {
        users: {
          select: { name: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    const formattedDuties = duties.map(duty => ({
      ...duty,
      assigned_name: duty.users ? duty.users.name : 'Unassigned',
      users: undefined
    }));

    res.json(formattedDuties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch duties" });
  }
};

// 2. CREATE DUTY
export const createDuty = async (req, res) => {
  try {
    const { title, assigned_id, date, category, notes, status } = req.body;
    const tenantId = req.headers['x-tenant-id'];

    const newDuty = await db.duties.create({
      data: {
        title,
        assigned_id: assigned_id ? parseInt(assigned_id) : null,
        tenant_id: tenantId ? parseInt(tenantId) : null,
        date: date ? new Date(date) : null,
        status: status || 'Pending',
        category: category || 'General',
        notes,
        comments: [] // Initialize empty array for JSON field
      },
      include: {
        users: { select: { name: true } }
      }
    });

    // Return with assigned_name for immediate UI update
    res.json({
      ...newDuty,
      assigned_name: newDuty.users ? newDuty.users.name : 'Unassigned',
      users: undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create duty" });
  }
};

// 3. GENERAL UPDATE (For Reassignment and Drag & Drop Status)
export const updateDuty = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assigned_id, date, category, notes, status, comments } = req.body;

    const updatedDuty = await db.duties.update({
      where: { id: parseInt(id) },
      data: {
        title,
        assigned_id: assigned_id ? parseInt(assigned_id) : null,
        date: date ? new Date(date) : undefined,
        status,
        category,
        notes,
        comments: comments !== undefined ? comments : undefined
      },
      include: {
        users: { select: { name: true } }
      }
    });

    res.json({
      ...updatedDuty,
      assigned_name: updatedDuty.users ? updatedDuty.users.name : 'Unassigned',
      users: undefined
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Duty not found" });
    }
    res.status(500).json({ error: "Failed to update duty" });
  }
};

// 4. SUBMIT REPORT (Specifically for the "Done" workflow)
export const submitReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updatedDuty = await db.duties.update({
      where: { id: parseInt(id) },
      data: {
        notes,
        status: 'Submitted',
        report_submitted: true
      }
    });

    res.json(updatedDuty);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Duty not found" });
    }
    res.status(500).json({ error: "Failed to submit report" });
  }
};

// 5. DELETE DUTY
export const deleteDuty = async (req, res) => {
  try {
    const { id } = req.params;
    await db.duties.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Duty not found" });
    }
    res.status(500).json({ error: "Failed to delete duty" });
  }
};
