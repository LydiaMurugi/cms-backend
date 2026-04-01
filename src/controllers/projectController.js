import db from "../lib/prisma.js"

/* ================= GET ALL PROJECTS ================= */
export const getProjects = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    const projects = await db.projects.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      orderBy: {
        start_date: 'desc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        comments: true,
        status: true,
        progress: true,
        priority: true,
        start_date: true,
        end_date: true,
        assigned_to: true,
        budget: true,
        spent: true
      }
    });

    // Map to camelCase for the response to match the previous SQL output
    const formattedProjects = projects.map(p => ({
      ...p,
      startDate: p.start_date,
      endDate: p.end_date,
      assignedTo: p.assigned_to,
      start_date: undefined,
      end_date: undefined,
      assigned_to: undefined
    }));

    res.json(formattedProjects)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch projects" })
  }
}

/* ================= CREATE PROJECT ================= */
export const createProject = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const {
      title,
      description,
      priority,
      startDate,
      endDate,
      assignedTo,
      budget
    } = req.body

    const newProject = await db.projects.create({
      data: {
        title,
        description,
        comments: [], // Initialize empty array for JSON field
        status: 'To Do',
        progress: 0,
        priority,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        assigned_to: assignedTo,
        budget: budget ? parseFloat(budget) : null,
        spent: 0,
        tenant_id: tenantId ? parseInt(tenantId) : null
      }
    });

    res.status(201).json(newProject)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create project" })
  }
}

/* ================= UPDATE PROJECT ================= */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const tenantId = req.headers['x-tenant-id'];
    const { status, progress, spent, comments } = req.body

    const updatedProject = await db.projects.update({
      where: { 
        id: parseInt(id),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      data: {
        status: status !== undefined ? status : undefined,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        spent: spent !== undefined ? parseFloat(spent) : undefined,
        comments: comments !== undefined ? comments : undefined
      },
      select: {
        id: true,
        title: true,
        description: true,
        comments: true,
        status: true,
        progress: true,
        priority: true,
        start_date: true,
        end_date: true,
        assigned_to: true,
        budget: true,
        spent: true
      }
    });

    // Map to camelCase for the response
    const formattedProject = {
      ...updatedProject,
      startDate: updatedProject.start_date,
      endDate: updatedProject.end_date,
      assignedTo: updatedProject.assigned_to,
      start_date: undefined,
      end_date: undefined,
      assigned_to: undefined
    };

    res.json(formattedProject)
  } catch (error) {
    console.error(error)
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Project not found" });
    }
    res.status(500).json({ error: "Failed to update project" })
  }
}

/* ================= DELETE PROJECT ================= */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params
    const tenantId = req.headers['x-tenant-id'];

    await db.projects.delete({
      where: { 
        id: parseInt(id),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      }
    })

    res.json({ message: "Project deleted" })
  } catch (error) {
    console.error(error)
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Project not found" });
    }
    res.status(500).json({ error: "Failed to delete project" })
  }
}
