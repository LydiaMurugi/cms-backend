import db from "../lib/prisma.js"

export const getMemberDashboard = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id 
    const tenantId = req.headers['x-tenant-id'];

    const now = new Date();
    const currentYear = now.getFullYear();

    // 1. Fetch member's specific pending/active duties
    const myDuties = await db.duties.findMany({
      where: {
        assigned_id: parseInt(userId),
        tenant_id: tenantId ? parseInt(tenantId) : undefined,
        status: { in: ['Pending', 'In Progress', 'Blocked'] }
      },
      orderBy: { date: 'asc' },
      take: 5
    });

    // 2. Upcoming program (next event)
    const upcomingService = await db.programs.findFirst({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined,
        date: {
          gte: now
        }
      },
      select: {
        id: true,
        title: true,
        date: true,
        category: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // 3. Giving summary (from contributions table)
    const givingAggregate = await db.contributions.aggregate({
      where: {
        member_id: parseInt(userId),
        tenant_id: tenantId ? parseInt(tenantId) : undefined,
        date: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      },
      _sum: {
        amount: true
      }
    });

    // 4. Programs list
    const programs = await db.programs.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      select: {
        id: true,
        title: true,
        date: true,
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 5
    });

    // 5. Resources list
    const resources = await db.resources.findMany({
      where: {
        tenant_id: tenantId ? parseInt(tenantId) : undefined
      },
      select: {
        id: true,
        title: true,
        created_at: true,
        url: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    // Format resources to match previous output (created_at AS date)
    const formattedResources = resources.map(r => ({
      id: r.id,
      title: r.title,
      date: r.created_at,
      url: r.url
    }));

    res.json({
      upcomingService: upcomingService || null,
      givingSummary: {
        totalThisYear: givingAggregate._sum.amount || 0,
        currency: "USD",
      },
      myDuties: myDuties,
      programs: programs,
      resources: formattedResources,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load dashboard" })
  }
}
