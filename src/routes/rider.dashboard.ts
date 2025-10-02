// src/routes/rider.dashboard.ts
import { Router } from "express";
import prisma from "../config/db";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { startOfToday, endOfToday, startOfWeek, endOfWeek } from "../utils/dates";

const router = Router();

// All endpoints below require Rider role
router.use(authenticate(["RIDER"]));

/**
 * 1) Rider profile (greeting)
 * GET api/rider/me
 */
router.get("/me", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
  });
  res.json({ rider, greeting: `Welcome, ${rider?.firstName ?? "Rider"}` });
});

/**
 * 2) Dashboard summary cards
 * GET /rider/dashboard/summary
 * Returns: todayEarnings, ordersCompletedToday, avgRating, onlineTimeMinutesToday
 */
router.get("/dashboard/summary", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  // earnings today (sum of riderPayout on delivered orders today)
  const earningsAgg = await prisma.order.aggregate({
    _sum: { riderPayout: true },
    where: {
      riderId,
      status: "DELIVERED",
      deliveredAt: { gte: todayStart, lte: todayEnd },
    },
  });

  // completed orders today
  const completedCount = await prisma.order.count({
    where: {
      riderId,
      status: "DELIVERED",
      deliveredAt: { gte: todayStart, lte: todayEnd },
    },
  });

  // average rating overall (or restrict to this week if you want)
  const ratingAgg = await prisma.rating.aggregate({
    _avg: { score: true },
    where: { riderId },
  });

  // online time today (sum of session durations)
  const sessions = await prisma.riderOnlineSession.findMany({
    where: { riderId, startedAt: { lte: todayEnd }, OR: [{ endedAt: { gte: todayStart } }, { endedAt: null }] },
  });

  const now = new Date();



const onlineMs = sessions.reduce((sum: number, s: typeof sessions[number]): number => {
  const start = s.startedAt < todayStart ? todayStart : s.startedAt;
  const end = s.endedAt ?? new Date();
  const clampedEnd = end > todayEnd ? todayEnd : end;
  const diff = Math.max(0, clampedEnd.getTime() - start.getTime());
  return sum + diff;
}, 0);



  res.json({
    todayEarnings: earningsAgg._sum.riderPayout ?? 0,
    ordersCompletedToday: completedCount,
    avgRating: ratingAgg._avg.score ?? 0,
    onlineTimeMinutesToday: Math.round(onlineMs / 60000),
  });
});

/**
 * 3) Active orders (ASSIGNED or PICKED_UP)
 * GET /rider/orders/active
 */
router.get("/orders/active", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const active = await prisma.order.findMany({
    where: { riderId, status: { in: ["ASSIGNED", "PICKED_UP"] } },
    orderBy: { assignedAt: "desc" },
    include: {
      restaurant: true,
      items: true,
    },
  });
  res.json(active);
});

/**
 * 4) Recent activity (last N delivered orders)
 * GET /rider/orders/recent?limit=10
 */
router.get("/orders/recent", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const limit = Number(req.query.limit ?? 10);
  const recent = await prisma.order.findMany({
    where: { riderId, status: "DELIVERED" },
    orderBy: { deliveredAt: "desc" },
    take: limit,
    include: {
      restaurant: true,
      items: true,
    },
  });
  res.json(recent);
});

/**
 * 5) Manage orders
 *    a) Active tab -> same as /orders/active
 *    b) Completed tab -> /orders/completed
 * GET /rider/orders/completed?from=ISO&to=ISO
 */
// router.get("/orders/completed", async (req: AuthRequest, res) => {
//   const riderId = req.user!.id as number;
//   const from = req.query.from ? new Date(String(req.query.from)) : startOfWeek();
//   const to = req.query.to ? new Date(String(req.query.to)) : endOfWeek();

//   const completed = await prisma.order.findMany({
//     where: {
//       riderId,
//       status: "DELIVERED",
//       deliveredAt: { gte: from, lte: to },
//     },
//     orderBy: { deliveredAt: "desc" },
//     include: {
//       restaurant: true,
//       items: true,
//       ratings: true,
//     },
//   });

//   res.json(completed);
// });



