import db from "../lib/prisma.js";

export const getPrograms = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    const programs = await db.programs.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(programs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch programs" });
  }
};

export const createProgram = async (req, res) => {
  try {
    const { title, date, time, location, category, image } = req.body;
    const tenantId = req.headers['x-tenant-id'];

    const newProgram = await db.programs.create({
      data: {
        title,
        date: date ? new Date(date) : null,
        time,
        location,
        category,
        image,
        tenant_id: tenantId ? parseInt(tenantId) : null
      }
    });

    res.json(newProgram);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create program" });
  }
};
