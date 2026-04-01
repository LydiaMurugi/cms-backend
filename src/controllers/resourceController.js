import db from "../lib/prisma.js"

export const getResources = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    const resources = await db.resources.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        title: true,
        url: true,
        uploaded_by: true,
        created_at: true
      }
    });

    // Map to camelCase for the response
    const formattedResources = resources.map(r => ({
      id: r.id,
      title: r.title,
      url: r.url,
      uploadedBy: r.uploaded_by,
      createdAt: r.created_at
    }));

    res.json(formattedResources)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch resources" })
  }
}

/**
 * Handle resource creation from a JSON payload.
 * Frontend uploads to Cloudinary and sends the resulting URL here.
 */
export const uploadResource = async (req, res) => {
  try {
    const { title, url, fileUrl } = req.body
    const tenantId = req.headers['x-tenant-id'];

    // Support both 'url' and 'fileUrl' keys from frontend
    const finalUrl = url || fileUrl

    if (!finalUrl) {
      return res.status(400).json({ error: "Resource URL is required" })
    }

    const userId = req.user?.userId || req.user?.id || 1; // consistent fallback

    const newResource = await db.resources.create({
      data: {
        title: title || 'Untitled Resource',
        url: finalUrl,
        uploaded_by: parseInt(userId),
        tenant_id: tenantId ? parseInt(tenantId) : null
      },
      select: {
        id: true,
        title: true,
        url: true,
        uploaded_by: true,
        created_at: true
      }
    });

    res.status(201).json({
      id: newResource.id,
      title: newResource.title,
      url: newResource.url,
      uploadedBy: newResource.uploaded_by,
      createdAt: newResource.created_at
    })
  } catch (error) {
    console.error('Resource Creation Error:', error)
    res.status(500).json({ error: "Failed to save resource info" })
  }
}