router.get("/orders/completed", async (req: AuthRequest, res) => {
  try {
    // ✅ helper to handle invalid dates
    function safeDate(input: any, fallback: Date): Date {
      const d = new Date(input);
      return isNaN(d.getTime()) ? fallback : d;
    }

    // ✅ validate query params or fallback to week range
    const from = req.query.from
      ? safeDate(req.query.from, startOfWeek())
      : startOfWeek();

    const to = req.query.to
      ? safeDate(req.query.to, endOfWeek())
      : endOfWeek();

    // ✅ now safe to use in Prisma
    const completed = await prisma.order.findMany({
      where: {
        riderId: req.user.id, // 🔥 use logged-in rider instead of hardcoded 8
        status: "DELIVERED",
        deliveredAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        deliveredAt: "desc",
      },
      include: {
        restaurant: true,
        items: true,
        ratings: true,
      },
    });

    res.json(completed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


/**
 * 6) Earnings overview
 * GET /rider/earnings/summary?weeklyGoal=10000
 * Returns: todayTotal, weekTotal, weeklyGoalPct, avgPerHour
 */
router.get("/earnings/summary", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();

  const weeklyGoal = Number(req.query.weeklyGoal ?? 10000); // PKR or your currency

  // Today total
  const todayAgg = await prisma.order.aggregate({
    _sum: { riderPayout: true },
    where: { riderId, status: "DELIVERED", deliveredAt: { gte: todayStart, lte: todayEnd } },
  });

  // This week total
  const weekAgg = await prisma.order.aggregate({
    _sum: { riderPayout: true },
    where: { riderId, status: "DELIVERED", deliveredAt: { gte: weekStart, lte: weekEnd } },
  });

  // Active hours this week from sessions
  const sessions = await prisma.riderOnlineSession.findMany({
    where: { riderId, startedAt: { lte: weekEnd }, OR: [{ endedAt: { gte: weekStart } }, { endedAt: null }] },
  });
  const now = new Date();
 const ms = sessions.reduce((sum: number, s: typeof sessions[number]): number => {
  const start = s.startedAt < weekStart ? weekStart : s.startedAt;
  const end = s.endedAt ?? now;
  const clampedEnd = end > weekEnd ? weekEnd : end;
  const diff = Math.max(0, clampedEnd.getTime() - start.getTime());
  return sum + diff;
}, 0);
  const hours = ms / (1000 * 60 * 60);

  const weekTotal = Number(weekAgg._sum.riderPayout ?? 0);
  const avgPerHour = hours > 0 ? weekTotal / hours : 0;
  const weeklyGoalPct = weeklyGoal > 0 ? Math.min(100, Math.round((weekTotal / weeklyGoal) * 100)) : 0;

  res.json({
    todayTotal: Number(todayAgg._sum.riderPayout ?? 0),
    weekTotal,
    weeklyGoal,
    weeklyGoalPct,
    activeHoursThisWeek: Number(hours.toFixed(2)),
    avgPerHour: Number(avgPerHour.toFixed(2)),
  });
});

/**
 * 7) Hourly breakdown (today)
 * GET /rider/earnings/hourly
 * Returns array [{ hour: "09:00-10:00", orders: n, earnings: x }]
 */
router.get("/earnings/hourly", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const dayStart = startOfToday();
  const dayEnd = endOfToday();

  const delivered = await prisma.order.findMany({
    where: { riderId, status: "DELIVERED", deliveredAt: { gte: dayStart, lte: dayEnd } },
    select: { deliveredAt: true, riderPayout: true },
    orderBy: { deliveredAt: "asc" },
  });

  // group by hour
  const buckets: Record<string, { orders: number; earnings: number }> = {};
  for (const o of delivered) {
    const d = o.deliveredAt!;
    const hourStart = new Date(d);
    hourStart.setMinutes(0, 0, 0);
    const label = `${hourStart.getHours().toString().padStart(2, "0")}:00-${(hourStart.getHours() + 1)
      .toString()
      .padStart(2, "0")}:00`;
    if (!buckets[label]) buckets[label] = { orders: 0, earnings: 0 };
    buckets[label].orders += 1;
    buckets[label].earnings += Number(o.riderPayout);
  }

  const result = Object.entries(buckets).map(([hour, v]) => ({ hour, ...v }));
  res.json(result);
});

/**
 * 8) Weekly breakdown (Mon–Sun)
 * GET /rider/earnings/weekly
 * Returns array [{ day: "Mon", orders: n, earnings: x }]
 */
router.get("/earnings/weekly", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();

  const delivered = await prisma.order.findMany({
    where: { riderId, status: "DELIVERED", deliveredAt: { gte: weekStart, lte: weekEnd } },
    select: { deliveredAt: true, riderPayout: true },
    orderBy: { deliveredAt: "asc" },
  });

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, { orders: number; earnings: number }> = {
    Mon: { orders: 0, earnings: 0 },
    Tue: { orders: 0, earnings: 0 },
    Wed: { orders: 0, earnings: 0 },
    Thu: { orders: 0, earnings: 0 },
    Fri: { orders: 0, earnings: 0 },
    Sat: { orders: 0, earnings: 0 },
    Sun: { orders: 0, earnings: 0 },
  };

  for (const o of delivered) {
    const dName = weekday[o.deliveredAt!.getDay()];
    const key = dName;
    if (!buckets[key]) buckets[key] = { orders: 0, earnings: 0 };
    buckets[key].orders += 1;
    buckets[key].earnings += Number(o.riderPayout);
  }

  const orderedKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const result = orderedKeys.map((k) => ({ day: k, ...buckets[k] }));
  res.json(result);
});

/**
 * Online status controls (optional helpers for frontend)
 * POST /rider/status/online   -> starts a session
 * POST /rider/status/offline  -> ends the latest open session
 */
router.post("/status/online", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const open = await prisma.riderOnlineSession.findFirst({
    where: { riderId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (open) return res.status(400).json({ message: "Already online" });

  const session = await prisma.riderOnlineSession.create({
    data: { riderId },
  });
  res.json(session);
});

router.post("/status/offline", async (req: AuthRequest, res) => {
  const riderId = req.user!.id as number;
  const open = await prisma.riderOnlineSession.findFirst({
    where: { riderId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!open) return res.status(400).json({ message: "No active session" });

  const closed = await prisma.riderOnlineSession.update({
    where: { id: open.id },
    data: { endedAt: new Date() },
  });
  res.json(closed);
});


/**
 * 9) Combined Dashboard API
 * GET /rider/dashboard
 * Returns: { summary, activeOrders, recentOrders }
 */
router.get("/dashboard", async (req: AuthRequest, res) => {
  try {
    const riderId = req.user!.id as number;

    // 1) Summary
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const earningsAgg = await prisma.order.aggregate({
      _sum: { riderPayout: true },
      where: {
        riderId,
        status: "DELIVERED",
        deliveredAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const completedCount = await prisma.order.count({
      where: {
        riderId,
        status: "DELIVERED",
        deliveredAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const ratingAgg = await prisma.rating.aggregate({
      _avg: { score: true },
      where: { riderId },
    });

    const sessions = await prisma.riderOnlineSession.findMany({
      where: {
        riderId,
        startedAt: { lte: todayEnd },
        OR: [{ endedAt: { gte: todayStart } }, { endedAt: null }],
      },
    });

    const now = new Date();
    const onlineMs = sessions.reduce((sum: number, s: typeof sessions[number]): number => {
      const start = s.startedAt < todayStart ? todayStart : s.startedAt;
      const end = s.endedAt ?? now;
      const clampedEnd = end > todayEnd ? todayEnd : end;
      const diff = Math.max(0, clampedEnd.getTime() - start.getTime());
      return sum + diff;
    }, 0);

    const summary = {
      todayEarnings: earningsAgg._sum.riderPayout ?? 0,
      ordersCompletedToday: completedCount,
      avgRating: ratingAgg._avg.score ?? 0,
      onlineTimeMinutesToday: Math.round(onlineMs / 60000),
    };

    // 2) Active Orders
    const activeOrders = await prisma.order.findMany({
      where: { riderId, status: { in: ["ASSIGNED", "PICKED_UP"] } },
      orderBy: { assignedAt: "desc" },
      include: {
        restaurant: true,
        items: true,
      },
    });

    // 3) Recent Orders
    const recentOrders = await prisma.order.findMany({
      where: { riderId, status: "DELIVERED" },
      orderBy: { deliveredAt: "desc" },
      take: 10,
      include: {
        restaurant: true,
        items: true,
      },
    });

    res.json({ summary, activeOrders, recentOrders });
  } catch (error) {
    console.error("❌ Error in /rider/dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});





/**
 * 10) Combined Earnings API (for Earnings tab)
 * GET /rider/earnings
 * Returns: { summary, hourly, weekly }
 */
router.get("/earnings", async (req: AuthRequest, res) => {
  try {
    const riderId = req.user!.id as number;

    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();

    const weeklyGoal = Number(req.query.weeklyGoal ?? 10000);

    // --- Summary (today + week + goal + avg/hour) ---
    const todayAgg = await prisma.order.aggregate({
      _sum: { riderPayout: true },
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: todayStart, lte: todayEnd } },
    });

    const weekAgg = await prisma.order.aggregate({
      _sum: { riderPayout: true },
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: weekStart, lte: weekEnd } },
    });

    const sessions = await prisma.riderOnlineSession.findMany({
      where: { riderId, startedAt: { lte: weekEnd }, OR: [{ endedAt: { gte: weekStart } }, { endedAt: null }] },
    });

    const now = new Date();
    const ms = sessions.reduce((sum: number, s: typeof sessions[number]): number => {
      const start = s.startedAt < weekStart ? weekStart : s.startedAt;
      const end = s.endedAt ?? now;
      const clampedEnd = end > weekEnd ? weekEnd : end;
      const diff = Math.max(0, clampedEnd.getTime() - start.getTime());
      return sum + diff;
    }, 0);
    const hours = ms / (1000 * 60 * 60);

    const weekTotal = Number(weekAgg._sum.riderPayout ?? 0);
    const avgPerHour = hours > 0 ? weekTotal / hours : 0;
    const weeklyGoalPct = weeklyGoal > 0 ? Math.min(100, Math.round((weekTotal / weeklyGoal) * 100)) : 0;

    const summary = {
      todayTotal: Number(todayAgg._sum.riderPayout ?? 0),
      weekTotal,
      weeklyGoal,
      weeklyGoalPct,
      activeHoursThisWeek: Number(hours.toFixed(2)),
      avgPerHour: Number(avgPerHour.toFixed(2)),
    };

    // --- Hourly breakdown (today) ---
    const deliveredToday = await prisma.order.findMany({
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: todayStart, lte: todayEnd } },
      select: { deliveredAt: true, riderPayout: true },
      orderBy: { deliveredAt: "asc" },
    });

    const hourlyBuckets: Record<string, { orders: number; earnings: number }> = {};
    for (const o of deliveredToday) {
      const d = o.deliveredAt!;
      const hourStart = new Date(d);
      hourStart.setMinutes(0, 0, 0);
      const label = `${hourStart.getHours().toString().padStart(2, "0")}:00-${(hourStart.getHours() + 1)
        .toString()
        .padStart(2, "0")}:00`;
      if (!hourlyBuckets[label]) hourlyBuckets[label] = { orders: 0, earnings: 0 };
      hourlyBuckets[label].orders += 1;
      hourlyBuckets[label].earnings += Number(o.riderPayout);
    }
    const hourly = Object.entries(hourlyBuckets).map(([hour, v]) => ({ hour, ...v }));

    // --- Weekly breakdown (Mon–Sun) ---
    const deliveredWeek = await prisma.order.findMany({
      where: { riderId, status: "DELIVERED", deliveredAt: { gte: weekStart, lte: weekEnd } },
      select: { deliveredAt: true, riderPayout: true },
      orderBy: { deliveredAt: "asc" },
    });

    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyBuckets: Record<string, { orders: number; earnings: number }> = {
      Mon: { orders: 0, earnings: 0 },
      Tue: { orders: 0, earnings: 0 },
      Wed: { orders: 0, earnings: 0 },
      Thu: { orders: 0, earnings: 0 },
      Fri: { orders: 0, earnings: 0 },
      Sat: { orders: 0, earnings: 0 },
      Sun: { orders: 0, earnings: 0 },
    };

    for (const o of deliveredWeek) {
      const dName = weekday[o.deliveredAt!.getDay()];
      weeklyBuckets[dName].orders += 1;
      weeklyBuckets[dName].earnings += Number(o.riderPayout);
    }

    const orderedKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekly = orderedKeys.map((k) => ({ day: k, ...weeklyBuckets[k] }));

    // --- Final combined response ---
    res.json({ summary, hourly, weekly });
  } catch (error) {
    console.error("❌ Error in /rider/earnings:", error);
    res.status(500).json({ error: "Failed to fetch earnings data" });
  }
});





export default router;
