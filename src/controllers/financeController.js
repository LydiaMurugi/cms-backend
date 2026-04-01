import db from "../lib/prisma.js";

// Helper to format contribution records to camelCase
const formatContribution = (c) => ({
  id: c.id,
  memberId: c.member_id,
  memberName: c.member_name,
  amount: c.amount,
  date: c.date,
  category: c.category,
  method: c.method,
  notes: c.notes,
  createdAt: c.created_at,
  tenantId: c.tenant_id
});

// Get all contributions
export const getContributions = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    const contributions = await db.contributions.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(contributions.map(formatContribution));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
};

// Get contributions for a member
export const getMemberContributions = async (req, res) => {
  try {
    const { memberId } = req.params;
    const tenantId = req.headers['x-tenant-id'];

    const contributions = await db.contributions.findMany({
      where: {
        member_id: parseInt(memberId),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(contributions.map(formatContribution));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch member contributions" });
  }
};

// Add a contribution
export const addContribution = async (req, res) => {
  try {
    const { memberId, memberName, amount, date, category, method, notes } = req.body;
    const tenantId = req.headers['x-tenant-id'];
    
    const newContribution = await db.contributions.create({
      data: {
        member_id: parseInt(memberId),
        member_name: memberName,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        category,
        method,
        notes,
        tenant_id: tenantId ? parseInt(tenantId) : null
      }
    });
    
    res.json(formatContribution(newContribution));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contribution" });
  }
};

// Update contribution
export const updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, method, notes, date } = req.body;
    const tenantId = req.headers['x-tenant-id'];

    const updatedContribution = await db.contributions.update({
      where: { 
        id: parseInt(id),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        category,
        method,
        notes,
        date: date ? new Date(date) : undefined
      }
    });

    res.json(formatContribution(updatedContribution));
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
        return res.status(404).json({ error: "Contribution not found" });
    }
    res.status(500).json({ error: "Failed to update contribution" });
  }
};

// Delete contribution
export const deleteContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'];
    
    await db.contributions.delete({
      where: { 
        id: parseInt(id),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
        return res.status(404).json({ error: "Contribution not found" });
    }
    res.status(500).json({ error: "Failed to delete contribution" });
  }
};
