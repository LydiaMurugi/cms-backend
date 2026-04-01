import db from "../lib/prisma.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; 
    const tenantId = req.headers['x-tenant-id'];

    const notifications = await db.notifications.findMany({
      where: {
        user_id: parseInt(userId),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      select: {
        id: true,
        title: true,
        message: true,
        read: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'];

    const result = await db.notifications.updateMany({
      where: {
        id: parseInt(id),
        user_id: parseInt(userId),
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      data: {
        read: true
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await db.notifications.findUnique({
        where: { id: parseInt(id) }
    });

    res.json({ notification: updatedNotification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const tenantId = req.headers['x-tenant-id'];

    await db.notifications.updateMany({
      where: {
        user_id: parseInt(userId),
        tenant_id: tenantId ? parseInt(tenantId) : undefined,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};
